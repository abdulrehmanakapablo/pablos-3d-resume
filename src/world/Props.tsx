import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import type { Group } from 'three'
import { LEVEL, type PickupDef } from '../data/level'
import { useMission } from '../game/missionStore'
import { tiled, woodTex } from '../utils/assets'
import { PROPS, type PropDef } from './layout'

const BOOK_COLORS = ['#7c2d12', '#1e3a8a', '#14532d', '#713f12', '#581c87', '#9f1239', '#334155', '#a16207']

function lcg(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function Shelf({ p }: { p: PropDef }) {
  const [w, h, d] = p.size
  const levels = 4
  const books = useMemo(() => {
    const r = lcg(Math.abs(Math.round(p.pos[0] * 97 + p.pos[1] * 31)) + 11)
    const out: { pos: [number, number, number]; scale: [number, number, number]; color: string }[] = []
    for (let s = 0; s < levels; s++) {
      const y = 0.08 + (s * (h - 0.15)) / levels
      let z = -d / 2 + 0.06
      while (z < d / 2 - 0.1) {
        const t = 0.04 + r() * 0.05
        const bh = 0.22 + r() * 0.16
        if (r() > 0.12)
          out.push({
            pos: [0.04, y + bh / 2, z + t / 2],
            scale: [w * 0.75, bh, t],
            color: BOOK_COLORS[(r() * BOOK_COLORS.length) | 0],
          })
        z += t + 0.005
      }
    }
    return out
  }, [p, w, h, d])

  return (
    <>
      <mesh position={[-w / 2 + 0.02, h / 2, 0]} castShadow>
        <boxGeometry args={[0.04, h, d]} />
        <meshStandardMaterial color={p.color} roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, h / 2, (s * d) / 2]} castShadow>
          <boxGeometry args={[w, h, 0.04]} />
          <meshStandardMaterial color={p.color} roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: levels + 1 }, (_, s) => (
        <mesh key={s} position={[0, 0.04 + (s * (h - 0.15)) / levels, 0]} receiveShadow>
          <boxGeometry args={[w, 0.035, d]} />
          <meshStandardMaterial color={p.color} roughness={0.7} />
        </mesh>
      ))}
      <Instances limit={books.length} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.8} />
        {books.map((b, i) => (
          <Instance key={i} position={b.pos} scale={b.scale} color={b.color} />
        ))}
      </Instances>
    </>
  )
}

function PropMesh({ p }: { p: PropDef }) {
  const [w, h, d] = p.size
  const crate = useMemo(() => (p.kind === 'crate' ? tiled(woodTex(), 1, 1) : null), [p.kind])

  switch (p.kind) {
    case 'rug':
      return (
        <mesh rotation-x={-Math.PI / 2} position-y={0.012} receiveShadow>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color={p.color} roughness={1} />
        </mesh>
      )
    case 'table':
      return (
        <>
          <mesh position-y={h - 0.03} castShadow receiveShadow>
            <boxGeometry args={[w, 0.06, d]} />
            <meshStandardMaterial color={p.color} roughness={0.55} />
          </mesh>
          {[-1, 1].flatMap((sx) =>
            [-1, 1].map((sz) => (
              <mesh key={`${sx}${sz}`} position={[sx * (w / 2 - 0.06), (h - 0.06) / 2, sz * (d / 2 - 0.06)]} castShadow>
                <boxGeometry args={[0.06, h - 0.06, 0.06]} />
                <meshStandardMaterial color={p.color} roughness={0.6} />
              </mesh>
            )),
          )}
        </>
      )
    case 'counter':
      return (
        <>
          <mesh position-y={(h - 0.04) / 2} castShadow receiveShadow>
            <boxGeometry args={[w, h - 0.04, d]} />
            <meshStandardMaterial color={p.color} roughness={0.6} />
          </mesh>
          <mesh position-y={h - 0.02} castShadow receiveShadow>
            <boxGeometry args={[w + 0.04, 0.04, d + 0.04]} />
            <meshStandardMaterial color="#ece8e1" roughness={0.25} />
          </mesh>
        </>
      )
    case 'sofa':
      return (
        <>
          <mesh position-y={0.225} castShadow receiveShadow>
            <boxGeometry args={[w, 0.45, d]} />
            <meshStandardMaterial color={p.color} roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.65, d / 2 - 0.11]} castShadow>
            <boxGeometry args={[w, 0.45, 0.22]} />
            <meshStandardMaterial color={p.color} roughness={0.95} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (w / 2 - 0.1), 0.32, 0]} castShadow>
              <boxGeometry args={[0.2, 0.64, d]} />
              <meshStandardMaterial color={p.color} roughness={0.95} />
            </mesh>
          ))}
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x * (w - 0.5) * 0.5, 0.5, -0.05]} castShadow>
              <boxGeometry args={[(w - 0.5) / 2 - 0.04, 0.1, d - 0.3]} />
              <meshStandardMaterial color="#6d80a8" roughness={0.95} />
            </mesh>
          ))}
        </>
      )
    case 'shelf':
      return <Shelf p={p} />
    case 'crate':
      return (
        <mesh position-y={h / 2} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial map={crate} color={p.color} roughness={0.85} />
        </mesh>
      )
    default:
      return (
        <mesh position-y={h / 2} castShadow receiveShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={p.color} roughness={0.5} metalness={0.1} />
        </mesh>
      )
  }
}

function PickupModel({ kind }: { kind: PickupDef['kind'] }) {
  switch (kind) {
    case 'key':
      return (
        <group rotation-z={Math.PI / 2}>
          <mesh position-y={0.08}>
            <torusGeometry args={[0.045, 0.014, 10, 24]} />
            <meshStandardMaterial color="#f5c542" emissive="#f59e0b" emissiveIntensity={2.5} metalness={0.9} roughness={0.2} toneMapped={false} />
          </mesh>
          <mesh position-y={-0.02}>
            <boxGeometry args={[0.018, 0.16, 0.018]} />
            <meshStandardMaterial color="#f5c542" emissive="#f59e0b" emissiveIntensity={2.5} metalness={0.9} roughness={0.2} toneMapped={false} />
          </mesh>
          <mesh position={[0.025, -0.08, 0]}>
            <boxGeometry args={[0.04, 0.02, 0.018]} />
            <meshStandardMaterial color="#f5c542" emissive="#f59e0b" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        </group>
      )
    case 'intel':
      return (
        <>
          <mesh>
            <boxGeometry args={[0.24, 0.02, 0.32]} />
            <meshStandardMaterial color="#c9a86a" emissive="#c9a86a" emissiveIntensity={0.6} roughness={0.8} />
          </mesh>
          <mesh position={[0.05, 0.012, -0.08]}>
            <boxGeometry args={[0.09, 0.005, 0.05]} />
            <meshStandardMaterial color="#b91c1c" emissive="#ef4444" emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        </>
      )
    case 'ammo':
      return (
        <mesh>
          <boxGeometry args={[0.22, 0.12, 0.12]} />
          <meshStandardMaterial color="#4b5320" emissive="#84cc16" emissiveIntensity={0.35} roughness={0.7} />
        </mesh>
      )
    default:
      return (
        <>
          <mesh>
            <boxGeometry args={[0.25, 0.18, 0.12]} />
            <meshStandardMaterial color="#f4f4f5" roughness={0.5} />
          </mesh>
          <mesh position-z={0.062}>
            <boxGeometry args={[0.12, 0.035, 0.005]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh position-z={0.062}>
            <boxGeometry args={[0.035, 0.12, 0.005]} />
            <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </>
      )
  }
}

function Pickup({ p }: { p: PickupDef }) {
  const g = useRef<Group>(null)
  useFrame(({ clock }) => {
    const n = g.current
    if (!n) return
    const t = clock.elapsedTime
    n.rotation.y = t * 1.4
    n.position.y = 0.06 + Math.sin(t * 2 + p.pos[0]) * 0.035
  })
  return (
    <group position={[p.pos[0], p.y, p.pos[1]]}>
      <group ref={g}>
        <PickupModel kind={p.kind} />
      </group>
    </group>
  )
}

function Pickups() {
  const taken = useMission((s) => s.taken)
  return (
    <>
      {LEVEL.pickups
        .filter((p) => !taken.includes(p.id))
        .map((p) => (
          <Pickup key={p.id} p={p} />
        ))}
    </>
  )
}

export default function Props() {
  return (
    <>
      {PROPS.map((p, i) => (
        <group key={i} position={[p.pos[0], 0, p.pos[1]]} rotation-y={p.rot ?? 0}>
          <PropMesh p={p} />
        </group>
      ))}
      <Pickups />
    </>
  )
}