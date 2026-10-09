import { motion } from 'framer-motion'
import { cine } from '../cinematics/theatre'
import { LEVEL } from '../data/level'
import { useIsMobile } from '../hooks/useIsMobile'

const LINES = [
  'Four ancient scrolls have been stolen: the complete record of one developer.',
  `${LEVEL.enemies.length} armed hostiles hold the house. The study is locked; the key is inside.`,
  'Stay in the shadows. Takedowns from behind are silent. Gunfire is not.',
]

export default function BriefingUI() {
  const mobile = useIsMobile()
  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-30 flex items-end p-4 font-hud text-white md:p-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass pointer-events-auto w-full max-w-lg rounded-xl p-5"
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <div className="flex items-center justify-between text-xs tracking-[0.4em] text-amber-300">
          <span>MISSION BRIEFING</span>
          <span className="animate-pulse text-red-400">● LIVE</span>
        </div>
        <h2 className="mt-2 text-3xl font-bold">Recover the Scrolls</h2>
        <ul className="mt-3 space-y-2 text-lg leading-snug text-white/85">
          {LINES.map((l, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4 + i * 1.6 }}
            >
              ▸ {l}
            </motion.li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-white/50">
          <span>{mobile ? 'Stick: move · Drag: look' : 'WASD · Mouse · E use · C crouch · R reload · F light'}</span>
          <button
            className="shrink-0 rounded-md bg-white/10 px-4 py-1.5 font-bold tracking-wider text-white hover:bg-white/20"
            onClick={() => {
              cine.skip = true
            }}
          >
            Skip ▸
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}