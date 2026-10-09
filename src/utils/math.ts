export const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Frame-rate independent exponential smoothing. */
export const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))
export const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
export const rand = (a: number, b: number) => a + Math.random() * (b - a)
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}