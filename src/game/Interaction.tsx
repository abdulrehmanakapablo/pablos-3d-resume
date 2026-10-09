import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { canTakedown, enemies, playerSense, startTakedown, type EnemyBrain } from '../ai/brain'
import { emitNoise, NOISE } from '../ai/hearing'
import { play } from '../audio/AudioManager'
import { LEVEL, type DoorDef, type PickupDef, type PickupKind } from '../data/level'
import { INTERACT, PICKUP } from './constants'
import { consume, look, rig } from './inputStore'
import { BOSS_ID, useMission, type MissionState } from './missionStore'

type Target =
  | { kind: 'takedown'; b: EnemyBrain }
  | { kind: 'pickup'; p: PickupDef }
  | { kind: 'door'; d: DoorDef }
  | { kind: 'chest' }
  | null

const LABEL: Record<PickupKind, string> = { key: 'study key', intel: 'intel', ammo: 'ammo', health: 'med kit' }
const [CX, CZ] = LEVEL.chest.pos

/** Distance if within range and roughly in view, else -1. */
function inView(x: number, z: number, max: number): number {
  const dx = x - rig.eye.x
  const dz = z - rig.eye.z
  const d = Math.hypot(dx, dz)
  if (d > max) return -1
  if (d < 0.6) return d
  const f = Math.hypot(rig.forward.x, rig.forward.z) || 1
  return (dx * rig.forward.x + dz * rig.forward.z) / (d * f) > 0.35 ? d : -1
}

const isLocked = (d: DoorDef, m: MissionState) =>
  !!d.lockedBy && !m.items.includes(d.lockedBy) && !m.openDoors.includes(d.id)

function scan(m: MissionState): Target {
  for (const b of enemies.values()) if (canTakedown(b, playerSense.pos)) return { kind: 'takedown', b }

  let best: Target = null
  let bestD = Infinity
  for (const p of LEVEL.pickups) {
    if (m.taken.includes(p.id)) continue
    const d = inView(p.pos[0], p.pos[1], PICKUP.range)
    if (d >= 0 && d < bestD) {
      best = { kind: 'pickup', p }
      bestD = d
    }
  }
  for (const door of LEVEL.doors) {
    const d = inView(door.pos[0], door.pos[1], INTERACT.door)
    if (d >= 0 && d < bestD) {
      best = { kind: 'door', d: door }
      bestD = d
    }
  }
  const c = inView(CX, CZ, INTERACT.chest)
  if (c >= 0 && c < bestD) best = { kind: 'chest' }
  return best
}

function promptOf(t: Target, m: MissionState): string | null {
  if (!t) return null
  switch (t.kind) {
    case 'takedown':
      return 'Takedown'
    case 'pickup':
      return `Pick up ${LABEL[t.p.kind]}`
    case 'door':
      if (isLocked(t.d, m)) return 'Locked'
      return m.openDoors.includes(t.d.id) ? 'Close door' : 'Open door'
    case 'chest':
      return m.kills.includes(BOSS_ID) ? 'Open the chest' : 'Sealed: the guardian still lives'
  }
  return null
}

function act(t: NonNullable<Target>, m: MissionState) {
  switch (t.kind) {
    case 'takedown':
      startTakedown(t.b)
      look.recoil += 0.06
      return
    case 'pickup': {
      const p = t.p
      m.take(p.id)
      play(p.kind === 'key' ? 'keyPickup' : 'pickup')
      if (p.kind === 'key') {
        m.addItem(p.id)
        m.toast('Study key acquired', 'gold')
      } else if (p.kind === 'intel') m.showIntel(p.ref ?? null)
      else if (p.kind === 'ammo') {
        m.addAmmo(PICKUP.ammo)
        m.toast(`+${PICKUP.ammo} rounds`)
      } else {
        m.heal(PICKUP.health)
        m.toast(`+${PICKUP.health} health`, 'good')
      }
      return
    }
    case 'door': {
      const pos = { x: t.d.pos[0], y: 1, z: t.d.pos[1] }
      if (isLocked(t.d, m)) {
        play('doorLocked', { pos })
        m.toast('Locked. Find the key.', 'bad')
        return
      }
      m.toggleDoor(t.d.id)
      play('doorOpen', { pos })
      emitNoise(pos, NOISE.door, 0.7, 'player')
      return
    }
    case 'chest':
      if (!m.kills.includes(BOSS_ID)) {
        m.toast('Neutralize the guardian first', 'bad')
        return
      }
      play('chestOpen')
      m.openChest()
  }
}

export default function Interaction() {
  const target = useRef<Target>(null)
  const acc = useRef(0)

  useFrame((_, dt) => {
    const m = useMission.getState()
    if (m.phase !== 'playing') {
      if (m.prompt) m.setPrompt(null)
      consume('interact')
      return
    }
    if (m.intel) {
      if (consume('interact')) m.showIntel(null)
      return
    }
    acc.current += dt
    if (acc.current >= 1 / INTERACT.scanHz) {
      acc.current = 0
      target.current = scan(m)
      m.setPrompt(promptOf(target.current, m))
    }
    if (consume('interact') && target.current) {
      act(target.current, m)
      target.current = null
    }
  })

  return null
}