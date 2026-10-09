import { Vector3 } from 'three'

export type BurstKind = 'spark' | 'blood' | 'dust'
export type DecalKind = 'hole' | 'blood'
type P3 = { x: number; y: number; z: number }

export interface Burst {
  kind: BurstKind
  pos: Vector3
  dir: Vector3
  count: number
}

export interface DecalReq {
  kind: DecalKind
  pos: Vector3
  normal: Vector3
  size: number
}

/** Producer → consumer queues, drained once per frame by the fx components. */
export const fxQueue = { bursts: [] as Burst[], decals: [] as DecalReq[] }

/** Timestamps (performance.now) read by MuzzleFlash and the crosshair. */
export const fxState = { muzzleAt: -1e9, hitAt: -1e9, headshot: false }

const MAX_QUEUE = 48
const v3 = (p: P3) => new Vector3(p.x, p.y, p.z)

export const fx = {
  burst(kind: BurstKind, pos: P3, dir: P3, count: number) {
    if (fxQueue.bursts.length < MAX_QUEUE) fxQueue.bursts.push({ kind, pos: v3(pos), dir: v3(dir), count })
  },
  decal(kind: DecalKind, pos: P3, normal: P3, size: number) {
    if (fxQueue.decals.length < MAX_QUEUE) fxQueue.decals.push({ kind, pos: v3(pos), normal: v3(normal), size })
  },
  muzzle() {
    fxState.muzzleAt = performance.now()
  },
  hit(headshot: boolean) {
    fxState.hitAt = performance.now()
    fxState.headshot = headshot
  },
}