import { useEffect, useRef, useState, type PointerEvent as RPE, type ReactNode } from 'react'
import { input } from '../game/inputStore'

const R = 56
type Track = { id: number; x: number; y: number } | null

function ActionButton({
  label,
  onPress,
  className = '',
  active = false,
}: {
  label: ReactNode
  onPress: () => void
  className?: string
  active?: boolean
}) {
  return (
    <button
      className={`pointer-events-auto flex touch-none items-center justify-center rounded-full border border-white/25 font-bold tracking-wider backdrop-blur active:scale-95 ${
        active ? 'bg-amber-400/80 text-black' : 'bg-black/40 text-white'
      } ${className}`}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onPress()
      }}
    >
      {label}
    </button>
  )
}

/** Floating left stick, right-side drag look, action buttons. Multi-touch via pointer capture. */
export default function MobileControls() {
  const base = useRef<HTMLDivElement>(null)
  const knob = useRef<HTMLDivElement>(null)
  const stick = useRef<Track>(null)
  const drag = useRef<Track>(null)
  const [crouch, setCrouch] = useState(input.crouch)

  useEffect(() => {
    input.touch = true
    return () => {
      input.moveX = input.moveY = 0
    }
  }, [])

  const stickDown = (e: RPE<HTMLDivElement>) => {
    if (stick.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    stick.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
    const b = base.current
    if (b) {
      b.style.left = `${e.clientX}px`
      b.style.top = `${e.clientY}px`
      b.style.opacity = '1'
    }
  }
  const stickMove = (e: RPE<HTMLDivElement>) => {
    const s = stick.current
    if (!s || s.id !== e.pointerId) return
    let dx = e.clientX - s.x
    let dy = e.clientY - s.y
    const l = Math.hypot(dx, dy)
    if (l > R) {
      dx = (dx / l) * R
      dy = (dy / l) * R
    }
    input.moveX = dx / R
    input.moveY = -dy / R
    if (knob.current) knob.current.style.transform = `translate(${dx}px, ${dy}px)`
  }
  const stickUp = (e: RPE<HTMLDivElement>) => {
    if (stick.current?.id !== e.pointerId) return
    stick.current = null
    input.moveX = input.moveY = 0
    if (knob.current) knob.current.style.transform = 'translate(0px, 0px)'
    if (base.current) base.current.style.opacity = '0.4'
  }

  const lookDown = (e: RPE<HTMLDivElement>) => {
    if (drag.current) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY }
  }
  const lookMove = (e: RPE<HTMLDivElement>) => {
    const t = drag.current
    if (!t || t.id !== e.pointerId) return
    input.lookX += e.clientX - t.x
    input.lookY += e.clientY - t.y
    t.x = e.clientX
    t.y = e.clientY
  }
  const lookUp = (e: RPE<HTMLDivElement>) => {
    if (drag.current?.id === e.pointerId) drag.current = null
  }

  return (
    <div className="absolute inset-0">
      <div
        className="pointer-events-auto absolute inset-y-0 right-0 w-[55%] touch-none"
        onPointerDown={lookDown}
        onPointerMove={lookMove}
        onPointerUp={lookUp}
        onPointerCancel={lookUp}
      />
      <div
        className="pointer-events-auto absolute bottom-0 left-0 h-[65%] w-[45%] touch-none"
        onPointerDown={stickDown}
        onPointerMove={stickMove}
        onPointerUp={stickUp}
        onPointerCancel={stickUp}
      />
      <div
        ref={base}
        className="pointer-events-none absolute h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30 bg-white/5"
        style={{ left: 110, top: 'calc(100% - 130px)', opacity: 0.4 }}
      >
        <div ref={knob} className="absolute left-1/2 top-1/2 -ml-7 -mt-7 h-14 w-14 rounded-full bg-white/70 shadow-lg" />
      </div>

      <div className="absolute bottom-5 right-5 flex items-end gap-3">
        <div className="flex flex-col gap-3">
          <ActionButton label="LIGHT" className="h-12 w-12 text-[10px]" onPress={() => (input.flashlight = true)} />
          <ActionButton
            label={crouch ? 'STAND' : 'CROUCH'}
            className="h-14 w-14 text-[10px]"
            active={crouch}
            onPress={() => {
              input.crouch = !input.crouch
              setCrouch(input.crouch)
            }}
          />
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-3">
            <ActionButton label="RLD" className="h-12 w-12 text-xs" onPress={() => (input.reload = true)} />
            <ActionButton label="USE" className="h-14 w-14 text-sm" onPress={() => (input.interact = true)} />
          </div>
          <ActionButton label="FIRE" className="h-24 w-24 text-lg" onPress={() => (input.fire = true)} />
        </div>
      </div>
    </div>
  )
}