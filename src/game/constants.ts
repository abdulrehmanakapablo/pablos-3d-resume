import type { SoundKey } from '../audio/sounds'
import type { Surface } from '../data/level'

export const PLAYER = {
  radius: 0.35,
  halfHeight: 0.55,
  eye: 1.62,
  crouchEye: 1.05,
  walk: 3.2,
  run: 5.8,
  crouch: 1.6,
  accel: 14,
  maxHealth: 100,
  lookSpeed: 0.0022,
  touchLookSpeed: 0.0055,
  pitchLimit: 1.45,
  stride: { crouch: 0.6, walk: 0.8, run: 1.05 },
}

export const WEAPON = {
  magSize: 12,
  reserve: 48,
  damage: 34,
  fireInterval: 0.2,
  reloadTime: 1.5,
  range: 80,
  spreadIdle: 0.004,
  spreadMove: 0.022,
  recoil: 0.035,
  infinite: true,
}

export const PICKUP = { ammo: 24, health: 40, range: 1.7 }
export const INTERACT = { door: 2, chest: 2.4, scanHz: 10 }

export const SURFACE_SOUND: Record<Surface, SoundKey> = {
  wood: 'stepWood',
  tile: 'stepTile',
  concrete: 'stepConcrete',
  grass: 'stepGrass',
}