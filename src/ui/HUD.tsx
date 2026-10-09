import { useEffect, useRef, useSyncExternalStore } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { INTEL } from '../data/cv'
import { LEVEL } from '../data/level'
import { PLAYER, WEAPON } from '../game/constants'
import { isLocked, lockPointer, unlockPointer } from '../game/inputStore'
import { objectiveOf, useMission, type Toast, type ToastTone } from '../game/missionStore'
import { useIsMobile } from '../hooks/useIsMobile'
import Crosshair from './Crosshair'
import DetectionMeter from './DetectionMeter'
import MobileControls from './MobileControls'
import Prompt from './Prompt'

const TOTAL = LEVEL.enemies.length
const KEY_ID = LEVEL.doors.find((d) => d.lockedBy)?.lockedBy ?? 'studyKey'
const TONE: Record<ToastTone, string> = {
  info: 'border-white/20 text-white',
  good: 'border-emerald-400/60 text-emerald-200',
  bad: 'border-red-400/60 text-red-200',
  gold: 'border-amber-300/70 text-amber-200',
}

function subscribeLock(cb: () => void) {
  document.addEventListener('pointerlockchange', cb)
  return () => document.removeEventListener('pointerlockchange', cb)
}

function ToastItem({ t }: { t: Toast }) {
  const dismiss = useMission((s) => s.dismiss)
  useEffect(() => {
    const id = setTimeout(() => dismiss(t.id), 2600)
    return () => clearTimeout(id)
  }, [t.id, dismiss])
  return (
    <motion.div
      layout
      className={`glass rounded-md border px-4 py-1.5 text-base font-bold uppercase tracking-wide ${TONE[t.tone]}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {t.text}
    </motion.div>
  )
}

/** Red edge flash on hit + low-health pulse. rAF-driven. */
function DamageFlash() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = () => {
      const s = useMission.getState()
      const now = performance.now()
      const hit = Math.max(0, 1 - (now - s.damageAt) / 600)
      const low = s.phase === 'playing' && s.health < 35 ? 0.25 + Math.sin(now / 260) * 0.12 : 0
      if (ref.current) ref.current.style.opacity = String(Math.min(0.85, hit * 0.7 + low))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div
      ref={ref}
      className="absolute inset-0 opacity-0"
      style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgba(160,0,0,0.85) 100%)' }}
    />
  )
}

function IntelModal({ id, mobile }: { id: string; mobile: boolean }) {
  const intel = INTEL[id]
  const close = () => useMission.getState().showIntel(null)
  return (
    <motion.div
      className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={close}
    >
      <motion.div
        className="parchment w-full max-w-md rounded-lg p-6"
        initial={{ scale: 0.9, rotate: -2 }}
        animate={{ scale: 1, rotate: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-hud text-xs font-bold tracking-[0.4em] text-red-800">CLASSIFIED · INTEL</div>
        <h3 className="mt-2 font-scroll text-2xl font-bold">{intel?.title ?? 'Unknown file'}</h3>
        <p className="mt-3 font-hud text-lg leading-snug">{intel?.text}</p>
        <button
          className="mt-5 rounded-md bg-[#3b2414] px-4 py-2 font-hud font-bold tracking-wider text-amber-100"
          onClick={close}
        >
          {mobile ? 'Close' : 'Close [E]'}
        </button>
      </motion.div>
    </motion.div>
  )
}

function DeathScreen() {
  const { restart, skipToCV, toMenu } = useMission.getState()
  return (
    <motion.div
      className="pointer-events-auto absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/60 p-6 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <div className="text-sm tracking-[0.5em] text-red-400">K.I.A.</div>
      <h2 className="text-5xl font-bold md:text-7xl">MISSION FAILED</h2>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn bg-amber-400 text-black hover:bg-amber-300" onClick={restart}>
          Retry
        </button>
        <button className="btn glass hover:bg-white/10" onClick={skipToCV}>
          Skip to CV
        </button>
        <button className="btn glass hover:bg-white/10" onClick={toMenu}>
          Menu
        </button>
      </div>
    </motion.div>
  )
}

export default function HUD() {
  const phase = useMission((s) => s.phase)
  const health = useMission((s) => s.health)
  const mag = useMission((s) => s.mag)
  const reserve = useMission((s) => s.reserve)
  const reloading = useMission((s) => s.reloading)
  const hasKey = useMission((s) => s.items.includes(KEY_ID))
  const kills = useMission((s) => s.kills.length)
  const toasts = useMission((s) => s.toasts)
  const intel = useMission((s) => s.intel)
  const objective = useMission(objectiveOf)
  const mobile = useIsMobile()
  const locked = useSyncExternalStore(subscribeLock, isLocked, () => false)
  const dead = phase === 'dead'
  const hp = health / PLAYER.maxHealth

  const pause = () => {
    unlockPointer()
    useMission.getState().pause()
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none font-hud text-white">
      <DamageFlash />

      {!dead && (
        <>
          <div className="absolute left-4 top-4 max-w-[60vw] md:left-6 md:top-6">
            <div className="text-[10px] tracking-[0.4em] text-amber-300/90">OBJECTIVE</div>
            <div className="text-lg font-bold leading-tight drop-shadow md:text-xl">{objective}</div>
            {hasKey && <div className="mt-1 text-sm text-amber-200">🗝 Study key</div>}
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-3 md:right-6 md:top-6">
            <div className="glass rounded-md px-3 py-1 text-sm font-bold tracking-wider">
              ☠ {kills}/{TOTAL}
            </div>
            <button className="glass pointer-events-auto rounded-md px-3 py-1 text-sm font-bold" onClick={pause}>
              ❚❚
            </button>
          </div>

          <DetectionMeter />

          <div className="absolute left-1/2 top-16 flex -translate-x-1/2 flex-col items-center gap-2">
            <AnimatePresence initial={false}>
              {toasts.map((t) => (
                <ToastItem key={t.id} t={t} />
              ))}
            </AnimatePresence>
          </div>

          <Crosshair />
          <Prompt mobile={mobile} />

          <div className={`absolute left-4 w-56 md:left-6 ${mobile ? 'top-24' : 'bottom-6'}`}>
            <div className="flex justify-between text-xs font-bold tracking-widest">
              <span>HEALTH</span>
              <span className="tabular-nums">{Math.ceil(health)}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ width: `${hp * 100}%`, background: hp > 0.5 ? '#4ade80' : hp > 0.25 ? '#f59e0b' : '#ef4444' }}
              />
            </div>
          </div>

          <div className={`absolute right-4 text-right md:right-6 ${mobile ? 'top-14' : 'bottom-6'}`}>
            <div className="text-4xl font-bold leading-none tabular-nums md:text-5xl">
              {WEAPON.infinite ? '∞' : mag}
              {!WEAPON.infinite && <span className="text-xl text-white/50"> / {reserve}</span>}
            </div>
            <div className="text-xs font-bold tracking-[0.3em] text-white/60">
              {reloading ? 'RELOADING…' : !WEAPON.infinite && mag === 0 ? (reserve ? 'RELOAD' : 'EMPTY') : 'SUPPRESSED .45'}
            </div>
          </div>

          {mobile && <MobileControls />}

          {!mobile && !locked && !intel && (
            <button
              className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/30"
              onClick={lockPointer}
            >
              <span className="glass rounded-xl px-8 py-4 text-2xl font-bold tracking-[0.3em]">CLICK TO ENGAGE</span>
            </button>
          )}
        </>
      )}

      <AnimatePresence>{intel && <IntelModal key="intel" id={intel} mobile={mobile} />}</AnimatePresence>
      <AnimatePresence>{dead && <DeathScreen key="dead" />}</AnimatePresence>
    </div>
  )
}