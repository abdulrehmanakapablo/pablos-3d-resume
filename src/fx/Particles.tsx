import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Object3D, Vector3, type InstancedMesh } from 'three'
import { useQuality } from '../hooks/useQuality'
import { rand } from '../utils/math'
import { fxQueue, type BurstKind } from './bus'

interface Cfg {
  speed: [number, number]
  spread: number
  ttl: [number, number]
  size: [number, number]
  gravity: number
  drag: number
  stretch: number
  stick: boolean
  fade: boolean
  color: Color
}

const KINDS: BurstKind[] = ['spark', 'blood', 'dust']
const CFG: Record<BurstKind, Cfg> = {
  spark: { speed: [2.5, 7], spread: 0.9, ttl: [0.18, 0.45], size: [0.01, 0.02], gravity: 9.8, drag: 1.5, stretch: 0.9, stick: false, fade: true, color: new Color(6, 3.2, 1) },
  blood: { speed: [1.2, 4.2], spread: 0.6, ttl: [0.6, 1.2], size: [0.018, 0.045], gravity: 9.8, drag: 0.6, stretch: 0.25, stick: true, fade: false, color: new Color(0.3, 0.01, 0.01) },
  dust: { speed: [0.3, 1.2], spread: 1, ttl: [0.6, 1.2], size: [0.03, 0.07], gravity: -0.4, drag: 2.2, stretch: 0, stick: false, fade: true, color: new Color(0.55, 0.52, 0.48) },
}

/** Pooled struct-of-arrays particles in one instanced draw call. */
export default function Particles() {
  const max = useQuality().particles
  const mesh = useRef<InstancedMesh>(null)
  const d = useMemo(
    () => ({
      p: new Float32Array(max * 3),
      v: new Float32Array(max * 3),
      life: new Float32Array(max),
      ttl: new Float32Array(max),
      size: new Float32Array(max),
      kind: new Uint8Array(max),
      n: 0,
    }),
    [max],
  )
  const dummy = useMemo(() => new Object3D(), [])
  const tmp = useMemo(() => new Vector3(), [])

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < max; i++) m.setColorAt(i, CFG.spark.color)
    m.count = 0
  }, [max])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m) return
    const dt = Math.min(delta, 0.05)

    for (const b of fxQueue.bursts) {
      const k = KINDS.indexOf(b.kind)
      const c = CFG[b.kind]
      for (let j = 0; j < b.count && d.n < max; j++) {
        const i = d.n++
        const o = i * 3
        tmp
          .set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .multiplyScalar(2 * c.spread)
          .add(b.dir)
          .normalize()
          .multiplyScalar(rand(c.speed[0], c.speed[1]))
        d.p[o] = b.pos.x
        d.p[o + 1] = b.pos.y
        d.p[o + 2] = b.pos.z
        d.v[o] = tmp.x
        d.v[o + 1] = tmp.y
        d.v[o + 2] = tmp.z
        d.life[i] = 0
        d.ttl[i] = rand(c.ttl[0], c.ttl[1])
        d.size[i] = rand(c.size[0], c.size[1])
        d.kind[i] = k
      }
    }
    fxQueue.bursts.length = 0
    if (d.n === 0 && m.count === 0) return

    // simulate, swap-remove expired
    let i = 0
    while (i < d.n) {
      const o = i * 3
      d.life[i] += dt
      if (d.life[i] >= d.ttl[i]) {
        const last = --d.n
        if (i !== last) {
          const l = last * 3
          d.p[o] = d.p[l]
          d.p[o + 1] = d.p[l + 1]
          d.p[o + 2] = d.p[l + 2]
          d.v[o] = d.v[l]
          d.v[o + 1] = d.v[l + 1]
          d.v[o + 2] = d.v[l + 2]
          d.life[i] = d.life[last]
          d.ttl[i] = d.ttl[last]
          d.size[i] = d.size[last]
          d.kind[i] = d.kind[last]
        }
        continue
      }
      const c = CFG[KINDS[d.kind[i]]]
      const drag = Math.max(0, 1 - c.drag * dt)
      d.v[o] *= drag
      d.v[o + 1] = (d.v[o + 1] - c.gravity * dt) * drag
      d.v[o + 2] *= drag
      d.p[o] += d.v[o] * dt
      d.p[o + 1] += d.v[o + 1] * dt
      d.p[o + 2] += d.v[o + 2] * dt
      if (d.p[o + 1] < 0.01) {
        d.p[o + 1] = 0.01
        if (c.stick) d.v[o] = d.v[o + 1] = d.v[o + 2] = 0
        else {
          d.v[o] *= 0.6
          d.v[o + 1] *= -0.35
          d.v[o + 2] *= 0.6
        }
      }
      i++
    }

    for (let j = 0; j < d.n; j++) {
      const o = j * 3
      const c = CFG[KINDS[d.kind[j]]]
      const vx = d.v[o]
      const vy = d.v[o + 1]
      const vz = d.v[o + 2]
      const sp = Math.sqrt(vx * vx + vy * vy + vz * vz)
      dummy.position.set(d.p[o], d.p[o + 1], d.p[o + 2])
      if (sp > 0.05) {
        tmp.set(d.p[o] + vx, d.p[o + 1] + vy, d.p[o + 2] + vz)
        dummy.lookAt(tmp)
      }
      const s = d.size[j] * (c.fade ? 1 - d.life[j] / d.ttl[j] : 1)
      dummy.scale.set(s, s, s * (1 + sp * c.stretch))
      dummy.updateMatrix()
      m.setMatrixAt(j, dummy.matrix)
      m.setColorAt(j, c.color)
    }
    m.count = d.n
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, max]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  )
}