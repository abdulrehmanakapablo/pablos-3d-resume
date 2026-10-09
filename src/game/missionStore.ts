import { create } from 'zustand'
import type { ScrollId } from '../data/cv'
import { LEVEL } from '../data/level'
import { PLAYER, WEAPON } from './constants'

export type Phase = 'menu' | 'briefing' | 'playing' | 'paused' | 'chest' | 'scrolls' | 'dead'
export type ToastTone = 'info' | 'good' | 'bad' | 'gold'
export interface Toast {
  id: number
  text: string
  tone: ToastTone
}

export const BOSS_ID = LEVEL.enemies.find((e) => e.boss)?.id ?? 'boss'
const KEY_ID = LEVEL.doors.find((d) => d.lockedBy)?.lockedBy ?? 'studyKey'

const fresh = () => ({
  health: PLAYER.maxHealth,
  mag: WEAPON.magSize,
  reserve: WEAPON.reserve,
  reloading: false,
  items: [] as string[],
  taken: [] as string[],
  openDoors: [] as string[],
  kills: [] as string[],
  intel: null as string | null,
  prompt: null as string | null,
  toasts: [] as Toast[],
  damageAt: 0,
  takedowns: 0,
  headshots: 0,
  alerts: 0,
  shots: 0,
  hits: 0,
  startedAt: 0,
  endedAt: 0,
})

type RunState = ReturnType<typeof fresh>

export interface MissionState extends RunState {
  phase: Phase
  runId: number
  scroll: ScrollId
  start: () => void
  restart: () => void
  toMenu: () => void
  skipToCV: () => void
  setPhase: (p: Phase) => void
  pause: () => void
  resume: () => void
  damage: (n: number) => void
  heal: (n: number) => void
  fire: () => boolean
  registerHit: () => void
  startReload: () => boolean
  finishReload: () => void
  addAmmo: (n: number) => void
  take: (id: string) => void
  addItem: (id: string) => void
  toggleDoor: (id: string) => void
  openDoor: (id: string) => void
  setPrompt: (p: string | null) => void
  showIntel: (id: string | null) => void
  toast: (text: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
  registerKill: (id: string, headshot: boolean, takedown: boolean) => void
  registerAlert: () => void
  openChest: () => void
  finishChest: () => void
  setScroll: (id: ScrollId) => void
}

let toastId = 0
const now = () => performance.now()

export const useMission = create<MissionState>((set, get) => ({
  phase: 'menu',
  runId: 0,
  scroll: 'quests',
  ...fresh(),

  start: () => set({ ...fresh(), phase: 'briefing', runId: get().runId + 1 }),
  restart: () => set({ ...fresh(), phase: 'playing', runId: get().runId + 1, startedAt: now() }),
  toMenu: () => set({ ...fresh(), phase: 'menu', runId: get().runId + 1 }),
  skipToCV: () => set({ phase: 'scrolls', scroll: 'quests', prompt: null }),
  setPhase: (phase) => set(phase === 'playing' && !get().startedAt ? { phase, startedAt: now() } : { phase }),
  pause: () => {
    if (get().phase === 'playing') set({ phase: 'paused' })
  },
  resume: () => {
    if (get().phase === 'paused') set({ phase: 'playing' })
  },

  damage: (n) => {
    const s = get()
    if (s.phase !== 'playing') return
    const health = Math.max(0, s.health - n)
    set(health <= 0 ? { health, damageAt: now(), phase: 'dead', prompt: null } : { health, damageAt: now() })
  },
  heal: (n) => set((s) => ({ health: Math.min(PLAYER.maxHealth, s.health + n) })),

  fire: () => {
    const s = get()
    if (s.reloading || (!WEAPON.infinite && s.mag <= 0)) return false
    set(WEAPON.infinite ? { shots: s.shots + 1 } : { mag: s.mag - 1, shots: s.shots + 1 })
    return true
  },
  registerHit: () => set((s) => ({ hits: s.hits + 1 })),
  startReload: () => {
    if (WEAPON.infinite) return false
    const s = get()
    if (s.reloading || s.reserve <= 0 || s.mag >= WEAPON.magSize) return false
    set({ reloading: true })
    return true
  },
  finishReload: () =>
    set((s) => {
      const n = Math.min(WEAPON.magSize - s.mag, s.reserve)
      return { mag: s.mag + n, reserve: s.reserve - n, reloading: false }
    }),
  addAmmo: (n) => set((s) => ({ reserve: s.reserve + n })),

  take: (id) => {
    if (!get().taken.includes(id)) set((s) => ({ taken: [...s.taken, id] }))
  },
  addItem: (id) => {
    if (!get().items.includes(id)) set((s) => ({ items: [...s.items, id] }))
  },
  toggleDoor: (id) =>
    set((s) => ({
      openDoors: s.openDoors.includes(id) ? s.openDoors.filter((d) => d !== id) : [...s.openDoors, id],
    })),
  openDoor: (id) => {
    if (!get().openDoors.includes(id)) set((s) => ({ openDoors: [...s.openDoors, id] }))
  },

  setPrompt: (prompt) => {
    if (get().prompt !== prompt) set({ prompt })
  },
  showIntel: (intel) => set({ intel }),
  toast: (text, tone = 'info') => set((s) => ({ toasts: [...s.toasts.slice(-3), { id: ++toastId, text, tone }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  registerKill: (id, headshot, takedown) => {
    const s = get()
    if (s.kills.includes(id)) return
    set({
      kills: [...s.kills, id],
      headshots: s.headshots + (headshot ? 1 : 0),
      takedowns: s.takedowns + (takedown ? 1 : 0),
    })
    const t = get().toast
    t(takedown ? 'Silent takedown' : headshot ? 'Headshot' : 'Hostile down', takedown || headshot ? 'gold' : 'info')
    if (id === BOSS_ID) t('Guardian neutralized. The chest is unsealed.', 'gold')
  },
  registerAlert: () => set((s) => ({ alerts: s.alerts + 1 })),

  openChest: () => set({ phase: 'chest', prompt: null }),
  finishChest: () => set({ phase: 'scrolls', endedAt: now(), scroll: 'quests' }),
  setScroll: (scroll) => set({ scroll }),
}))

export function objectiveOf(s: Pick<MissionState, 'items' | 'kills'>): string {
  if (!s.items.includes(KEY_ID)) return 'Find the key to the study'
  if (!s.kills.includes(BOSS_ID)) return 'Neutralize the guardian in the study'
  return 'Open the chest and retrieve the scrolls'
}