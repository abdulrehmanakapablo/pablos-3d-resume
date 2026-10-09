import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import { play } from '../audio/AudioManager'
import { cine } from '../cinematics/theatre'
import { SCROLLS, type ScrollId } from '../data/cv'
import { LEVEL } from '../data/level'
import { useMission } from '../game/missionStore'

const [X, Z] = LEVEL.chest.pos

function pick(id: ScrollId) {
  const m = useMission.getState()
  if (m.phase !== 'scrolls') return
  play('scrollUnroll')
  m.setScroll(id)
}

/** Four CV scrolls that rise out of the chest (driven by cine.rise). */
export default function Scrolls() {
  const root = useRef<Group>(null)
  const items = useRef<(Group | null)[]>([])
  const phase = useMission((s) => s.phase)
  const active = useMission((s) => s.scroll)

  useFrame(({ clock }) => {
    const g = root.current
    if (!g) return
    g.visible = cine.rise > 0.01
    if (!g.visible) return
    const t = clock.elapsedTime
    items.current.forEach((it, i) => {
      if (!it) return
      it.position.y = 0.35 + cine.rise * (0.78 + Math.sin(t * 1.4 + i) * 0.035)
      it.rotation.y = Math.sin(t * 0.5 + i) * 0.35
    })
  })

  return (
    <group ref={root} position={[X, 0, Z]} rotation-y={LEVEL.chest.yaw} visible={false}>
      {SCROLLS.map((s, i) => {
        const on = s.id === active
        return (
          <group
            key={s.id}
            ref={(el) => {
              items.current[i] = el
            }}
            position={[(i - 1.5) * 0.32, 0.35, 0.05]}
            onClick={(e) => {
              e.stopPropagation()
              pick(s.id)
            }}
            onPointerOver={() => {
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = ''
            }}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.055, 0.055, 0.4, 20]} />
              <meshStandardMaterial
                color="#f3e2bd"
                emissive="#ffd98a"
                emissiveIntensity={on ? 0.9 : 0.15}
                roughness={0.85}
              />
            </mesh>
            {[-0.215, 0.215].map((y) => (
              <mesh key={y} position-y={y}>
                <cylinderGeometry args={[0.07, 0.07, 0.035, 16]} />
                <meshStandardMaterial color="#4a2a12" roughness={0.5} metalness={0.2} />
              </mesh>
            ))}
            <mesh rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.058, 0.008, 8, 24]} />
              <meshStandardMaterial color="#9f1239" roughness={0.6} />
            </mesh>
            {phase === 'scrolls' && (
              <Html center position={[0, 0.34, 0]} distanceFactor={3.2} zIndexRange={[25, 0]}>
                <button
                  onClick={() => pick(s.id)}
                  className={`rounded-full px-3 py-1 font-scroll text-sm font-bold shadow-lg transition ${
                    on ? 'bg-amber-300 text-black' : 'bg-black/70 text-amber-200 hover:bg-black/90'
                  }`}
                >
                  {s.numeral}
                </button>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}