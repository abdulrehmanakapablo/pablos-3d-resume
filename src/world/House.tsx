import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Instance, Instances } from '@react-three/drei'
import type { MeshStandardMaterial, PointLight } from 'three'
import { LEVEL, type Surface } from '../data/level'
import { concreteTex, grassTex, plasterTex, tiled, tileTex, woodTex } from '../utils/assets'
import { DOOR_HEIGHT, WALLS } from './layout'

const H = LEVEL.wallHeight
const T = LEVEL.wallThickness
const [hx0, hz0] = LEVEL.house.min
const [hx1, hz1] = LEVEL.house.max
const HW = hx1 - hx0
const HD = hz1 - hz0
const HCX = (hx0 + hx1) / 2
const HCZ = (hz0 + hz1) / 2

const FLOOR: Record<Surface, () => ReturnType<typeof woodTex>> = {
  wood: woodTex,
  tile: tileTex,
  concrete: concreteTex,
  grass: grassTex,
}

function Floors() {
  const floors = useMemo(
    () =>
      LEVEL.rooms.map((r) => {
        const w = r.max[0] - r.min[0]
        const d = r.max[1] - r.min[1]
        return { r, w, d, map: tiled(FLOOR[r.surface](), w / 3, d / 3) }
      }),
    [],
  )
  return (
    <>
      {floors.map(({ r, w, d, map }) => (
        <mesh
          key={r.id}
          rotation-x={-Math.PI / 2}
          position={[(r.min[0] + r.max[0]) / 2, 0.005, (r.min[1] + r.max[1]) / 2]}
          receiveShadow
        >
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial map={map} roughness={r.surface === 'tile' ? 0.35 : 0.72} />
        </mesh>
      ))}
    </>
  )
}

function Walls() {
  const walls = useMemo(
    () => WALLS.map((w) => ({ w, map: tiled(plasterTex(), Math.max(w.sx, w.sz) / 2.5, H / 2.5) })),
    [],
  )
  return (
    <>
      {walls.map(({ w, map }, i) => {
        const along = w.sx > w.sz
        return (
          <group key={i}>
            <mesh position={[w.cx, H / 2, w.cz]} castShadow receiveShadow>
              <boxGeometry args={[w.sx, H, w.sz]} />
              <meshStandardMaterial map={map} roughness={0.92} />
            </mesh>
            {/* baseboard */}
            <mesh position={[w.cx, 0.07, w.cz]}>
              <boxGeometry args={along ? [w.sx, 0.14, w.sz + 0.04] : [w.sx + 0.04, 0.14, w.sz]} />
              <meshStandardMaterial color="#3a2618" roughness={0.6} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

function DoorFrames() {
  const map = useMemo(() => plasterTex(), [])
  const lintel = H - DOOR_HEIGHT
  return (
    <>
      {LEVEL.doors.map((d) => (
        <group key={d.id} position={[d.pos[0], 0, d.pos[1]]} rotation-y={d.axis === 'x' ? 0 : Math.PI / 2}>
          <mesh position-y={DOOR_HEIGHT + lintel / 2} castShadow>
            <boxGeometry args={[d.width, lintel, T]} />
            <meshStandardMaterial map={map} roughness={0.92} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * (d.width / 2 - 0.04), DOOR_HEIGHT / 2, 0]}>
              <boxGeometry args={[0.08, DOOR_HEIGHT, T + 0.06]} />
              <meshStandardMaterial color="#3d2817" roughness={0.55} />
            </mesh>
          ))}
          <mesh position-y={DOOR_HEIGHT + 0.04}>
            <boxGeometry args={[d.width, 0.08, T + 0.06]} />
            <meshStandardMaterial color="#3d2817" roughness={0.55} />
          </mesh>
        </group>
      ))}
    </>
  )
}

function Roof() {
  return (
    <>
      <mesh rotation-x={Math.PI / 2} position={[HCX, H - 0.001, HCZ]}>
        <planeGeometry args={[HW, HD]} />
        <meshStandardMaterial color="#e9dfcf" roughness={0.95} />
      </mesh>
      <mesh position={[HCX, H + 0.15, HCZ]} castShadow>
        <boxGeometry args={[HW + 0.8, 0.3, HD + 0.8]} />
        <meshStandardMaterial color="#2c2727" roughness={0.9} />
      </mesh>
      <mesh position={[HCX + 6, H + 1.1, HCZ - 4]} castShadow>
        <boxGeometry args={[0.9, 1.6, 0.9]} />
        <meshStandardMaterial color="#5b3a2e" roughness={0.9} />
      </mesh>
    </>
  )
}

function lcg(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function Trees() {
  const trees = useMemo(() => {
    const r = lcg(1337)
    const out: { x: number; z: number; s: number }[] = []
    const [gx0, gz0] = LEVEL.ground.min
    const [gx1, gz1] = LEVEL.ground.max
    let guard = 0
    while (out.length < 34 && guard++ < 4000) {
      const x = gx0 + 2 + r() * (gx1 - gx0 - 4)
      const z = gz0 + 2 + r() * (gz1 - gz0 - 4)
      if (x > hx0 - 4 && x < hx1 + 4 && z > hz0 - 4 && z < hz1 + 4) continue
      if (Math.abs(x) < 5 && z > hz1) continue
      if (x < -2 && x > -12 && z > 17 && z < 26) continue
      if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3)) continue
      out.push({ x, z, s: 0.8 + r() * 0.9 })
    }
    return out
  }, [])

  return (
    <>
      <Instances limit={trees.length} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 1.6, 6]} />
        <meshStandardMaterial color="#3b2a1c" roughness={0.9} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 0.8 * t.s, t.z]} scale={t.s} />
        ))}
      </Instances>
      <Instances limit={trees.length} castShadow>
        <coneGeometry args={[1.5, 3.4, 8]} />
        <meshStandardMaterial color="#163020" roughness={0.85} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 2.9 * t.s, t.z]} scale={t.s} />
        ))}
      </Instances>
      <Instances limit={trees.length} castShadow>
        <coneGeometry args={[1.1, 2.4, 8]} />
        <meshStandardMaterial color="#1c3b27" roughness={0.85} />
        {trees.map((t, i) => (
          <Instance key={i} position={[t.x, 4.2 * t.s, t.z]} scale={t.s} />
        ))}
      </Instances>
    </>
  )
}

/** SWAT van with alternating light bar. */
function Van() {
  const red = useRef<PointLight>(null)
  const blue = useRef<PointLight>(null)
  const redM = useRef<MeshStandardMaterial>(null)
  const blueM = useRef<MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const on = Math.floor(clock.elapsedTime * 3) % 2 === 0
    if (red.current) red.current.intensity = on ? 40 : 0
    if (blue.current) blue.current.intensity = on ? 0 : 40
    if (redM.current) redM.current.emissiveIntensity = on ? 8 : 0.3
    if (blueM.current) blueM.current.emissiveIntensity = on ? 0.3 : 8
  })

  return (
    <group position={[-7, 0, 21.5]} rotation-y={0.35}>
      <mesh position-y={1.15} castShadow>
        <boxGeometry args={[2.2, 1.7, 5]} />
        <meshStandardMaterial color="#1b2430" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.35, 2.3]}>
        <boxGeometry args={[2.0, 0.6, 0.45]} />
        <meshStandardMaterial color="#0b0f14" roughness={0.1} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <boxGeometry args={[2.22, 0.22, 4.6]} />
        <meshStandardMaterial color="#f2f2f2" roughness={0.5} />
      </mesh>
      {[-1.5, 1.5].flatMap((z) =>
        [-1.1, 1.1].map((x) => (
          <mesh key={`${x}${z}`} position={[x, 0.38, z]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.38, 0.38, 0.26, 16]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        )),
      )}
      <mesh position={[-0.4, 2.08, 1.2]}>
        <boxGeometry args={[0.7, 0.14, 0.3]} />
        <meshStandardMaterial ref={redM} color="#ff2a2a" emissive="#ff2a2a" toneMapped={false} />
      </mesh>
      <mesh position={[0.4, 2.08, 1.2]}>
        <boxGeometry args={[0.7, 0.14, 0.3]} />
        <meshStandardMaterial ref={blueM} color="#2a6bff" emissive="#2a6bff" toneMapped={false} />
      </mesh>
      <pointLight ref={red} position={[-0.6, 2.4, 1.2]} color="#ff2a2a" distance={18} decay={2} />
      <pointLight ref={blue} position={[0.6, 2.4, 1.2]} color="#2a6bff" distance={18} decay={2} />
    </group>
  )
}

function Exterior() {
  const grass = useMemo(() => {
    const [gx0, gz0] = LEVEL.ground.min
    const [gx1, gz1] = LEVEL.ground.max
    return { map: tiled(grassTex(), (gx1 - gx0) / 4, (gz1 - gz0) / 4), w: gx1 - gx0, d: gz1 - gz0, cx: (gx0 + gx1) / 2, cz: (gz0 + gz1) / 2 }
  }, [])
  const path = useMemo(() => tiled(concreteTex(), 1, 5), [])

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[grass.cx, 0, grass.cz]} receiveShadow>
        <planeGeometry args={[grass.w, grass.d]} />
        <meshStandardMaterial map={grass.map} roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[-3, 0.01, 16.5]} receiveShadow>
        <planeGeometry args={[2, 12]} />
        <meshStandardMaterial map={path} roughness={0.95} />
      </mesh>
      <mesh position={[-3, 0.06, 10.9]} receiveShadow castShadow>
        <boxGeometry args={[4, 0.12, 1.6]} />
        <meshStandardMaterial color="#5c5a55" roughness={0.9} />
      </mesh>
      <Trees />
      <Van />
    </>
  )
}

export default function House() {
  return (
    <>
      <Floors />
      <Walls />
      <DoorFrames />
      <Roof />
      <Exterior />
    </>
  )
}