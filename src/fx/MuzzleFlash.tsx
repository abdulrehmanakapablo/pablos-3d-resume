import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, type Group, type PointLight } from 'three'
import { glowTex } from '../utils/assets'
import { fxState } from './bus'

const DURATION = 55

export default function MuzzleFlash({ position }: { position: [number, number, number] }) {
  const flash = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const map = useMemo(() => glowTex(), [])

  useFrame(() => {
    const t = performance.now() - fxState.muzzleAt
    const on = t < DURATION
    const g = flash.current
    if (g) {
      g.visible = on
      if (on) {
        g.rotation.z = Math.random() * Math.PI
        g.scale.setScalar(0.75 + Math.random() * 0.5)
      }
    }
    if (light.current) light.current.intensity = on ? 8 * (1 - t / DURATION) : 0
  })

  return (
    <group position={position}>
      <group ref={flash} visible={false}>
        <mesh>
          <planeGeometry args={[0.14, 0.14]} />
          <meshBasicMaterial map={map} color="#ffd38a" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh rotation-z={Math.PI / 4}>
          <planeGeometry args={[0.24, 0.045]} />
          <meshBasicMaterial map={map} color="#fff1c2" transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
      <pointLight ref={light} color="#ffb35c" intensity={0} distance={6} decay={2} />
    </group>
  )
}