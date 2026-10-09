export const AUDIO_BASE = '/audio/'
export const AUDIO_FORMATS = ['webm', 'mp3']

export interface SoundDef {
  files: string[]
  volume?: number
  rate?: [number, number]
  loop?: boolean
  pool?: number
  /** spatial: distance at which volume starts dropping */
  ref?: number
  max?: number
}

const v = (name: string, n: number) => Array.from({ length: n }, (_, i) => `sfx/${name}_${i + 1}`)
const one = (name: string) => [`sfx/${name}`]

const defs = {
  stepWood: { files: v('step_wood', 4), volume: 0.4, pool: 8 },
  stepTile: { files: v('step_tile', 4), volume: 0.4, pool: 8 },
  stepConcrete: { files: v('step_concrete', 4), volume: 0.4, pool: 8 },
  stepGrass: { files: v('step_grass', 4), volume: 0.35, pool: 8 },

  pistolShot: { files: v('pistol_suppressed', 3), volume: 0.8, pool: 6 },
  pistolDry: { files: one('pistol_dry'), volume: 0.6 },
  reload: { files: one('pistol_reload'), volume: 0.7, rate: [1, 1] },
  enemyShot: { files: v('rifle_shot', 3), volume: 0.9, pool: 8, ref: 4, max: 60 },
  bulletWhiz: { files: v('bullet_whiz', 2), volume: 0.6, ref: 1.5 },
  impactFlesh: { files: v('impact_flesh', 3), volume: 0.8, ref: 2 },
  impactWall: { files: v('impact_wall', 3), volume: 0.6, ref: 2 },

  playerHit: { files: v('player_hit', 2), volume: 0.8 },
  enemyHurt: { files: v('enemy_hurt', 3), volume: 0.8, ref: 3 },
  enemyDeath: { files: v('enemy_death', 3), volume: 0.9, ref: 3 },
  takedown: { files: v('takedown', 2), volume: 1, rate: [0.97, 1.03] },
  bodyFall: { files: v('body_fall', 2), volume: 0.8, ref: 3 },

  doorOpen: { files: one('door_open'), volume: 0.7, ref: 3 },
  doorLocked: { files: one('door_locked'), volume: 0.7 },
  pickup: { files: one('pickup'), volume: 0.6 },
  keyPickup: { files: one('key_pickup'), volume: 0.8 },
  chestOpen: { files: one('chest_open'), volume: 1, rate: [1, 1] },
  scrollUnroll: { files: v('scroll_unroll', 2), volume: 0.8 },

  alertSting: { files: one('alert_sting'), volume: 0.7, rate: [1, 1] },
  heartbeat: { files: one('heartbeat'), volume: 0.6, loop: true, rate: [1, 1] },
  uiHover: { files: one('ui_hover'), volume: 0.25, pool: 4 },
  uiClick: { files: one('ui_click'), volume: 0.4 },
  uiConfirm: { files: one('ui_confirm'), volume: 0.5, rate: [1, 1] },
  missionComplete: { files: one('mission_complete'), volume: 0.9, rate: [1, 1] },
} satisfies Record<string, SoundDef>

export type SoundKey = keyof typeof defs
export const SOUNDS: Record<SoundKey, SoundDef> = defs

export type MusicKey = 'calm' | 'tension' | 'combat' | 'victory'
export const MUSIC: Record<MusicKey, { file: string; volume: number; loop: boolean }> = {
  calm: { file: 'music/calm', volume: 0.35, loop: true },
  tension: { file: 'music/tension', volume: 0.45, loop: true },
  combat: { file: 'music/combat', volume: 0.5, loop: true },
  victory: { file: 'music/victory', volume: 0.55, loop: false },
}