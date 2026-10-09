import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, type InstancedMesh } from 'three'
import { onAIEvent } from '../ai/brain'
import { poolTex } from '../utils/assets'
import { rand } from '../utils/math'
import { fx } from './bus'

const MAX = 16
const UP = { x: 0, y: 1, z: 0 }

interface Pool {
  x: number
  z: number
  size: number
  t: number
}

/** Blood pools under bodies + floor splatter on hits. */
export default function Gore() {
  const mesh = useRef<InstancedMesh>(null)
  const pools = useRef<Pool[]>([])
  const growing = useRef(false)
  const dummy = useMemo(() => new Object3D(), [])
  const map = useMemo(() => poolTex(), [])

  useEffect(
    () =>
      onAIEvent((e) => {
        if (e.type === 'hurt') {
          fx.decal('blood', { x: e.pos.x + rand(-0.5, 0.5), y: 0.01, z: e.pos.z + rand(-0.5, 0.5) }, UP, rand(0.25, 0.5))
        } else if (e.type === 'killed') {
          fx.burst('blood', { x: e.pos.x, y: 1.1, z: e.pos.z }, UP, e.takedown ? 30 : 14)
          const list = pools.current
          if (list.length >= MAX) list.shift()
          list.push({ x: e.pos.x + rand(-0.3, 0.3), z: e.pos.z + rand(-0.3, 0.3), size: rand(1.1, 1.6), t: 0 })
          growing.current = true
        }
      }),
    [],
  )

  useLayoutEffect(() => {
    if (mesh.current) mesh.current.count = 0
  }, [])

  useFrame((_, delta) => {
    const m = mesh.current
    if (!m || !growing.current) return
    const dt = Math.min(delta, 0.05)
    const list = pools.current
    let still = false
    for (let i = 0; i < list.length; i++) {
      const p = list[i]
      p.t = Math.min(1, p.t + dt / 6)
      if (p.t < 1) still = true
      const k = 1 - (1 - p.t) ** 3
      dummy.position.set(p.x, 0.016 + i * 0.0004, p.z)
      dummy.rotation.set(-Math.PI / 2, 0, i * 1.7)
      dummy.scale.setScalar(Math.max(0.05, p.size * k))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.count = list.length
    m.instanceMatrix.needsUpdate = true
    growing.current = still
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={map}
        color="#3a0303"
        roughness={0.15}
        metalness={0.1}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </instancedMesh>
  )
}