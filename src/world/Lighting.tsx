import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import type { PointLight } from 'three'
import { LEVEL } from '../data/level'
import { useQuality } from '../hooks/useQuality'

const H = LEVEL.wallHeight

interface LightCfg {
  color: string
  intensity: number
  shadow?: boolean
  flicker?: boolean
}

const ROOM_LIGHT: Record<string, LightCfg> = {
  living: { color: '#ffb46e', intensity: 38, shadow: true },
  kitchen: { color: '#eaf1ff', intensity: 34 },
  hall: { color: '#ffc58f', intensity: 16 },
  storage: { color: '#b8f0c4', intensity: 22, flicker: true },
  study: { color: '#ffcf7a', intensity: 40, shadow: true },
}

function RoomLight({ x, z, cfg, shadow }: { x: number; z: number; cfg: LightCfg; shadow: boolean }) {
  const light = useRef<PointLight>(null)

  useFrame(({ clock }) => {
    const l = light.current
    if (!cfg.flicker || !l) return
    const t = clock.elapsedTime
    const on = Math.sin(t * 13) + Math.sin(t * 7.3) > -1.3 && Math.random() > 0.04
    l.intensity = cfg.intensity * (on ? 0.9 + Math.random() * 0.1 : 0.15)
  })

  return (
    <group position={[x, H - 0.05, z]}>
      <mesh position-y={-0.12}>
        <cylinderGeometry args={[0.28, 0.4, 0.22, 16, 1, true]} />
        <meshStandardMaterial color="#2a2522" side={2} roughness={0.6} />
      </mesh>
      <mesh position-y={-0.2}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={cfg.color} emissive={cfg.color} emissiveIntensity={6} toneMapped={false} />
      </mesh>
      <pointLight
        ref={light}
        position-y={-0.35}
        color={cfg.color}
        intensity={cfg.intensity}
        distance={16}
        decay={2}
        castShadow={shadow}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
      />
    </group>
  )
}

export default function Lighting() {
  const q = useQuality()
  return (
    <>
      <color attach="background" args={['#060a14']} />
      <fog attach="fog" args={['#0a1020', 28, 130]} />
      <Stars radius={160} depth={40} count={2500} factor={4} fade speed={0.3} />
      <hemisphereLight args={['#4a5f8f', '#1a1410', 0.3]} />

      {/* moonlight; remounts when shadow resolution changes */}
      <directionalLight
        key={`${q.shadowMap}-${q.shadows}`}
        position={[-30, 45, 25]}
        intensity={0.9}
        color="#9fb5ff"
        castShadow={q.shadows}
        shadow-mapSize={[q.shadowMap, q.shadowMap]}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      {LEVEL.rooms.map((r) => {
        const cfg = ROOM_LIGHT[r.id]
        if (!cfg) return null
        return (
          <RoomLight
            key={r.id}
            x={(r.min[0] + r.max[0]) / 2}
            z={(r.min[1] + r.max[1]) / 2}
            cfg={cfg}
            shadow={q.pointShadows && !!cfg.shadow}
          />
        )
      })}
    </>
  )
}