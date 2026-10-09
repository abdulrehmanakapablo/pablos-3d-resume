import type { Vector3 } from 'three'

export type OcclusionTest = (from: Vector3, to: Vector3) => boolean

export interface VisionCfg {
  range: number
  fov: number
  periphery: number
  peripheryRange: number
  eyeHeight: number
}

const DEG = Math.PI / 180

export const GUARD_VISION: VisionCfg = { range: 18, fov: 100 * DEG, periphery: 200 * DEG, peripheryRange: 4, eyeHeight: 1.62 }
export const BOSS_VISION: VisionCfg = { range: 22, fov: 120 * DEG, periphery: 220 * DEG, peripheryRange: 5.5, eyeHeight: 1.75 }

/**
 * 0..1 exposure of `target` this frame. Forward = (sin yaw, 0, cos yaw).
 * Cheap math first, single raycast last.
 */
export function computeExposure(
  eye: Vector3,
  yaw: number,
  target: Vector3,
  visibility: number,
  cfg: VisionCfg,
  occluded: OcclusionTest,
): number {
  if (visibility <= 0) return 0
  const dx = target.x - eye.x
  const dy = target.y - eye.y
  const dz = target.z - eye.z
  const d2 = dx * dx + dy * dy + dz * dz
  if (d2 > cfg.range * cfg.range) return 0

  const d = Math.sqrt(d2)
  const hd = Math.sqrt(dx * dx + dz * dz) || 1e-4
  if (d > 2 && Math.abs(dy) > hd * 1.5) return 0

  const cos = (Math.sin(yaw) * dx + Math.cos(yaw) * dz) / hd
  let f: number
  if (cos >= Math.cos(cfg.fov / 2)) {
    const near = cfg.range * 0.3
    f = d <= near ? 1 : 1 - ((d - near) / (cfg.range - near)) * 0.8
  } else if (d < cfg.peripheryRange && cos >= Math.cos(cfg.periphery / 2)) {
    f = 0.35
  } else return 0

  f *= visibility
  if (f < 0.01) return 0
  return occluded(eye, target) ? 0 : f
}