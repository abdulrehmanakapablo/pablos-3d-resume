import { useState } from 'react'
import { motion } from 'framer-motion'
import { play, preloadSounds } from '../audio/AudioManager'
import { PROFILE } from '../data/cv'
import { useMission } from '../game/missionStore'
import { useFullscreen } from '../hooks/useFullscreen'
import { useIsMobile } from '../hooks/useIsMobile'
import { SettingsPanel } from './PauseMenu'

export default function MainMenu() {
  const [settings, setSettings] = useState(false)
  const mobile = useIsMobile()
  const fs = useFullscreen()

  const start = () => {
    void preloadSounds()
    play('uiConfirm')
    if (mobile && fs.supported && !fs.active) void fs.toggle()
    useMission.getState().start()
  }
  const skip = () => {
    void preloadSounds()
    play('uiClick')
    useMission.getState().skipToCV()
  }

  return (
    <motion.div
      className="fixed inset-0 z-30 flex flex-col justify-between overflow-y-auto bg-linear-to-t from-black/90 via-black/20 to-black/70 p-6 font-hud text-white md:p-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div>
        <div className="text-xs tracking-[0.5em] text-amber-300/80">CLASSIFIED // TIER-1 OPERATION</div>
        <h1 className="mt-2 text-6xl font-bold leading-[0.9] tracking-wider md:text-8xl">
          OPERATION
          <br />
          <span className="text-amber-300">SCROLL</span>
        </h1>
        <p className="mt-4 max-w-md text-lg text-white/70">
          {PROFILE.name} “{PROFILE.alias}” · {PROFILE.title}
        </p>
      </div>

      <div className="mt-8 flex w-full flex-col gap-3 md:max-w-sm">
        <button className="btn bg-amber-400 text-black hover:bg-amber-300" onClick={start}>
          Start mission
        </button>
        <button className="btn glass hover:bg-white/10" onClick={skip}>
          Skip to CV
        </button>
        <button className="btn glass hover:bg-white/10" onClick={() => setSettings((v) => !v)}>
          {settings ? 'Hide settings' : 'Settings'}
        </button>
        {settings && <SettingsPanel />}
        <p className="text-sm text-white/50">
          {mobile
            ? 'Left stick move · drag right side to look · buttons to act'
            : 'WASD move · Shift sprint · C crouch · Mouse aim/fire · E use · R reload · F light'}
        </p>
      </div>
    </motion.div>
  )
}