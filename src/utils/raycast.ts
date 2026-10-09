import { Vector3 } from 'three'
import type { RapierRigidBody, useRapier } from '@react-three/rapier'

type Rapier = ReturnType<typeof useRapier>
export type PhysWorld = Rapier['world']
export type PhysApi = Rapier['rapier']

export interface RayHit {
  point: Vector3
  normal: Vector3
  distance: number
  type: string | null
  id: string | null
}

export const createRayHit = (): RayHit => ({
  point: new Vector3(),
  normal: new Vector3(),
  distance: 0,
  type: null,
  id: null,
})

/** Solid raycast ignoring sensors and `exclude`. Writes into `out`. */
export function castRay(
  world: PhysWorld,
  rapier: PhysApi,
  origin: Vector3,
  dir: Vector3,
  maxDist: number,
  out: RayHit,
  exclude?: RapierRigidBody | null,
): boolean {
  const ray = new rapier.Ray(origin, dir)
  const hit = world.castRayAndGetNormal(
    ray,
    maxDist,
    true,
    rapier.QueryFilterFlags.EXCLUDE_SENSORS,
    undefined,
    undefined,
    exclude ?? undefined,
  )
  if (!hit) return false
  const t = hit.timeOfImpact
  out.distance = t
  out.point.set(origin.x + dir.x * t, origin.y + dir.y * t, origin.z + dir.z * t)
  out.normal.set(hit.normal.x, hit.normal.y, hit.normal.z)
  const ud = hit.collider.parent()?.userData as { type?: string; id?: string } | undefined
  out.type = ud?.type ?? null
  out.id = ud?.id ?? null
  return true
}