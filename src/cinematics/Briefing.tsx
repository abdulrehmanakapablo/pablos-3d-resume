import { BRIEFING_SHOT, useShotPlayer } from './theatre'

/** Exterior fly-in ending at the front door. Mount to play, onDone hands control to the player. */
export default function BriefingCinematic({ onDone }: { onDone: () => void }) {
  useShotPlayer(BRIEFING_SHOT, onDone)
  return null
}