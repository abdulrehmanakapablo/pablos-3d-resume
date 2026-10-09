import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { getProject, types, type IProject, type ISheet, type ISheetObject } from '@theatre/core'
import type { Camera, PerspectiveCamera } from 'three'
import { LEVEL } from '../data/level'

/** Dev only: open with ?studio to author keyframes, export JSON to src/cinematics/theatre-state.json */
export const STUDIO =
  import.meta.env.DEV && typeof location !== 'undefined' && new URLSearchParams(location.search).has('studio')

const authored = import.meta.glob('./theatre-state.json', { eager: true, import: 'default' })
const STATE = Object.values(authored)[0]
export const HAS_AUTHORED = STATE !== undefined

let project: IProject | null = null
const getProj = () =>
  (project ??= getProject(
    'Operation Scroll',
    HAS_AUTHORED ? ({ state: STATE } as Parameters<typeof getProject>[1]) : undefined,
  ))

/** Await in main.tsx before rendering. No-op in production. */
export async function initStudio() {
  if (!STUDIO) return
  const { default: studio } = await import('@theatre/studio')
  studio.initialize()
}

/** Shared mutable state read by Player (camera ownership), Chest, Scrolls and UI. */
export const cine = { active: false, ownsCamera: false, skip: false, fade: 0, lid: 0, glow: 0, rise: 0 }

export function resetCine() {
  Object.assign(cine, { active: false, ownsCamera: false, skip: false, fade: 0, lid: 0, glow: 0, rise: 0 })
}

/* ---------- shot schema ---------- */

const shotProps = {
  cam: types.compound({ x: types.number(0), y: types.number(2), z: types.number(10) }),
  target: types.compound({ x: types.number(0), y: types.number(1), z: types.number(0) }),
  fov: types.number(50, { range: [10, 100] }),
  fx: types.compound({
    fade: types.number(0, { range: [0, 1] }),
    lid: types.number(0, { range: [0, 2.2] }),
    glow: types.number(0, { range: [0, 10] }),
    rise: types.number(0, { range: [0, 3] }),
  }),
}

type P3 = { x: number; y: number; z: number }
export interface ShotValues {
  cam: P3
  target: P3
  fov: number
  fx: { fade: number; lid: number; glow: number; rise: number }
}

type Channel = 'camX' | 'camY' | 'camZ' | 'tgtX' | 'tgtY' | 'tgtZ' | 'fov' | 'fade' | 'lid' | 'glow' | 'rise'
type Track = [t: number, v: number][]
type Tracks = Partial<Record<Channel, Track>>

/** Catmull-Rom between keys, eased in on the first segment and out on the last. */
function sampleTrack(tr: Track | undefined, t: number, def: number): number {
  if (!tr?.length) return def
  const n = tr.length
  if (t <= tr[0][0]) return tr[0][1]
  if (t >= tr[n - 1][0]) return tr[n - 1][1]
  let i = 1
  while (tr[i][0] < t) i++
  const [t1, v1] = tr[i - 1]
  const [t2, v2] = tr[i]
  let k = (t - t1) / (t2 - t1 || 1)
  const first = i === 1
  const last = i === n - 1
  if (first && last) k = k * k * (3 - 2 * k)
  else if (first) k = k * k * (2 - k)
  else if (last) k = k * (1 + k - k * k)
  const v0 = i > 1 ? tr[i - 2][1] : v1
  const v3 = i < n - 1 ? tr[i + 1][1] : v2
  const k2 = k * k
  return 0.5 * (2 * v1 + (v2 - v0) * k + (2 * v0 - 5 * v1 + 4 * v2 - v3) * k2 + (3 * v1 - v0 - 3 * v2 + v3) * k2 * k)
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export interface Shot {
  name: string
  length: number
  sample: (t: number) => ShotValues
}

function createShot(name: string, length: number, tracks: Tracks): Shot {
  let sheet: ISheet | null = null
  let obj: ISheetObject<typeof shotProps> | null = null
  const out: ShotValues = {
    cam: { x: 0, y: 0, z: 0 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
    fx: { fade: 0, lid: 0, glow: 0, rise: 0 },
  }
  return {
    name,
    length,
    sample(t) {
      if (HAS_AUTHORED || STUDIO) {
        sheet ??= getProj().sheet(name)
        obj ??= sheet.object('Shot', shotProps)
        if (!STUDIO) sheet.sequence.position = Math.min(t, length)
        return obj.value as ShotValues
      }
      const s = (c: Channel, d: number) => sampleTrack(tracks[c], t, d)
      out.cam.x = s('camX', 0)
      out.cam.y = s('camY', 2)
      out.cam.z = s('camZ', 10)
      out.target.x = s('tgtX', 0)
      out.target.y = s('tgtY', 1)
      out.target.z = s('tgtZ', 0)
      out.fov = s('fov', 50)
      out.fx.fade = clamp01(s('fade', 0))
      out.fx.lid = Math.max(0, s('lid', 0))
      out.fx.glow = Math.max(0, s('glow', 0))
      out.fx.rise = Math.max(0, s('rise', 0))
      return out
    },
  }
}

/* ---------- fallback shots (used until Theatre keyframes are authored) ---------- */

export const BRIEFING_SHOT = createShot('Briefing', 11.5, {
  camX: [[0, -34], [4, -14], [8, 16], [11.5, -3]],
  camY: [[0, 20], [4, 12], [8, 7], [11.5, 2.1]],
  camZ: [[0, 42], [4, 34], [8, 26], [11.5, 15.5]],
  tgtX: [[0, 0], [8, -1], [11.5, -3]],
  tgtY: [[0, 2], [8, 2], [11.5, 1.7]],
  tgtZ: [[0, -2], [8, 2], [11.5, 10]],
  fov: [[0, 38], [8, 45], [11.5, 60]],
  fade: [[0, 1], [1.2, 0], [10.6, 0], [11.5, 1]],
})

const [cx, cz] = LEVEL.chest.pos
export const CHEST_SHOT = createShot('ChestOpen', 7.5, {
  camX: [[0, cx], [2.2, cx + 1.3], [4.5, cx + 0.6], [7, cx]],
  camY: [[0, 1.65], [2.2, 1.0], [4.5, 1.5], [7, 2.0]],
  camZ: [[0, cz + 2.6], [2.2, cz + 1.7], [4.5, cz + 2.6], [7, cz + 3.4]],
  tgtX: [[0, cx], [7, cx]],
  tgtY: [[0, 0.5], [2.2, 0.55], [4.5, 1.1], [7, 1.6]],
  tgtZ: [[0, cz], [7, cz]],
  fov: [[0, 55], [2.2, 42], [4.5, 45], [7, 50]],
  lid: [[1.2, 0], [2.8, 1.9]],
  glow: [[1, 0], [3, 6], [7, 4]],
  rise: [[3.2, 0], [6.2, 1.4]],
})

/* ---------- player ---------- */

export function applyCamera(camera: Camera, v: ShotValues, aspect: number) {
  camera.position.set(v.cam.x, v.cam.y, v.cam.z)
  camera.lookAt(v.target.x, v.target.y, v.target.z)
  const cam = camera as PerspectiveCamera
  if (!cam.isPerspectiveCamera) return
  // portrait phones: widen FOV so the subject stays in frame
  const fov = aspect < 1 ? Math.min(85, v.fov * (1 + (1 - aspect) * 0.6)) : v.fov
  if (Math.abs(cam.fov - fov) > 0.01) {
    cam.fov = fov
    cam.updateProjectionMatrix()
  }
}

/** Drives camera + fx from a shot. Set cine.skip = true to jump to the end. */
export function useShotPlayer(shot: Shot, onDone: () => void, onFx?: (fx: ShotValues['fx']) => void) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const t = useRef(0)
  const finished = useRef(false)
  const done = useRef(onDone)

  useEffect(() => {
    done.current = onDone
  }, [onDone])

  useEffect(() => {
    cine.active = true
    cine.ownsCamera = true
    cine.skip = false
    return () => {
      cine.active = false
      cine.ownsCamera = false
      cine.fade = 0
    }
  }, [])

  useFrame((_, dt) => {
    if (finished.current) return
    t.current = cine.skip ? shot.length : t.current + Math.min(dt, 0.05)
    const v = shot.sample(t.current)
    applyCamera(camera, v, size.width / size.height)
    cine.fade = cine.skip ? 0 : v.fx.fade
    onFx?.(v.fx)
    if (cine.skip || (!STUDIO && t.current >= shot.length)) {
      finished.current = true
      done.current()
    }
  })
}