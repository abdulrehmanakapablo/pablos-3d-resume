import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { rand } from './math'

type Draw = (g: CanvasRenderingContext2D, s: number) => void
const cache = new Map<string, CanvasTexture>()

/** Procedural textures: zero downloads, generated once, cached. */
function make(key: string, size: number, draw: Draw, tile = true): CanvasTexture {
  const hit = cache.get(key)
  if (hit) return hit
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  if (g) draw(g, size)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  if (tile) t.wrapS = t.wrapT = RepeatWrapping
  t.anisotropy = 8
  cache.set(key, t)
  return t
}

function speckle(g: CanvasRenderingContext2D, s: number, n: number, alpha: number, light = false) {
  for (let i = 0; i < n; i++) {
    const v = light ? 255 : 0
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * alpha})`
    const r = 1 + Math.random() * 2.5
    g.fillRect(Math.random() * s, Math.random() * s, r, r)
  }
}

/** Clone with its own repeat; shares the GPU image source. */
export function tiled(t: Texture, x: number, y: number): Texture {
  const c = t.clone()
  c.repeat.set(x, y)
  c.needsUpdate = true
  return c
}

export const woodTex = () =>
  make('wood', 512, (g, s) => {
    const planks = 8
    const h = s / planks
    for (let i = 0; i < planks; i++) {
      g.fillStyle = `hsl(28, 42%, ${34 + Math.random() * 12}%)`
      g.fillRect(0, i * h, s, h)
      g.strokeStyle = 'rgba(40,20,8,0.22)'
      g.lineWidth = 1
      for (let k = 0; k < 7; k++) {
        const y = i * h + Math.random() * h
        g.beginPath()
        g.moveTo(0, y)
        g.bezierCurveTo(s * 0.3, y + rand(-4, 4), s * 0.6, y + rand(-4, 4), s, y + rand(-3, 3))
        g.stroke()
      }
      g.fillStyle = 'rgba(20,10,4,0.55)'
      g.fillRect(0, i * h, s, 2)
      g.fillRect(Math.random() * s, i * h, 2, h)
    }
    speckle(g, s, 2500, 0.06)
  })

export const tileTex = () =>
  make('tile', 512, (g, s) => {
    g.fillStyle = '#8f897d'
    g.fillRect(0, 0, s, s)
    const n = 4
    const w = s / n
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        g.fillStyle = `hsl(40, 16%, ${80 + Math.random() * 7}%)`
        g.fillRect(x * w + 3, y * w + 3, w - 6, w - 6)
      }
    speckle(g, s, 1500, 0.05)
  })

export const concreteTex = () =>
  make('concrete', 512, (g, s) => {
    g.fillStyle = '#6c6c69'
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * s
      const y = Math.random() * s
      const r = 20 + Math.random() * 70
      const grd = g.createRadialGradient(x, y, 0, x, y, r)
      const d = Math.random() > 0.5
      grd.addColorStop(0, d ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.08)')
      grd.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grd
      g.fillRect(x - r, y - r, r * 2, r * 2)
    }
    speckle(g, s, 7000, 0.12)
  })

export const plasterTex = () =>
  make('plaster', 256, (g, s) => {
    g.fillStyle = '#d6c8b0'
    g.fillRect(0, 0, s, s)
    speckle(g, s, 4000, 0.05)
    speckle(g, s, 2000, 0.08, true)
  })

export const grassTex = () =>
  make('grass', 512, (g, s) => {
    g.fillStyle = '#1d3519'
    g.fillRect(0, 0, s, s)
    for (let i = 0; i < 9000; i++) {
      g.strokeStyle = `hsl(${95 + Math.random() * 30}, 40%, ${12 + Math.random() * 16}%)`
      const x = Math.random() * s
      const y = Math.random() * s
      g.beginPath()
      g.moveTo(x, y)
      g.lineTo(x + rand(-2, 2), y - 3 - Math.random() * 5)
      g.stroke()
    }
  })

export const glowTex = () =>
  make(
    'glow',
    128,
    (g, s) => {
      const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
      r.addColorStop(0, 'rgba(255,255,255,1)')
      r.addColorStop(0.25, 'rgba(255,255,255,0.55)')
      r.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = r
      g.fillRect(0, 0, s, s)
    },
    false,
  )

export const holeTex = () =>
  make(
    'hole',
    128,
    (g, s) => {
      const c = s / 2
      g.strokeStyle = 'rgba(25,25,25,0.6)'
      g.lineWidth = 1.5
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2
        g.beginPath()
        g.moveTo(c, c)
        g.lineTo(c + Math.cos(a) * c * rand(0.5, 0.95), c + Math.sin(a) * c * rand(0.5, 0.95))
        g.stroke()
      }
      const r = g.createRadialGradient(c, c, 0, c, c, c * 0.55)
      r.addColorStop(0, 'rgba(0,0,0,1)')
      r.addColorStop(0.35, 'rgba(12,12,12,0.95)')
      r.addColorStop(1, 'rgba(60,60,60,0)')
      g.fillStyle = r
      g.beginPath()
      g.arc(c, c, c * 0.55, 0, Math.PI * 2)
      g.fill()
    },
    false,
  )

export const splatTex = () =>
  make(
    'splat',
    256,
    (g, s) => {
      const c = s / 2
      g.fillStyle = '#fff'
      for (let i = 0; i < 9; i++) {
        g.beginPath()
        g.arc(c + rand(-18, 18), c + rand(-18, 18), rand(18, 40), 0, Math.PI * 2)
        g.fill()
      }
      for (let i = 0; i < 26; i++) {
        const a = Math.random() * Math.PI * 2
        const d = rand(45, 115)
        g.beginPath()
        g.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, rand(2, 9), rand(2, 5), a, 0, Math.PI * 2)
        g.fill()
      }
    },
    false,
  )

export const poolTex = () =>
  make(
    'pool',
    256,
    (g, s) => {
      const c = s / 2
      for (let i = 0; i < 14; i++) {
        const x = c + rand(-30, 30)
        const y = c + rand(-30, 30)
        const r = rand(40, 85)
        const grd = g.createRadialGradient(x, y, 0, x, y, r)
        grd.addColorStop(0, 'rgba(255,255,255,1)')
        grd.addColorStop(0.75, 'rgba(255,255,255,0.95)')
        grd.addColorStop(1, 'rgba(255,255,255,0)')
        g.fillStyle = grd
        g.beginPath()
        g.arc(x, y, r, 0, Math.PI * 2)
        g.fill()
      }
    },
    false,
  )