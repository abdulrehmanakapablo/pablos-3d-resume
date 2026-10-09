import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Object3D, type PerspectiveCamera, type SpotLight } from 'three'
import { playerSense } from '../ai/brain'
import { emitNoise, NOISE } from '../ai/hearing'
import { play, setListener } from '../audio/AudioManager'
import { cine } from '../cinematics/theatre'
import { LEVEL } from '../data/level'
import { useQuality } from '../hooks/useQuality'
import { clamp, damp } from '../utils/math'
import { surfaceAt } from '../world/layout'
import { PLAYER, SURFACE_SOUND } from './constants'
import { consume, input, look, pollGamepad, rig } from './inputStore'
import { useMission } from './missionStore'
import { useSettings } from './settingsStore'

const [SX, SZ] = LEVEL.spawn.pos
/** Level yaw (forward = sin, cos) → camera yaw (forward = -sin, -cos). */
const SPAWN_YAW = LEVEL.spawn.yaw - Math.PI
type Gait = keyof typeof PLAYER.stride

export default function Player() {
  const body = useRef<RapierRigidBody>(null)
  const light = useRef<SpotLight>(null)
  const target = useMemo(() => new Object3D(), [])
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const q = useQuality()
  const st = useRef({ eye: PLAYER.eye, step: 0, bob: 0, fall: 0 })

  useEffect(() => {
    look.yaw = SPAWN_YAW
    look.pitch = 0
    look.recoil = 0
    rig.body = body.current
    rig.flashlight = true
    camera.rotation.order = 'YXZ'
    return () => {
      rig.body = null
    }
  }, [camera])

  useFrame((state, delta) => {
    const rb = body.current
    if (!rb) return
    const dt = Math.min(delta, 0.05)
    const s = st.current
    const { phase } = useMission.getState()
    const { sensitivity, fov } = useSettings.getState()
    const playing = phase === 'playing'
    const dead = phase === 'dead'
    pollGamepad()

    /* look */
    if (playing) {
      const k = (input.touch ? PLAYER.touchLookSpeed : PLAYER.lookSpeed) * sensitivity
      look.yaw -= input.lookX * k
      look.pitch = clamp(look.pitch - input.lookY * k, -PLAYER.pitchLimit, PLAYER.pitchLimit)
      if (consume('flashlight')) {
        rig.flashlight = !rig.flashlight
        play('uiClick')
      }
    }
    input.lookX = input.lookY = 0
    look.recoil = damp(look.recoil, 0, 9, dt)

    /* move */
    const lv = rb.linvel()
    let speed = 0
    let gait: Gait = 'walk'
    if (playing) {
      const sy = Math.sin(look.yaw)
      const cy = Math.cos(look.yaw)
      let mx = input.moveX * cy - input.moveY * sy
      let mz = -input.moveX * sy - input.moveY * cy
      const ml = Math.hypot(mx, mz)
      if (ml > 1) {
        mx /= ml
        mz /= ml
      }
      const sprint = !input.crouch && input.moveY > 0.3 && (input.sprint || (input.touch && ml > 0.95))
      gait = input.crouch ? 'crouch' : sprint ? 'run' : 'walk'
      const max = PLAYER[gait]
      const a = 1 - Math.exp(-PLAYER.accel * dt)
      const vx = lv.x + (mx * max - lv.x) * a
      const vz = lv.z + (mz * max - lv.z) * a
      rb.setLinvel({ x: vx, y: lv.y, z: vz }, true)
      speed = Math.hypot(vx, vz)
    } else {
      rb.setLinvel({ x: 0, y: lv.y, z: 0 }, true)
    }

    const p = rb.translation()
    if (p.y < -5) rb.setTranslation({ x: SX, y: 0.1, z: SZ }, true)
    s.eye = damp(s.eye, playing && input.crouch ? PLAYER.crouchEye : PLAYER.eye, 12, dt)

    /* footsteps → sound + AI noise */
    if (playing && speed > 0.4) {
      s.step += speed * dt
      s.bob += speed * dt * 2.2
      if (s.step >= PLAYER.stride[gait]) {
        s.step = 0
        play(SURFACE_SOUND[surfaceAt(p.x, p.z)], { volume: gait === 'crouch' ? 0.35 : gait === 'run' ? 1 : 0.65 })
        emitNoise(p, gait === 'crouch' ? NOISE.crouchStep : gait === 'run' ? NOISE.runStep : NOISE.walkStep, 1, 'player')
      }
    }

    /* what the AI perceives */
    playerSense.pos.set(p.x, p.y, p.z)
    playerSense.chest.set(p.x, p.y + s.eye - 0.25, p.z)
    playerSense.speed = speed
    playerSense.alive = playing
    playerSense.visibility =
      (input.crouch ? 0.55 : 1) * (rig.flashlight ? 1.3 : 1) * (gait === 'run' && speed > 1 ? 1.15 : 1)

    /* camera */
    s.fall = dead ? damp(s.fall, 1, 2.5, dt) : 0
    if (!cine.ownsCamera && (playing || dead || phase === 'paused')) {
      const bobY = playing ? Math.sin(s.bob * 2) * 0.03 * Math.min(1, speed / PLAYER.run) : 0
      camera.position.set(p.x, p.y + s.eye + bobY - s.fall * (s.eye - 0.3), p.z)
      camera.rotation.set(look.pitch + look.recoil, look.yaw, s.fall * 0.8)
      const aspect = state.size.width / state.size.height
      const f = aspect < 1 ? Math.min(95, fov * (1 + (1 - aspect) * 0.5)) : fov
      if (Math.abs(camera.fov - f) > 0.01) {
        camera.fov = f
        camera.updateProjectionMatrix()
      }
    }
    camera.getWorldDirection(rig.forward)
    rig.eye.copy(camera.position)
    setListener(rig.eye, rig.forward)

    /* flashlight */
    const l = light.current
    if (l) {
      l.visible = rig.flashlight && (playing || phase === 'paused')
      l.position.copy(rig.eye).addScaledVector(rig.forward, 0.2)
      target.position.copy(rig.eye).addScaledVector(rig.forward, 8)
    }
  })

  return (
    <>
      <RigidBody
        ref={body}
        position={[SX, 0.1, SZ]}
        colliders={false}
        enabledRotations={[false, false, false]}
        canSleep={false}
        userData={{ type: 'player' }}
      >
        <CapsuleCollider
          args={[PLAYER.halfHeight, PLAYER.radius]}
          position={[0, PLAYER.halfHeight + PLAYER.radius, 0]}
          friction={0}
        />
      </RigidBody>
      <primitive object={target} />
      <spotLight
        ref={light}
        target={target}
        color="#fff1dc"
        intensity={60}
        distance={26}
        angle={0.4}
        penumbra={0.6}
        decay={2}
        castShadow={q.shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
    </>
  )
}