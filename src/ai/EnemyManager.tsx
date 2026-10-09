import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Vector3 } from 'three'
import Enemy from './Enemy'
import { enemies, playerSense, resetEnemies, resolveFire, syncView, updateBrain, type EnemyDef } from './brain'
import { BOSS_VISION, GUARD_VISION, computeExposure, type OcclusionTest } from './vision'
import { hear, hearingTick } from './hearing'

const ACTORS = new Set(['enemy', 'player'])

export default function EnemyManager({ defs }: { defs: EnemyDef[] }) {
  const { world, rapier } = useRapier()

  // Side effect only. Always read the registry itself (StrictMode-safe).
  useMemo(() => resetEnemies(defs), [defs])

  /** Only static/kinematic world geometry blocks sight and sound. */
  const occluded = useMemo<OcclusionTest>(() => {
    const ray = new rapier.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 })
    const dir = new Vector3()
    const flags = rapier.QueryFilterFlags.EXCLUDE_DYNAMIC | rapier.QueryFilterFlags.EXCLUDE_SENSORS
    return (from, to) => {
      dir.subVectors(to, from)
      const dist = dir.length()
      if (dist < 0.05) return false
      dir.divideScalar(dist)
      ray.origin = from
      ray.dir = dir
      const hit = world.castRay(ray, dist - 0.05, true, flags, undefined, undefined, undefined, (c) => {
        const type = (c.parent()?.userData as { type?: string } | undefined)?.type
        return !type || !ACTORS.has(type)
      })
      return hit !== null
    }
  }, [world, rapier])

  const eye = useMemo(() => new Vector3(), [])
  const heard = useMemo(() => new Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const p = playerSense
    hearingTick()

    for (const b of enemies.values()) {
      if (b.state === 'dead') continue
      const cfg = b.boss ? BOSS_VISION : GUARD_VISION
      eye.set(b.pos.x, b.pos.y + cfg.eyeHeight, b.pos.z)
      const active = b.state !== 'takedown'

      const exposure = active && p.alive ? computeExposure(eye, b.yaw, p.chest, p.visibility, cfg, occluded) : 0
      const los = exposure > 0 || (b.state === 'combat' && p.alive && !occluded(eye, p.chest))
      const strength = active ? hear(eye, heard, occluded, b.pos) : 0

      updateBrain(b, dt, exposure, los, strength > 0.08 ? heard : null, strength)
      if (b.wantsFire) resolveFire(b)
      syncView(b, dt)
    }
  })

  return (
    <>
      {[...enemies.values()].map((b) => (
        <Enemy key={b.id} brain={b} />
      ))}
    </>
  )
}