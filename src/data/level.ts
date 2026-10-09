import type { EnemyDef, V2 } from '../ai/brain'

/**
 * Single source of truth for the map. Meters. +X east, +Z south (toward the yard).
 * yaw: forward = (sin yaw, 0, cos yaw) → 0 faces +Z, PI faces -Z.
 *
 *   z=-14 ┌──────────┬──────────┐
 *         │ STORAGE  │  STUDY ★ │   ★ chest
 *   z=-4  ├───d──────┴──────d───┤
 *         │        HALLWAY      │
 *   z=0   ├───d──────┬──────d───┤
 *         │  LIVING  d KITCHEN  │
 *   z=10  └──────────d──────────┘   front door
 *                  YARD
 *         x=-12     x=0     x=12
 */

export type Surface = 'wood' | 'tile' | 'concrete' | 'grass'

export interface Room {
  id: string
  name: string
  min: V2
  max: V2
  surface: Surface
}

export interface DoorDef {
  id: string
  pos: V2
  /** 'x' = door sits in a wall running along X (constant z) */
  axis: 'x' | 'z'
  width: number
  lockedBy?: string
}

export type PickupKind = 'intel' | 'key' | 'ammo' | 'health'

export interface PickupDef {
  id: string
  kind: PickupKind
  pos: V2
  y: number
  /** intel → key in INTEL (cv.ts) */
  ref?: string
}

export interface LevelDef {
  wallHeight: number
  wallThickness: number
  house: { min: V2; max: V2 }
  ground: { min: V2; max: V2 }
  spawn: { pos: V2; yaw: number }
  rooms: Room[]
  doors: DoorDef[]
  enemies: EnemyDef[]
  chest: { pos: V2; yaw: number; lockedBy?: string }
  pickups: PickupDef[]
}

export const LEVEL: LevelDef = {
  wallHeight: 3.2,
  wallThickness: 0.25,
  house: { min: [-12, -14], max: [12, 10] },
  ground: { min: [-30, -30], max: [30, 34] },
  spawn: { pos: [-3, 20], yaw: Math.PI },

  rooms: [
    { id: 'living', name: 'Living Room', min: [-12, 0], max: [0, 10], surface: 'wood' },
    { id: 'kitchen', name: 'Kitchen', min: [0, 0], max: [12, 10], surface: 'tile' },
    { id: 'hall', name: 'Hallway', min: [-12, -4], max: [12, 0], surface: 'wood' },
    { id: 'storage', name: 'Storage', min: [-12, -14], max: [0, -4], surface: 'concrete' },
    { id: 'study', name: 'Study', min: [0, -14], max: [12, -4], surface: 'wood' },
  ],

  doors: [
    { id: 'front', pos: [-3, 10], axis: 'x', width: 1.4 },
    { id: 'living-kitchen', pos: [0, 5], axis: 'z', width: 1.2 },
    { id: 'living-hall', pos: [-6, 0], axis: 'x', width: 1.2 },
    { id: 'kitchen-hall', pos: [6, 0], axis: 'x', width: 1.2 },
    { id: 'hall-storage', pos: [-6, -4], axis: 'x', width: 1.2 },
    { id: 'hall-study', pos: [6, -4], axis: 'x', width: 1.2, lockedBy: 'studyKey' },
  ],

  enemies: [
    { id: 'g1', spawn: [-9, 7], patrol: [[-9, 7], [-3, 7], [-3, 2], [-9, 2]], wait: 1.5 },
    { id: 'g2', spawn: [3, 8], patrol: [[3, 8], [9, 8], [9, 2]], wait: 2.5 },
    { id: 'g3', spawn: [-10, -2], patrol: [[-10, -2], [10, -2]], wait: 3 },
    // back to the door, inspecting loot: the takedown opportunity
    { id: 'g4', spawn: [-6, -9], yaw: Math.PI, patrol: [[-6, -9]] },
    { id: 'boss', spawn: [3, -9], patrol: [[3, -9], [9, -9]], wait: 4, boss: true, hp: 300 },
  ],

  chest: { pos: [6, -12.5], yaw: 0 },

  pickups: [
    { id: 'studyKey', kind: 'key', pos: [-9, -12.5], y: 0.9 },
    { id: 'intel-stack', kind: 'intel', pos: [-10, 8], y: 0.8, ref: 'stack' },
    { id: 'intel-db', kind: 'intel', pos: [10, 2], y: 1.0, ref: 'database' },
    { id: 'intel-ship', kind: 'intel', pos: [0, -1], y: 0.8, ref: 'shipping' },
    { id: 'ammo-1', kind: 'ammo', pos: [3, 9], y: 1.0 },
    { id: 'health-1', kind: 'health', pos: [-3, -10], y: 0.9 },
  ],
}