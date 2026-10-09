import { BufferAttribute, BufferGeometry } from 'three'
import type { V2 } from '../ai/brain'
import { LEVEL, type Surface } from '../data/level'

/** Wall box on the ground plane: center + full size (thickness included). */
export interface WallSeg {
  cx: number
  cz: number
  sx: number
  sz: number
}

export const DOOR_HEIGHT = 2.2
const T = LEVEL.wallThickness
type Interval = [number, number]

function union(list: Interval[]): Interval[] {
  const s = [...list].sort((a, b) => a[0] - b[0])
  const out: Interval[] = []
  for (const [a, b] of s) {
    const last = out[out.length - 1]
    if (last && a <= last[1] + 1e-3) last[1] = Math.max(last[1], b)
    else out.push([a, b])
  }
  return out
}

function cut(list: Interval[], a: number, b: number): Interval[] {
  const out: Interval[] = []
  for (const [s, e] of list) {
    if (b <= s || a >= e) {
      out.push([s, e])
      continue
    }
    if (a > s) out.push([s, a])
    if (b < e) out.push([b, e])
  }
  return out
}

/** Walls derived from room rectangles, merged, corner-filled, door gaps cut. */
function buildWalls(): WallSeg[] {
  const H = new Map<number, Interval[]>()
  const V = new Map<number, Interval[]>()
  const add = (m: Map<number, Interval[]>, k: number, a: number, b: number) => {
    const l = m.get(k)
    if (l) l.push([a, b])
    else m.set(k, [[a, b]])
  }
  for (const r of LEVEL.rooms) {
    add(H, r.min[1], r.min[0], r.max[0])
    add(H, r.max[1], r.min[0], r.max[0])
    add(V, r.min[0], r.min[1], r.max[1])
    add(V, r.max[0], r.min[1], r.max[1])
  }
  const segs: WallSeg[] = []
  const emit = (m: Map<number, Interval[]>, horizontal: boolean) => {
    for (const [k, raw] of m) {
      let list = union(raw).map(([a, b]): Interval => [a - T / 2, b + T / 2])
      for (const d of LEVEL.doors) {
        if ((d.axis === 'x') !== horizontal) continue
        if (Math.abs((horizontal ? d.pos[1] : d.pos[0]) - k) > 1e-3) continue
        const c = horizontal ? d.pos[0] : d.pos[1]
        list = cut(list, c - d.width / 2, c + d.width / 2)
      }
      for (const [a, b] of list)
        segs.push(
          horizontal
            ? { cx: (a + b) / 2, cz: k, sx: b - a, sz: T }
            : { cx: k, cz: (a + b) / 2, sx: T, sz: b - a },
        )
    }
  }
  emit(H, true)
  emit(V, false)
  return segs
}

export const WALLS = buildWalls()

/* ---------- props ---------- */

export type PropKind = 'box' | 'rug' | 'table' | 'counter' | 'sofa' | 'shelf' | 'crate'

export interface PropDef {
  kind: PropKind
  pos: V2
  /** width (x), height, depth (z) before rotation */
  size: [number, number, number]
  color: string
  rot?: number
  solid?: boolean
}

export const PROPS: PropDef[] = [
  // living
  { kind: 'sofa', pos: [-6, 9.35], size: [3, 0.85, 0.95], color: '#55678c' },
  { kind: 'counter', pos: [-11.6, 5], size: [0.5, 0.6, 2.2], color: '#3a2f2a' },
  { kind: 'table', pos: [-10, 8], size: [0.6, 0.7, 0.6], color: '#7a4f30' },
  { kind: 'table', pos: [-6, 4.5], size: [1.4, 0.45, 0.8], color: '#6b4426' },
  { kind: 'rug', pos: [-6, 4.5], size: [5, 0.02, 3.4], color: '#7a2e2e', solid: false },
  // kitchen
  { kind: 'counter', pos: [11.45, 6], size: [0.9, 0.95, 6], color: '#d7cfbf' },
  { kind: 'counter', pos: [6, 5], size: [2.4, 0.95, 1.2], color: '#cfc5b2' },
  { kind: 'box', pos: [11.4, 1], size: [0.9, 2, 0.8], color: '#c7ccd4' },
  { kind: 'counter', pos: [3, 9.3], size: [1.2, 0.95, 0.9], color: '#d7cfbf' },
  { kind: 'table', pos: [10, 2], size: [0.7, 0.95, 0.7], color: '#8a5a36' },
  // hall
  { kind: 'table', pos: [0, -0.9], size: [1.2, 0.75, 0.45], color: '#5a3a22' },
  { kind: 'rug', pos: [0, -2], size: [22, 0.02, 1.4], color: '#33445e', solid: false },
  // storage
  { kind: 'shelf', pos: [-11.55, -9], size: [0.6, 2.2, 6], color: '#5d5d5d' },
  { kind: 'crate', pos: [-3, -12.6], size: [1, 1, 1], color: '#8a6a43' },
  { kind: 'crate', pos: [-1.8, -12.9], size: [0.9, 0.7, 0.8], color: '#7c5f3c' },
  { kind: 'crate', pos: [-3, -10], size: [0.8, 0.8, 0.8], color: '#8a6a43' },
  { kind: 'crate', pos: [-1.5, -6], size: [1, 1, 1], color: '#7c5f3c' },
  { kind: 'table', pos: [-9, -12.6], size: [1.6, 0.85, 0.8], color: '#4a3a2a' },
  // study
  { kind: 'table', pos: [2, -12.9], size: [2, 0.8, 0.9], color: '#5c3a1e' },
  { kind: 'shelf', pos: [11.6, -9], size: [0.6, 2.4, 5], color: '#4e3220', rot: Math.PI },
  { kind: 'rug', pos: [6, -11.5], size: [4, 0.02, 3], color: '#5e1f2a', solid: false },
]

export function footprint(p: PropDef): [number, number] {
  return Math.abs(Math.sin(p.rot ?? 0)) > 0.5 ? [p.size[2], p.size[0]] : [p.size[0], p.size[2]]
}

export const CHEST_SIZE: [number, number, number] = [1.4, 0.85, 0.9]

/* ---------- surfaces ---------- */

export function surfaceAt(x: number, z: number): Surface {
  for (const r of LEVEL.rooms)
    if (x >= r.min[0] && x <= r.max[0] && z >= r.min[1] && z <= r.max[1]) return r.surface
  return 'grass'
}

/* ---------- navmesh (0.5 m grid, walls/props carved out) ---------- */

const NAV_MIN: V2 = [-14, -16]
const NAV_MAX: V2 = [14, 26]
const CELL = 0.5
const AGENT = 0.3

export function buildNavGeometry(): BufferGeometry {
  const nx = Math.round((NAV_MAX[0] - NAV_MIN[0]) / CELL)
  const nz = Math.round((NAV_MAX[1] - NAV_MIN[1]) / CELL)

  const blockers: [number, number, number, number][] = []
  const block = (cx: number, cz: number, sx: number, sz: number) =>
    blockers.push([cx - sx / 2 - AGENT, cz - sz / 2 - AGENT, cx + sx / 2 + AGENT, cz + sz / 2 + AGENT])
  for (const w of WALLS) block(w.cx, w.cz, w.sx, w.sz)
  for (const p of PROPS) {
    if (p.solid === false) continue
    const [sx, sz] = footprint(p)
    block(p.pos[0], p.pos[1], sx, sz)
  }
  block(LEVEL.chest.pos[0], LEVEL.chest.pos[1], CHEST_SIZE[0], CHEST_SIZE[2])

  const free = (x: number, z: number) => {
    for (const b of blockers) if (x > b[0] && x < b[2] && z > b[1] && z < b[3]) return false
    return true
  }

  const pos = new Float32Array((nx + 1) * (nz + 1) * 3)
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const o = (j * (nx + 1) + i) * 3
      pos[o] = NAV_MIN[0] + i * CELL
      pos[o + 2] = NAV_MIN[1] + j * CELL
    }

  const idx: number[] = []
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      if (!free(NAV_MIN[0] + (i + 0.5) * CELL, NAV_MIN[1] + (j + 0.5) * CELL)) continue
      const a = j * (nx + 1) + i
      const b = a + 1
      const d = a + nx + 1
      const c = d + 1
      // CCW seen from +Y
      idx.push(a, d, c, a, c, b)
    }

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setIndex(idx)
  return g
}