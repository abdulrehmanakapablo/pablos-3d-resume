import { AnimatePresence, motion } from 'framer-motion'
import { useMission } from '../game/missionStore'

export default function Prompt({ mobile }: { mobile: boolean }) {
  const prompt = useMission((s) => s.prompt)
  return (
    <AnimatePresence>
      {prompt && (
        <motion.div
          key={prompt}
          className="glass absolute left-1/2 top-[60%] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-lg font-bold tracking-wide"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {!mobile && <kbd className="rounded bg-white px-2 text-black">E</kbd>}
          {prompt}
        </motion.div>
      )}
    </AnimatePresence>
  )
}