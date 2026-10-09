import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useProgress } from '@react-three/drei'

export default function LoadingScreen() {
  const { active, progress } = useProgress()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (active) return
    const t = setTimeout(() => setDone(true), 900)
    return () => clearTimeout(t)
  }, [active])

  const pct = active ? progress : 100

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black font-hud text-white"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-xs tracking-[0.6em] text-amber-300/80">ESTABLISHING UPLINK</div>
          <div className="mt-3 text-4xl font-bold tracking-widest">OPERATION SCROLL</div>
          <div className="mt-6 h-1 w-64 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-amber-400 transition-[width] duration-300" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-2 text-sm tabular-nums text-white/50">{Math.round(pct)}%</div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}