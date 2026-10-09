import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tier } from '../hooks/useQuality'

export type QualitySetting = 'auto' | Tier

interface SettingsValues {
  quality: QualitySetting
  sensitivity: number
  volume: number
  muted: boolean
  fov: number
}

interface Settings extends SettingsValues {
  set: (p: Partial<SettingsValues>) => void
}

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      quality: 'auto',
      sensitivity: 1,
      volume: 0.8,
      muted: false,
      fov: 75,
      set: (p) => set(p),
    }),
    {
      name: 'op-scroll-settings',
      partialize: (s): SettingsValues => ({
        quality: s.quality,
        sensitivity: s.sensitivity,
        volume: s.volume,
        muted: s.muted,
        fov: s.fov,
      }),
    },
  ),
)