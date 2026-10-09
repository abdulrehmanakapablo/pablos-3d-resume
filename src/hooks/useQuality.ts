import { create } from 'zustand'
import { isTouchDevice } from './useIsMobile'

export type Tier = 'low' | 'medium' | 'high' | 'ultra'
export const TIERS: Tier[] = ['low', 'medium', 'high', 'ultra']

export interface QualityProfile {
  dpr: number
  shadows: boolean
  shadowMap: number
  pointShadows: boolean
  ao: boolean
  aoHalfRes: boolean
  bloom: boolean
  grain: boolean
  particles: number
}

const DPR = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1

export const PROFILES: Record<Tier, QualityProfile> = {
  low: { dpr: 1, shadows: false, shadowMap: 512, pointShadows: false, ao: false, aoHalfRes: true, bloom: false, grain: false, particles: 256 },
  medium: { dpr: Math.min(DPR, 1.25), shadows: true, shadowMap: 1024, pointShadows: false, ao: true, aoHalfRes: true, bloom: true, grain: false, particles: 512 },
  high: { dpr: Math.min(DPR, 1.75), shadows: true, shadowMap: 2048, pointShadows: false, ao: true, aoHalfRes: false, bloom: true, grain: true, particles: 768 },
  // 4K: native DPR up to 2.5 on HiDPI/4K displays
  ultra: { dpr: Math.min(DPR, 2.5), shadows: true, shadowMap: 4096, pointShadows: true, ao: true, aoHalfRes: false, bloom: true, grain: true, particles: 1024 },
}

function initialTier(): Tier {
  if (typeof navigator === 'undefined') return 'high'
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (isTouchDevice()) return mem <= 4 ? 'low' : 'medium'
  return 'high'
}

interface QualityState {
  tier: Tier
  setTier: (t: Tier) => void
  step: (d: 1 | -1) => void
}

export const useQualityStore = create<QualityState>((set, get) => ({
  tier: initialTier(),
  setTier: (tier) => set({ tier }),
  step: (d) => {
    const i = TIERS.indexOf(get().tier) + d
    if (i >= 0 && i < TIERS.length) set({ tier: TIERS[i] })
  },
}))

export function useQuality(): QualityProfile {
  return PROFILES[useQualityStore((s) => s.tier)]
}