import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { LEVEL } from '../data/level'
import { CHEST_SIZE, PROPS, WALLS, footprint } from './layout'

const H = LEVEL.wallHeight
const [gx0, gz0] = LEVEL.ground.min
const [gx1, gz1] = LEVEL.ground.max
const GW = gx1 - gx0
const GD = gz1 - gz0
const GCX = (gx0 + gx1) / 2
const GCZ = (gz0 + gz1) / 2

/** Every static collider in one fixed body: walls, floor, props, chest, map bounds. */
export default function Colliders() {
  return (
    <RigidBody type="fixed" colliders={false} userData={{ type: 'world' }}>
      <CuboidCollider args={[GW / 2, 0.5, GD / 2]} position={[GCX, -0.5, GCZ]} />

      {WALLS.map((w, i) => (
        <CuboidCollider key={`w${i}`} args={[w.sx / 2, H / 2, w.sz / 2]} position={[w.cx, H / 2, w.cz]} />
      ))}

      {PROPS.map((p, i) => {
        if (p.solid === false) return null
        const [sx, sz] = footprint(p)
        return (
          <CuboidCollider
            key={`p${i}`}
            args={[sx / 2, p.size[1] / 2, sz / 2]}
            position={[p.pos[0], p.size[1] / 2, p.pos[1]]}
          />
        )
      })}

      <CuboidCollider
        args={[CHEST_SIZE[0] / 2, CHEST_SIZE[1] / 2, CHEST_SIZE[2] / 2]}
        position={[LEVEL.chest.pos[0], CHEST_SIZE[1] / 2, LEVEL.chest.pos[1]]}
      />

      {/* invisible map bounds */}
      <CuboidCollider args={[GW / 2, 3, 0.5]} position={[GCX, 3, gz0]} />
      <CuboidCollider args={[GW / 2, 3, 0.5]} position={[GCX, 3, gz1]} />
      <CuboidCollider args={[0.5, 3, GD / 2]} position={[gx0, 3, GCZ]} />
      <CuboidCollider args={[0.5, 3, GD / 2]} position={[gx1, 3, GCZ]} />
    </RigidBody>
  )
}