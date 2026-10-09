import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Object3D, Vector3, type InstancedMesh } from 'three'
import { holeTex, splatTex } from '../utils/assets'
import { fxQueue, type DecalKind } from './bus'

const MAX = 96

/** Bullet holes + blood splats: two ring-buffered instanced meshes. */
export default function Decals() {
  const holes = useRef<InstancedMesh>(null)
  const blood = useRef<InstancedMesh>(null)
  const ring = useRef<Record<DecalKind, { i: number; n: number }>>({
    hole: { i: 0, n: 0 },
    blood: { i: 0, n: 0 },
  })
  const dummy = useMemo(() => new Object3D(), [])
  const target = useMemo(() => new Vector3(), [])
  const maps = useMemo(() => ({ hole: holeTex(), blood: splatTex() }), [])

  useLayoutEffect(() => {
    if (holes.current) holes.current.count = 0
    if (blood.current) blood.current.count = 0
  }, [])

  useFrame(() => {
    const q = fxQueue.decals
    if (!q.length) return
    for (const d of q) {
      const m = d.kind === 'hole' ? holes.current : blood.current
      if (!m) continue
      const r = ring.current[d.kind]
      dummy.position.copy(d.pos).addScaledVector(d.normal, 0.008 + r.i * 0.00002)
      target.copy(dummy.position).add(d.normal)
      dummy.lookAt(target)
      dummy.rotateZ(Math.random() * Math.PI * 2)
      dummy.scale.setScalar(d.size)
      dummy.updateMatrix()
      m.setMatrixAt(r.i, dummy.matrix)
      r.i = (r.i + 1) % MAX
      r.n = Math.min(MAX, r.n + 1)
      m.count = r.n
      m.instanceMatrix.needsUpdate = true
    }
    q.length = 0
  })

  return (
    <>
      <instancedMesh ref={holes} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={maps.hole}
          color="#1a1a1a"
          roughness={0.9}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4}
        />
      </instancedMesh>
      <instancedMesh ref={blood} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshStandardMaterial
          map={maps.blood}
          color="#4a0404"
          roughness={0.25}
          metalness={0.05}
          transparent
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-4}
        />
      </instancedMesh>
    </>
  )
}