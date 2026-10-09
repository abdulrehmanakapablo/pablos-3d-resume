import { LoopOnce, LoopRepeat, Vector3, type AnimationAction, type Object3D } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'
import { findPath } from './navmesh'
import { emitNoise, NOISE } from './hearing'

export type V2 = [number, number]
export type AIState = 'patrol' | 'wait' | 'investigate' | 'search' | 'combat' | 'takedown' | 'dead'
export type AnimName = 'idle' | 'walk' | 'run' | 'aim' | 'death' | 'takedown'

export interface EnemyDef {
  id: string
  spawn: V2
  yaw?: number
  /** 1 point = stationary post, 2+ = patrol loop */
  patrol: V2[]
  wait?: number
  hp?: number
  boss?: boolean
}

export interface EnemyView {
  body: RapierRigidBody | null
  root: Object3D | null
  actions: Partial<Record<AnimName, AnimationAction>>
  current: AnimName | null
}

export interface EnemyBrain {
  id: string
  def: EnemyDef
  boss: boolean
  state: AIState
  pos: Vector3
  yaw: number
  targetYaw: number
  hp: number
  maxHp: number
  awareness: number
  lastKnown: Vector3
  lostFor: number
  timer: number
  repath: number
  fireCd: number
  path: Vector3[]
  pathIdx: number
  hasGoal: boolean
  patrolIdx: number
  speed: number
  anim: AnimName
  wantsFire: boolean
  view: EnemyView
}

export const AI = {
  walkSpeed: 1.6,
  runSpeed: 4.2,
  turnRate: 8,
  investigateAt: 0.35,
  combatAt: 1,
  gainRate: 1.6,
  combatGain: 4,
  decay: 0.12,
  loseSightTime: 5,
  searchTime: 6,
  firstShotDelay: 0.6,
  fireInterval: [0.7, 1.4] as [number, number],
  fireRange: 14,
  stopRange: 7,
  alertRadius: 16,
  takedownRange: 1.6,
  takedownDot: -0.35,
  takedownTime: 1.6,
  damage: 14,
  bossDamage: 22,
  headMultiplier: 4,
}

/** Written by the Player every frame. Read-only for AI. */
export const playerSense = {
  pos: new Vector3(),
  chest: new Vector3(0, 1.4, 0),
  speed: 0,
  /** 0..~1.3: crouch, darkness and flashlight scale this */
  visibility: 1,
  alive: true,
}

export type AIEvent =
  | { type: 'state'; id: string; state: AIState }
  | { type: 'alert'; id: string; pos: Vector3 }
  | { type: 'fire'; id: string; from: Vector3; hit: boolean; damage: number }
  | { type: 'hurt'; id: string; pos: Vector3; headshot: boolean }
  | { type: 'killed'; id: string; pos: Vector3; headshot: boolean; takedown: boolean }

type Listener = (e: AIEvent) => void
const listeners = new Set<Listener>()

export function onAIEvent(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
const emit = (e: AIEvent) => listeners.forEach((l) => l(e))

export const enemies = new Map<string, EnemyBrain>()

const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a))
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const tmp = new Vector3()

function createBrain(def: EnemyDef): EnemyBrain {
  const hp = def.hp ?? (def.boss ? 300 : 100)
  const yaw = def.yaw ?? 0
  return {
    id: def.id,
    def,
    boss: !!def.boss,
    state: def.patrol.length > 1 ? 'patrol' : 'wait',
    pos: new Vector3(def.spawn[0], 0, def.spawn[1]),
    yaw,
    targetYaw: yaw,
    hp,
    maxHp: hp,
    awareness: 0,
    lastKnown: new Vector3(),
    lostFor: 0,
    timer: 0,
    repath: 0,
    fireCd: 0,
    path: [],
    pathIdx: 0,
    hasGoal: false,
    patrolIdx: 0,
    speed: 0,
    anim: 'idle',
    wantsFire: false,
    view: { body: null, root: null, actions: {}, current: null },
  }
}

export function resetEnemies(defs: EnemyDef[]) {
  enemies.clear()
  for (const d of defs) enemies.set(d.id, createBrain(d))
}

function setState(b: EnemyBrain, s: AIState) {
  b.timer = 0
  if (b.state === s) return
  b.state = s
  emit({ type: 'state', id: b.id, state: s })
}

function goTo(b: EnemyBrain, target: Vector3) {
  b.path = findPath(b.pos, target)
  b.pathIdx = 0
  b.hasGoal = b.path.length > 0
}

/** Returns true when the goal is reached (or there is none). */
function moveAlong(b: EnemyBrain, dt: number, speed: number): boolean {
  if (!b.hasGoal) {
    b.speed = 0
    return true
  }
  const t = b.path[b.pathIdx]
  const dx = t.x - b.pos.x
  const dz = t.z - b.pos.z
  const d = Math.hypot(dx, dz)
  const step = speed * dt
  b.speed = speed
  if (d <= step + 0.05) {
    b.pos.set(t.x, t.y, t.z)
    if (++b.pathIdx >= b.path.length) {
      b.hasGoal = false
      b.speed = 0
      return true
    }
    return false
  }
  b.pos.x += (dx / d) * step
  b.pos.z += (dz / d) * step
  b.pos.y += (t.y - b.pos.y) * Math.min(1, step / d)
  b.targetYaw = Math.atan2(dx, dz)
  return false
}

function enterCombat(b: EnemyBrain) {
  setState(b, 'combat')
  b.awareness = 1.2
  b.lostFor = 0
  b.repath = 0
  b.fireCd = AI.firstShotDelay
  emit({ type: 'alert', id: b.id, pos: b.lastKnown.clone() })

  const r2 = AI.alertRadius * AI.alertRadius
  for (const o of enemies.values()) {
    if (o === b || o.state === 'combat' || o.state === 'dead' || o.state === 'takedown') continue
    if (o.pos.distanceToSquared(b.pos) > r2) continue
    o.awareness = Math.max(o.awareness, 0.75)
    o.lastKnown.copy(b.lastKnown)
    setState(o, 'investigate')
    goTo(o, o.lastKnown)
    o.repath = 1
  }
}

function combat(b: EnemyBrain, dt: number, los: boolean) {
  const p = playerSense
  if (!p.alive) {
    b.awareness = 0.3
    setState(b, 'search')
    return
  }
  if (los) {
    b.lostFor = 0
    b.lastKnown.copy(p.pos)
    const dx = p.pos.x - b.pos.x
    const dz = p.pos.z - b.pos.z
    const d = Math.hypot(dx, dz)
    if (d > AI.stopRange) {
      if (b.repath <= 0 || !b.hasGoal) {
        goTo(b, p.pos)
        b.repath = 0.5
      }
      moveAlong(b, dt, AI.runSpeed)
      b.anim = 'run'
    } else {
      b.speed = 0
      b.hasGoal = false
      b.anim = 'aim'
    }
    b.targetYaw = Math.atan2(dx, dz)
    if (d < AI.fireRange && b.fireCd <= 0 && Math.abs(wrap(b.targetYaw - b.yaw)) < 0.3) {
      b.wantsFire = true
      b.fireCd = rand(AI.fireInterval[0], AI.fireInterval[1])
    }
    return
  }
  b.lostFor += dt
  if (!b.hasGoal && b.repath <= 0) {
    goTo(b, b.lastKnown)
    b.repath = 1
  }
  b.anim = 'run'
  const arrived = moveAlong(b, dt, AI.runSpeed)
  if ((arrived && b.lostFor > 1) || b.lostFor > AI.loseSightTime) {
    b.awareness = 0.6
    setState(b, 'search')
  }
}

export function updateBrain(
  b: EnemyBrain,
  dt: number,
  exposure: number,
  los: boolean,
  heard: Vector3 | null,
  heardStrength: number,
) {
  if (b.state === 'dead') return
  if (b.state === 'takedown') {
    b.timer += dt
    if (b.timer >= AI.takedownTime) kill(b, false, true)
    return
  }

  b.timer += dt
  b.repath -= dt
  b.fireCd -= dt
  b.wantsFire = false

  if (exposure > 0) {
    b.awareness = Math.min(1.2, b.awareness + exposure * (b.state === 'combat' ? AI.combatGain : AI.gainRate) * dt)
    b.lastKnown.copy(playerSense.pos)
  } else if (b.state !== 'combat') {
    b.awareness = Math.max(0, b.awareness - AI.decay * dt)
  }

  if (heard && b.state !== 'combat') {
    b.awareness = Math.max(b.awareness, AI.investigateAt + heardStrength * 0.6)
    b.lastKnown.copy(heard)
    if (b.state !== 'investigate' || b.repath <= 0) {
      setState(b, 'investigate')
      goTo(b, heard)
      b.repath = 1
    }
  }

  if (b.state !== 'combat' && b.awareness >= AI.combatAt) enterCombat(b)
  else if (
    exposure > 0 &&
    b.awareness >= AI.investigateAt &&
    (b.state === 'patrol' || b.state === 'wait' || b.state === 'search')
  ) {
    setState(b, 'investigate')
    goTo(b, b.lastKnown)
    b.repath = 0.6
  }

  switch (b.state) {
    case 'patrol': {
      b.anim = 'walk'
      if (!b.hasGoal) {
        const [x, z] = b.def.patrol[b.patrolIdx]
        goTo(b, tmp.set(x, b.pos.y, z))
      }
      if (moveAlong(b, dt, AI.walkSpeed)) {
        b.patrolIdx = (b.patrolIdx + 1) % b.def.patrol.length
        setState(b, 'wait')
      }
      break
    }
    case 'wait': {
      b.speed = 0
      b.anim = 'idle'
      if (b.def.patrol.length < 2) b.targetYaw = b.def.yaw ?? b.targetYaw
      else if (b.timer >= (b.def.wait ?? 2)) setState(b, 'patrol')
      break
    }
    case 'investigate': {
      if (exposure > 0 && b.repath <= 0) {
        goTo(b, b.lastKnown)
        b.repath = 0.6
      }
      const fast = b.awareness > 0.7
      b.anim = fast ? 'run' : 'walk'
      if (moveAlong(b, dt, fast ? AI.runSpeed : AI.walkSpeed) || b.timer > 20) setState(b, 'search')
      break
    }
    case 'search': {
      b.speed = 0
      b.anim = 'idle'
      b.targetYaw += Math.sin(b.timer * 1.3) * 1.6 * dt
      if (b.timer >= AI.searchTime) {
        b.awareness = Math.min(b.awareness, 0.2)
        b.hasGoal = false
        setState(b, 'patrol')
      }
      break
    }
    case 'combat':
      combat(b, dt, los)
      break
  }
}

/** Hit chance resolved here; the player/health system listens for 'fire'. */
export function resolveFire(b: EnemyBrain) {
  const p = playerSense
  const d = b.pos.distanceTo(p.pos)
  const chance = Math.min(
    0.85,
    Math.max(
      0.08,
      0.62 -
        d * 0.025 -
        Math.min(p.speed, 6) * 0.04 -
        (p.visibility < 0.7 ? 0.12 : 0) -
        b.speed * 0.05 +
        (b.boss ? 0.12 : 0),
    ),
  )
  const hit = Math.random() < chance
  const from = new Vector3(b.pos.x, b.pos.y + 1.45, b.pos.z)
  emitNoise(from, NOISE.enemyFire, 1, 'enemy')
  emit({ type: 'fire', id: b.id, from, hit, damage: hit ? (b.boss ? AI.bossDamage : AI.damage) : 0 })
}

export function damageEnemy(b: EnemyBrain, amount: number, headshot: boolean, from: Vector3) {
  if (b.state === 'dead' || b.state === 'takedown') return
  b.hp -= amount * (headshot ? AI.headMultiplier : 1)
  emit({ type: 'hurt', id: b.id, pos: b.pos.clone(), headshot })
  if (b.hp <= 0) return kill(b, headshot, false)
  b.lastKnown.copy(from)
  if (b.state !== 'combat') enterCombat(b)
}

export function canTakedown(b: EnemyBrain, playerPos: Vector3): boolean {
  if (b.boss || b.state === 'dead' || b.state === 'takedown' || b.state === 'combat') return false
  const dx = playerPos.x - b.pos.x
  const dz = playerPos.z - b.pos.z
  const d = Math.hypot(dx, dz)
  if (d > AI.takedownRange || d < 1e-3) return false
  return (Math.sin(b.yaw) * dx + Math.cos(b.yaw) * dz) / d < AI.takedownDot
}

export function startTakedown(b: EnemyBrain) {
  setState(b, 'takedown')
  b.awareness = 0
  b.speed = 0
  b.hasGoal = false
  b.anim = 'takedown'
}

function kill(b: EnemyBrain, headshot: boolean, takedown: boolean) {
  setState(b, 'dead')
  b.hp = 0
  b.speed = 0
  b.hasGoal = false
  b.wantsFire = false
  b.anim = 'death'
  if (!takedown) playAnim(b.view, 'death')
  const body = b.view.body
  if (body) for (let i = 0; i < body.numColliders(); i++) body.collider(i).setEnabled(false)
  emitNoise(b.pos, NOISE.bodyFall, 0.8, 'world')
  emit({ type: 'killed', id: b.id, pos: b.pos.clone(), headshot, takedown })
}

function playAnim(v: EnemyView, name: AnimName) {
  const next = v.actions[name] ?? v.actions.idle
  const prev = v.current ? v.actions[v.current] : undefined
  v.current = name
  if (!next || next === prev) return
  const once = name === 'death' || name === 'takedown'
  next.reset()
  next.setLoop(once ? LoopOnce : LoopRepeat, Infinity)
  next.clampWhenFinished = once
  next.fadeIn(0.2).play()
  prev?.fadeOut(0.2)
}

/** Brain → physics + visuals. Called by EnemyManager after updateBrain. */
export function syncView(b: EnemyBrain, dt: number) {
  b.yaw += wrap(b.targetYaw - b.yaw) * (1 - Math.exp(-AI.turnRate * dt))
  const v = b.view
  v.body?.setNextKinematicTranslation(b.pos)
  if (v.root) v.root.rotation.y = b.yaw
  if (b.anim !== v.current) playAnim(v, b.anim)
}

/** 0..1.2 — HUD detection meter + music intensity. */
export function getMaxAwareness() {
  let m = 0
  for (const b of enemies.values()) if (b.state !== 'dead' && b.awareness > m) m = b.awareness
  return m
}

export function aliveCount() {
  let n = 0
  for (const b of enemies.values()) if (b.state !== 'dead') n++
  return n
}