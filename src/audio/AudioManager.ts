import { Howl, Howler } from 'howler'
import { AUDIO_BASE, AUDIO_FORMATS, MUSIC, SOUNDS, type MusicKey, type SoundKey } from './sounds'
import { onAIEvent } from '../ai/brain'

type P3 = { x: number; y: number; z: number }

const COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const src = (file: string) => AUDIO_FORMATS.map((e) => `${AUDIO_BASE}${file}.${e}`)

Howler.autoSuspend = false

const bank = new Map<SoundKey, Howl[]>()

function load(key: SoundKey): Howl[] {
  let h = bank.get(key)
  if (!h) {
    const d = SOUNDS[key]
    h = d.files.map((f) => new Howl({ src: src(f), volume: d.volume ?? 1, loop: !!d.loop, pool: d.pool ?? 4 }))
    bank.set(key, h)
  }
  return h
}

export function preloadSounds(
  keys: SoundKey[] = Object.keys(SOUNDS) as SoundKey[],
  onProgress?: (p: number) => void,
): Promise<void> {
  const howls = keys.flatMap((k) => load(k))
  let done = 0
  return new Promise((resolve) => {
    if (!howls.length) return resolve()
    const step = () => {
      onProgress?.(++done / howls.length)
      if (done === howls.length) resolve()
    }
    for (const h of howls) {
      if (h.state() === 'loaded') step()
      else {
        h.once('load', step)
        h.once('loaderror', step)
      }
    }
  })
}

export function play(key: SoundKey, opts?: { pos?: P3; volume?: number; rate?: number }): number {
  const d = SOUNDS[key]
  const variants = load(key)
  const h = variants[(Math.random() * variants.length) | 0]
  const id = h.play()
  if (opts?.volume !== undefined) h.volume((d.volume ?? 1) * opts.volume, id)
  const [r0, r1] = d.rate ?? [0.94, 1.06]
  h.rate(opts?.rate ?? r0 + Math.random() * (r1 - r0), id)
  if (opts?.pos) {
    h.pos(opts.pos.x, opts.pos.y, opts.pos.z, id)
    h.pannerAttr(
      {
        panningModel: COARSE ? 'equalpower' : 'HRTF',
        distanceModel: 'inverse',
        refDistance: d.ref ?? 2,
        maxDistance: d.max ?? 40,
        rolloffFactor: 1.2,
      },
      id,
    )
  }
  return id
}

export function stop(key: SoundKey) {
  bank.get(key)?.forEach((h) => h.stop())
}

/** Call each frame from the Player/camera. */
export function setListener(pos: P3, forward: P3) {
  Howler.pos(pos.x, pos.y, pos.z)
  Howler.orientation(forward.x, forward.y, forward.z, 0, 1, 0)
}

/* ---------- music ---------- */

const tracks = new Map<MusicKey, { howl: Howl; id: number | null }>()
let current: MusicKey | null = null

function track(key: MusicKey) {
  let t = tracks.get(key)
  if (!t) {
    t = { howl: new Howl({ src: src(MUSIC[key].file), loop: MUSIC[key].loop, html5: true, volume: 0 }), id: null }
    tracks.set(key, t)
  }
  return t
}

export function setMusic(key: MusicKey | null, fade = 1500) {
  if (key === current) return
  if (current) {
    const t = track(current)
    if (t.id !== null) {
      const { howl } = t
      const id = t.id
      howl.fade(MUSIC[current].volume, 0, fade, id)
      howl.once('fade', () => howl.stop(id), id)
      t.id = null
    }
  }
  current = key
  if (key) {
    const t = track(key)
    t.id = t.howl.play()
    t.howl.volume(0, t.id)
    t.howl.fade(0, MUSIC[key].volume, fade, t.id)
  }
}

const RANK: Record<MusicKey, number> = { calm: 0, tension: 1, combat: 2, victory: 3 }
let calmSince = 0

/** Drive with getMaxAwareness(). Escalates instantly, de-escalates after 5s. */
export function setIntensity(awareness: number, now = performance.now()) {
  if (current === 'victory') return
  const want: MusicKey = awareness >= 1 ? 'combat' : awareness >= 0.35 ? 'tension' : 'calm'
  if (want === current) {
    calmSince = 0
    return
  }
  if (current && RANK[want] < RANK[current]) {
    if (!calmSince) calmSince = now
    if (now - calmSince < 5000) return
  }
  calmSince = 0
  setMusic(want)
}

/* ---------- global ---------- */

export const setMasterVolume = (v: number) => Howler.volume(Math.min(1, Math.max(0, v)))
export const setMuted = (m: boolean) => Howler.mute(m)

export function stopAll() {
  Howler.stop()
  tracks.forEach((t) => (t.id = null))
  current = null
}

/** AI → sound. Returns unsubscribe. */
export function wireAIAudio() {
  return onAIEvent((e) => {
    switch (e.type) {
      case 'alert':
        play('alertSting')
        break
      case 'fire':
        play('enemyShot', { pos: e.from })
        if (e.hit) play('playerHit')
        else play('bulletWhiz', { pos: e.from, volume: 0.7 })
        break
      case 'hurt':
        play('impactFlesh', { pos: e.pos })
        play('enemyHurt', { pos: e.pos })
        break
      case 'killed':
        play(e.takedown ? 'takedown' : 'enemyDeath', { pos: e.pos })
        setTimeout(() => play('bodyFall', { pos: e.pos }), e.takedown ? 250 : 550)
        break
    }
  })
}