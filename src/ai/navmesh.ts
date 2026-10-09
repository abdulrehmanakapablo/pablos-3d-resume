import { Pathfinding } from 'three-pathfinding'
import type { BufferGeometry, Vector3 } from 'three'

const ZONE = 'level'
const pf = new Pathfinding()
let ready = false

export function loadNavmesh(geometry: BufferGeometry) {
  pf.setZoneData(ZONE, Pathfinding.createZone(geometry))
  ready = true
}

export const navReady = () => ready

/** Path excluding start. Falls back to a straight line until a navmesh is loaded. */
export function findPath(from: Vector3, to: Vector3): Vector3[] {
  if (!ready) return [to.clone()]
  const group = pf.getGroup(ZONE, from)
  const direct = pf.findPath(from, to, ZONE, group)
  if (direct?.length) return direct
  const node = pf.getClosestNode(to, ZONE, group)
  return (node && pf.findPath(from, node.centroid, ZONE, group)) || []
}