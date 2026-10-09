import { Vector3 } from 'three'
import type { OcclusionTest } from './vision'

export type NoiseSource = 'player' | 'enemy' | 'world'

/** Audible radius in meters. */
export const NOISE = {
  crouchStep: 1.5,
  walkStep: 4,
  runStep: 9,
  land: 6,
  suppressedShot: 11,
  bulletImpact: 7,
  door: 6,
  bodyFall: 8,
  enemyFire: 32,
} as const

interface Noise {
  pos: Vector3
  radius: number
  loudness: number
  source: NoiseSource
  tick: number
}

const SIZE = 32
const ring: Noise[] = Array.from({ length: SIZE }, () => ({
  pos: new Vector3(),
  radius: 0,
  loudness: 0,
  source: 'world' as NoiseSource,
  tick: -10,
}))
let head = 0
let tick = 0

/** Once per frame, before any hear(). A noise lives for its frame + the next. */
export function hearingTick() {
  tick++
}

export function emitNoise(
  pos: { x: number; y: number; z: number },
  radius: number,
  loudness = 1,
  source: NoiseSource = 'player',
) {
  const n = ring[head]
  head = (head + 1) % SIZE
  n.pos.set(pos.x, pos.y, pos.z)
  n.radius = radius
  n.loudness = loudness
  n.source = source
  n.tick = tick
}

/** Strongest noise heard (0..1). Writes its position into `out`. */
export function hear(ear: Vector3, out: Vector3, occluded: OcclusionTest, self?: Vector3): number {
  let best = 0
  for (let i = 0; i < SIZE; i++) {
    const n = ring[i]
    if (tick - n.tick > 1) continue
    if (self && n.source === 'enemy' && (n.pos.x - self.x) ** 2 + (n.pos.z - self.z) ** 2 < 0.36) continue
    const d = n.pos.distanceTo(ear)
    if (d >= n.radius) continue
    let s = n.loudness * (1 - d / n.radius)
    if (s <= best) continue
    if (occluded(ear, n.pos)) s *= 0.4
    if (s > best) {
      best = s
      out.copy(n.pos)
    }
  }
  return best
}