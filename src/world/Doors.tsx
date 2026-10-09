import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CuboidCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { Quaternion, Vector3 } from 'three'
import { enemies } from '../ai/brain'
import { play } from '../audio/AudioManager'
import { LEVEL, type DoorDef } from '../data/level'
import { useMission } from '../game/missionStore'
import { damp } from '../utils/math'
import { DOOR_HEIGHT } from './layout'

const UP = new Vector3(0, 1, 0)
const OPEN = -1.75
const DH = DOOR_HEIGHT - 0.02

function Door({ d }: { d: DoorDef }) {
  const body = useRef<RapierRigidBody>(null)
  const angle = useRef(0)
  const q = useMemo(() => new Quaternion(), [])
  const open = useMission((s) => s.openDoors.includes(d.id))
  const locked = useMission((s) => !!d.lockedBy && !s.items.includes(d.lockedBy) && !s.openDoors.includes(d.id))

  const horiz = d.axis === 'x'
  const base = horiz ? 0 : -Math.PI / 2
  const w = d.width - 0.06
  const hinge: [number, number, number] = horiz
    ? [d.pos[0] - d.width / 2 + 0.03, 0, d.pos[1]]
    : [d.pos[0], 0, d.pos[1] - d.width / 2 + 0.03]

  useFrame((_, delta) => {
    const target = open ? OPEN : 0
    if (Math.abs(angle.current - target) < 0.001) return
    angle.current = damp(angle.current, target, 5, Math.min(delta, 0.05))
    q.setFromAxisAngle(UP, base + angle.current)
    body.current?.setNextKinematicRotation(q)
  })

  const lockColor = locked ? '#ef4444' : '#22c55e'

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={hinge}
      rotation={[0, base, 0]}
      userData={{ type: 'door', id: d.id }}
    >
      <CuboidCollider args={[w / 2, DH / 2, 0.035]} position={[w / 2, DH / 2, 0]} />
      <mesh position={[w / 2, DH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, DH, 0.06]} />
        <meshStandardMaterial color="#6b4528" roughness={0.55} />
      </mesh>
      {[0.6, 1.55].map((y) => (
        <mesh key={y} position={[w / 2, y, 0]}>
          <boxGeometry args={[w - 0.25, 0.7, 0.075]} />
          <meshStandardMaterial color="#5a3920" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[w - 0.1, 1.0, 0]}>
        <boxGeometry args={[0.04, 0.04, 0.14]} />
        <meshStandardMaterial color="#c9a227" metalness={0.9} roughness={0.25} />
      </mesh>
      {d.lockedBy && (
        <mesh position={[w - 0.1, 1.2, 0]}>
          <boxGeometry args={[0.07, 0.1, 0.1]} />
          <meshStandardMaterial color={lockColor} emissive={lockColor} emissiveIntensity={3} toneMapped={false} />
        </mesh>
      )}
    </RigidBody>
  )
}

/** All doors + enemies opening closed doors they walk into. */
export default function Doors() {
  const acc = useRef(0)

  useFrame((_, dt) => {
    acc.current += dt
    if (acc.current < 0.2) return
    acc.current = 0
    const m = useMission.getState()
    for (const d of LEVEL.doors) {
      if (m.openDoors.includes(d.id)) continue
      for (const b of enemies.values()) {
        if (b.state === 'dead' || b.state === 'takedown') continue
        if ((b.pos.x - d.pos[0]) ** 2 + (b.pos.z - d.pos[1]) ** 2 > 1.6) continue
        m.openDoor(d.id)
        play('doorOpen', { pos: { x: d.pos[0], y: 1, z: d.pos[1] } })
        break
      }
    }
  })

  return (
    <>
      {LEVEL.doors.map((d) => (
        <Door key={d.id} d={d} />
      ))}
    </>
  )
}
