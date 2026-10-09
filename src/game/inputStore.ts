import { Vector3 } from 'three'
import type { RapierRigidBody } from '@react-three/rapier'

/** Unified input from keyboard/mouse, touch and gamepad. Read in useFrame only. */
export const input = {
  moveX: 0,
  moveY: 0,
  lookX: 0,
  lookY: 0,
  sprint: false,
  crouch: false,
  touch: false,
  fire: false,
  interact: false,
  reload: false,
  flashlight: false,
}

type Edge = 'fire' | 'interact' | 'reload' | 'flashlight'
/** Edge-triggered flags: read once, then cleared. */
export function consume(k: Edge): boolean {
  const v = input[k]
  input[k] = false
  return v
}

/** Camera orientation; Player owns it, Weapon adds recoil. */
export const look = { yaw: 0, pitch: 0, recoil: 0 }

/** Player runtime refs shared with Weapon / Interaction / audio. */
export const rig = {
  body: null as RapierRigidBody | null,
  eye: new Vector3(),
  forward: new Vector3(0, 0, -1),
  flashlight: true,
}

const keys = new Set<string>()

function syncMove() {
  const k = (a: string, b: string) => (keys.has(a) || keys.has(b) ? 1 : 0)
  input.moveX = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft')
  input.moveY = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown')
  input.sprint = keys.has('ShiftLeft') || keys.has('ShiftRight')
}

export function resetInput() {
  keys.clear()
  input.moveX = input.moveY = input.lookX = input.lookY = 0
  input.sprint = input.crouch = false
  input.fire = input.interact = input.reload = input.flashlight = false
}

/* ---------- pointer lock ---------- */

let lockEl: HTMLElement | null = null
export const isLocked = () => lockEl !== null && document.pointerLockElement === lockEl

export function lockPointer() {
  if (lockEl && !isLocked() && !input.touch) Promise.resolve(lockEl.requestPointerLock()).catch(() => undefined)
}

export function unlockPointer() {
  if (document.pointerLockElement) document.exitPointerLock()
}

/** Keyboard + mouse. `onUnlock` fires when the user leaves pointer lock (Esc). */
export function bindDesktopInput(el: HTMLElement, onUnlock: () => void) {
  lockEl = el

  const down = (e: KeyboardEvent) => {
    if (e.repeat) return
    keys.add(e.code)
    syncMove()
    switch (e.code) {
      case 'KeyE':
        input.interact = true
        break
      case 'KeyR':
        input.reload = true
        break
      case 'KeyF':
        input.flashlight = true
        break
      case 'KeyC':
        input.crouch = !input.crouch
        break
    }
  }
  const up = (e: KeyboardEvent) => {
    keys.delete(e.code)
    syncMove()
  }
  const blur = () => {
    keys.clear()
    syncMove()
  }
  const move = (e: MouseEvent) => {
    if (!isLocked()) return
    input.lookX += e.movementX
    input.lookY += e.movementY
  }
  const mouse = (e: MouseEvent) => {
    if (e.button === 0 && isLocked()) input.fire = true
  }
  const change = () => {
    if (!isLocked()) {
      blur()
      onUnlock()
    }
  }

  window.addEventListener('keydown', down)
  window.addEventListener('keyup', up)
  window.addEventListener('blur', blur)
  document.addEventListener('mousemove', move)
  document.addEventListener('mousedown', mouse)
  document.addEventListener('pointerlockchange', change)

  return () => {
    window.removeEventListener('keydown', down)
    window.removeEventListener('keyup', up)
    window.removeEventListener('blur', blur)
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mousedown', mouse)
    document.removeEventListener('pointerlockchange', change)
    lockEl = null
  }
}

/* ---------- gamepad (standard mapping) ---------- */

const pad = { active: false, sprint: false, prev: [] as boolean[] }
const DEAD = 0.18

/** Call once per frame (Player does). */
export function pollGamepad() {
  const gp = navigator.getGamepads?.()[0]
  if (!gp) return
  const ax = (i: number) => {
    const v = gp.axes[i] ?? 0
    return Math.abs(v) > DEAD ? v : 0
  }
  const mx = ax(0)
  const my = -ax(1)
  if (mx || my) {
    input.moveX = mx
    input.moveY = my
    pad.active = true
  } else if (pad.active) {
    input.moveX = input.moveY = 0
    pad.active = false
  }
  input.lookX += ax(2) * 14
  input.lookY += ax(3) * 14

  const pressed = (i: number) => !!gp.buttons[i]?.pressed
  const edge = (i: number) => {
    const now = pressed(i)
    const was = pad.prev[i] ?? false
    pad.prev[i] = now
    return now && !was
  }
  if (edge(7)) input.fire = true
  if (edge(0)) input.interact = true
  if (edge(2)) input.reload = true
  if (edge(3)) input.flashlight = true
  if (edge(1)) input.crouch = !input.crouch
  const sprint = pressed(10)
  if (sprint !== pad.sprint) {
    input.sprint = sprint
    pad.sprint = sprint
  }
}