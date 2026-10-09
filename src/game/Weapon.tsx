import { useEffect, useMemo, useRef } from 'react'
import { createPortal, useFrame, useThree } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Vector3, type Group } from 'three'
import { damageEnemy, enemies, playerSense } from '../ai/brain'
import { emitNoise, NOISE } from '../ai/hearing'
import { play } from '../audio/AudioManager'
import { fx } from '../fx/bus'
import MuzzleFlash from '../fx/MuzzleFlash'
import { clamp, damp, rand, wrapAngle } from '../utils/math'
import { castRay, createRayHit } from '../utils/raycast'
import { PLAYER, WEAPON } from './constants'
import { consume, look, rig } from './inputStore'
import { useMission } from './missionStore'

const METAL = { color: '#1d2126', metalness: 0.85, roughness: 0.32 }

export default function Weapon() {
  const root = useRef<Group>(null)
  const gun = useRef<Group>(null)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  const { world, rapier } = useRapier()
  const st = useRef({ cd: 0, reload: 0, kick: 0, swayX: 0, swayY: 0, yaw: 0, pitch: 0 })
  const tmp = useMemo(
    () => ({
      dir: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      origin: new Vector3(),
      hit: createRayHit(),
      exit: createRayHit(),
    }),
    [],
  )

  // gun lives under the camera → zero-lag view model
  useEffect(() => {
    scene.add(camera)
    return () => {
      scene.remove(camera)
    }
  }, [scene, camera])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = st.current
    const m = useMission.getState()
    const playing = m.phase === 'playing'

    const shoot = () => {
      s.cd = WEAPON.fireInterval
      s.kick = 1
      look.recoil += WEAPON.recoil
      fx.muzzle()
      play('pistolShot')
      emitNoise(playerSense.pos, NOISE.suppressedShot, 1, 'player')

      camera.updateMatrixWorld()
      const spread = playerSense.speed > 0.5 ? WEAPON.spreadMove : WEAPON.spreadIdle
      camera.getWorldDirection(tmp.dir)
      tmp.right.setFromMatrixColumn(camera.matrixWorld, 0)
      tmp.up.setFromMatrixColumn(camera.matrixWorld, 1)
      tmp.dir
        .addScaledVector(tmp.right, rand(-spread, spread))
        .addScaledVector(tmp.up, rand(-spread, spread))
        .normalize()
      tmp.origin.copy(camera.position)

      const h = tmp.hit
      if (!castRay(world, rapier, tmp.origin, tmp.dir, WEAPON.range, h, rig.body)) return

      if (h.type === 'enemy' && h.id) {
        const b = enemies.get(h.id)
        if (!b) return
        const headshot = h.point.y - b.pos.y > (b.boss ? 1.6 : 1.42)
        damageEnemy(b, WEAPON.damage, headshot, playerSense.pos)
        m.registerHit()
        fx.hit(headshot)
        fx.burst('blood', h.point, tmp.dir, headshot ? 40 : 22)
        // exit-wound splatter on whatever is behind
        tmp.origin.copy(h.point).addScaledVector(tmp.dir, 0.6)
        const e = tmp.exit
        if (castRay(world, rapier, tmp.origin, tmp.dir, 3.5, e, b.view.body) && e.type !== 'enemy' && e.type !== 'player') {
          fx.decal('blood', e.point, e.normal, rand(0.5, 1.1))
        }
        return
      }

      fx.burst('spark', h.point, h.normal, 14)
      fx.burst('dust', h.point, h.normal, 6)
      fx.decal('hole', h.point, h.normal, 0.12)
      play('impactWall', { pos: h.point })
      emitNoise(h.point, NOISE.bulletImpact, 0.8, 'world')
    }

    s.cd -= dt
    if (m.reloading) {
      s.reload += dt
      if (s.reload >= WEAPON.reloadTime) {
        s.reload = 0
        m.finishReload()
      }
    }

    const wantReload = consume('reload')
    const wantFire = consume('fire')
    if (playing) {
      if (wantReload && m.startReload()) play('reload')
      if (wantFire && !m.reloading && s.cd <= 0) {
        if (m.mag <= 0) {
          if (m.startReload()) play('reload')
          else play('pistolDry')
        } else if (m.fire()) shoot()
      }
    }

    /* view-model animation */
    const dYaw = wrapAngle(look.yaw - s.yaw)
    const dPitch = look.pitch - s.pitch
    s.yaw = look.yaw
    s.pitch = look.pitch
    s.swayX = damp(s.swayX, clamp(dYaw * 0.6, -0.05, 0.05), 10, dt)
    s.swayY = damp(s.swayY, clamp(-dPitch * 0.6, -0.04, 0.04), 10, dt)
    s.kick = damp(s.kick, 0, 16, dt)

    const r = root.current
    const g = gun.current
    if (!r || !g) return
    r.visible = playing || m.phase === 'paused'
    if (!r.visible) return
    const k = m.reloading ? Math.sin(Math.min(1, s.reload / WEAPON.reloadTime) * Math.PI) : 0
    const t = performance.now() * 0.001
    const mv = Math.min(1, playerSense.speed / PLAYER.run)
    g.position.set(
      0.19 + s.swayX + Math.cos(t * 8) * 0.008 * mv,
      -0.2 + s.swayY + Math.sin(t * 1.7) * 0.003 - Math.abs(Math.sin(t * 8)) * 0.012 * mv - k * 0.12,
      -0.42 + s.kick * 0.07,
    )
    g.rotation.set(s.kick * 0.2 + k * 0.9, s.swayX * 1.5, -k * 0.5)
  })

  return createPortal(
    <group ref={root}>
      <group ref={gun}>
        {/* slide */}
        <mesh position={[0, 0.03, -0.02]}>
          <boxGeometry args={[0.034, 0.034, 0.2]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        {/* frame */}
        <mesh position={[0, 0.002, -0.01]}>
          <boxGeometry args={[0.03, 0.024, 0.17]} />
          <meshStandardMaterial color="#2a2e35" metalness={0.6} roughness={0.45} />
        </mesh>
        {/* grip */}
        <mesh position={[0, -0.055, 0.05]} rotation-x={0.22}>
          <boxGeometry args={[0.03, 0.11, 0.046]} />
          <meshStandardMaterial color="#141619" roughness={0.85} />
        </mesh>
        {/* suppressor */}
        <mesh position={[0, 0.03, -0.2]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.017, 0.017, 0.17, 18]} />
          <meshStandardMaterial color="#0e0f11" metalness={0.7} roughness={0.4} />
        </mesh>
        {/* sights */}
        <mesh position={[0, 0.05, -0.1]}>
          <boxGeometry args={[0.006, 0.008, 0.008]} />
          <meshStandardMaterial color="#9ae66e" emissive="#9ae66e" emissiveIntensity={2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.05, 0.065]}>
          <boxGeometry args={[0.022, 0.008, 0.008]} />
          <meshStandardMaterial {...METAL} />
        </mesh>
        {/* gloved hand + sleeve */}
        <mesh position={[0, -0.07, 0.07]}>
          <boxGeometry args={[0.065, 0.065, 0.09]} />
          <meshStandardMaterial color="#232323" roughness={0.9} />
        </mesh>
        <mesh position={[0.01, -0.09, 0.26]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.045, 0.052, 0.34, 14]} />
          <meshStandardMaterial color="#1b2633" roughness={0.95} />
        </mesh>
        <MuzzleFlash position={[0, 0.03, -0.295]} />
      </group>
    </group>,
    camera,
  )
}