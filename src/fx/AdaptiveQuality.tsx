import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { useSettings } from '../game/settingsStore'
import { PROFILES, useQualityStore } from '../hooks/useQuality'

const up = () => useQualityStore.getState().step(1)
const down = () => useQualityStore.getState().step(-1)
const fallback = () => useQualityStore.getState().setTier('low')

/** 'auto' → FPS-driven tier stepping. Fixed setting → that tier. Tier → DPR (up to 4K). */
export default function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr)
  const setting = useSettings((s) => s.quality)
  const tier = useQualityStore((s) => s.tier)

  useEffect(() => {
    if (setting !== 'auto') useQualityStore.getState().setTier(setting)
  }, [setting])

  useEffect(() => {
    setDpr(PROFILES[tier].dpr)
  }, [tier, setDpr])

  return setting === 'auto' ? (
    <PerformanceMonitor flipflops={4} onIncline={up} onDecline={down} onFallback={fallback} />
  ) : null
}