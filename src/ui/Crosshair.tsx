import { useEffect, useRef } from 'react'
import { playerSense } from '../ai/brain'
import { fxState } from '../fx/bus'
import { look } from '../game/inputStore'

const ARMS = [
  { w: 2, h: 10, dx: 0, dy: -1 },
  { w: 2, h: 10, dx: 0, dy: 1 },
  { w: 10, h: 2, dx: -1, dy: 0 },
  { w: 10, h: 2, dx: 1, dy: 0 },
]

/** Dynamic spread (movement + recoil) and hit marker. rAF-driven. */
export default function Crosshair() {
  const arms = useRef<(HTMLDivElement | null)[]>([])
  const hit = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const tick = () => {
      const gap = 10 + Math.min(playerSense.speed, 6) * 1.6 + look.recoil * 260
      arms.current.forEach((el, i) => {
        if (el) el.style.transform = `translate(${ARMS[i].dx * gap}px, ${ARMS[i].dy * gap}px)`
      })
      const t = performance.now() - fxState.hitAt
      const h = hit.current
      if (h) {
        h.style.opacity = t < 220 ? String(1 - t / 220) : '0'
        h.style.color = fxState.headshot ? '#f87171' : '#ffffff'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="absolute left-1/2 top-1/2">
      <div className="absolute -left-0.5 -top-0.5 h-1 w-1 rounded-full bg-white/90" />
      {ARMS.map((a, i) => (
        <div
          key={i}
          ref={(el) => {
            arms.current[i] = el
          }}
          className="absolute bg-white/85 shadow-[0_0_2px_rgba(0,0,0,0.8)]"
          style={{ width: a.w, height: a.h, left: -a.w / 2, top: -a.h / 2 }}
        />
      ))}
      <div
        ref={hit}
        className="absolute -left-4 -top-4 flex h-8 w-8 items-center justify-center text-2xl font-bold opacity-0"
      >
        ✕
      </div>
    </div>
  )
}