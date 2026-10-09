import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, MeshStandardMaterial, PointLight } from 'three'
import { cine } from '../cinematics/theatre'
import { LEVEL } from '../data/level'
import { CHEST_SIZE } from './layout'

const [W, BH, D] = [CHEST_SIZE[0], 0.55, CHEST_SIZE[2]]
const GOLD = { color: '#d4a63a', metalness: 0.9, roughness: 0.28 }

/** Lid, glow and light are driven by `cine` (ChestOpen cinematic). */
export default function Chest() {
  const lid = useRef<Group>(null)
  const light = useRef<PointLight>(null)
  const inner = useRef<MeshStandardMaterial>(null)

  useFrame(() => {
    if (lid.current) lid.current.rotation.x = -cine.lid
    if (light.current) light.current.intensity = cine.glow * 8
    if (inner.current) inner.current.emissiveIntensity = 0.2 + cine.glow
  })

  const [x, z] = LEVEL.chest.pos
  return (
    <group position={[x, 0, z]} rotation-y={LEVEL.chest.yaw}>
      {/* body */}
      <mesh position-y={BH / 2} castShadow receiveShadow>
        <boxGeometry args={[W, BH, D]} />
        <meshStandardMaterial color="#5a3214" roughness={0.7} />
      </mesh>
      {[-0.45, 0.45].map((bx) => (
        <mesh key={bx} position={[bx, BH / 2, 0]}>
          <boxGeometry args={[0.07, BH + 0.01, D + 0.02]} />
          <meshStandardMaterial {...GOLD} />
        </mesh>
      ))}
      <mesh position={[0, BH - 0.12, D / 2 + 0.012]}>
        <boxGeometry args={[0.16, 0.2, 0.025]} />
        <meshStandardMaterial {...GOLD} />
      </mesh>
      {/* glowing interior */}
      <mesh position-y={BH - 0.005} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[W - 0.08, D - 0.08]} />
        <meshStandardMaterial ref={inner} color="#ffcf6b" emissive="#ffb43a" emissiveIntensity={0.2} toneMapped={false} />
      </mesh>
      {/* lid, hinged at the back */}
      <group ref={lid} position={[0, BH, -D / 2]}>
        <mesh position-z={D / 2} rotation-z={Math.PI / 2} castShadow>
          <cylinderGeometry args={[D / 2, D / 2, W, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#62381a" roughness={0.7} side={2} />
        </mesh>
        {[-0.45, 0.45].map((bx) => (
          <mesh key={bx} position={[bx, 0, D / 2]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[D / 2 + 0.012, D / 2 + 0.012, 0.07, 20, 1, false, 0, Math.PI]} />
            <meshStandardMaterial {...GOLD} side={2} />
          </mesh>
        ))}
      </group>
      <pointLight ref={light} position={[0, 1.0, 0.1]} color="#ffcf6b" intensity={0} distance={7} decay={2} />
    </group>
  )
}