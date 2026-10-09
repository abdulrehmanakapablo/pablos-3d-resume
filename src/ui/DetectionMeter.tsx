import { useEffect, useRef } from 'react'
import { getMaxAwareness } from '../ai/brain'

/** rAF-driven: zero React re-renders. */
export default function DetectionMeter() {
  const wrap = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    let last = ''
    const tick = () => {
      const a = Math.min(1, getMaxAwareness())
      const text = a >= 1 ? 'DETECTED' : a >= 0.35 ? 'SUSPICIOUS' : 'NOTICED'
      const color = a >= 1 ? '#ef4444' : a >= 0.35 ? '#f59e0b' : '#e5e7eb'
      if (wrap.current) wrap.current.style.opacity = a > 0.02 ? '1' : '0'
      if (bar.current) {
        bar.current.style.transform = `scaleX(${a})`
        bar.current.style.backgroundColor = color
      }
      if (label.current && text !== last) {
        label.current.textContent = text
        label.current.style.color = color
        last = text
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      ref={wrap}
      className="absolute left-1/2 top-4 w-56 -translate-x-1/2 text-center opacity-0 transition-opacity duration-300"
    >
      <span ref={label} className="text-xs font-bold tracking-[0.35em]" />
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
        <div ref={bar} className="h-full origin-left rounded-full" style={{ transform: 'scaleX(0)' }} />
      </div>
    </div>
  )
}