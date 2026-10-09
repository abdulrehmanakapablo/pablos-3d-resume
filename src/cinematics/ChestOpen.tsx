import { CHEST_SHOT, cine, useShotPlayer } from './theatre'

/** Chest reveal. Writes lid/glow/rise into `cine` for Chest.tsx and Scrolls.tsx. */
export default function ChestOpenCinematic({ onDone }: { onDone: () => void }) {
  useShotPlayer(CHEST_SHOT, onDone, (fx) => {
    cine.lid = fx.lid
    cine.glow = fx.glow
    cine.rise = fx.rise
  })
  return null
}