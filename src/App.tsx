import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence } from 'framer-motion'
import { setMasterVolume, setMuted } from './audio/AudioManager'
import { cine } from './cinematics/theatre'
import Game from './game/Game'
import { useMission } from './game/missionStore'
import { useSettings } from './game/settingsStore'
import BriefingUI from './ui/Briefing'
import HUD from './ui/HUD'
import LoadingScreen from './ui/LoadingScreen'
import MainMenu from './ui/MainMenu'
import PauseMenu from './ui/PauseMenu'
import ScrollViewer from './ui/ScrollViewer'
import { damp } from './utils/math'

/** Follows cine.fade: snaps to black instantly, eases back out. */
function FadeOverlay() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    let cur = 1
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      cur = cine.fade > cur ? cine.fade : damp(cur, cine.fade, 3, dt)
      if (ref.current) ref.current.style.opacity = cur.toFixed(3)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <div ref={ref} className="pointer-events-none fixed inset-0 z-20 bg-black" />
}

export default function App() {
  const phase = useMission((s) => s.phase)
  const volume = useSettings((s) => s.volume)
  const muted = useSettings((s) => s.muted)

  useEffect(() => {
    setMasterVolume(volume)
    setMuted(muted)
  }, [volume, muted])

  return (
    <div className="relative h-full w-full bg-black">
      <Canvas
        shadows="percentage"
        flat
        dpr={1}
        frameloop={phase === 'paused' ? 'never' : 'always'}
        gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
        camera={{ fov: 75, near: 0.05, far: 320, position: [30, 14, 30] }}
      >
        <Suspense fallback={null}>
          <Game />
        </Suspense>
      </Canvas>

      <FadeOverlay />

      <AnimatePresence>
        {phase === 'menu' && <MainMenu key="menu" />}
        {phase === 'briefing' && <BriefingUI key="briefing" />}
        {phase === 'paused' && <PauseMenu key="paused" />}
      </AnimatePresence>
      {phase === 'scrolls' && <ScrollViewer />}
      {(phase === 'playing' || phase === 'dead') && <HUD />}

      <LoadingScreen />
    </div>
  )
}