import { Fragment, useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import EnemyManager from '../ai/EnemyManager'
import { getMaxAwareness, onAIEvent } from '../ai/brain'
import { loadNavmesh, navReady } from '../ai/navmesh'
import { play, setIntensity, setMusic, wireAIAudio } from '../audio/AudioManager'
import BriefingCinematic from '../cinematics/Briefing'
import ChestOpenCinematic from '../cinematics/ChestOpen'
import { CHEST_SHOT, applyCamera, cine, resetCine } from '../cinematics/theatre'
import { LEVEL } from '../data/level'
import AdaptiveQuality from '../fx/AdaptiveQuality'
import Decals from '../fx/Decals'
import Effects from '../fx/Effects'
import Gore from '../fx/Gore'
import Particles from '../fx/Particles'
import Chest from '../world/Chest'
import Colliders from '../world/Colliders'
import Doors from '../world/Doors'
import House from '../world/House'
import Lighting from '../world/Lighting'
import Props from '../world/Props'
import Scrolls from '../world/Scrolls'
import { buildNavGeometry } from '../world/layout'
import Interaction from './Interaction'
import Player from './Player'
import Weapon from './Weapon'
import { bindDesktopInput, resetInput, unlockPointer } from './inputStore'
import { useMission } from './missionStore'

const toPlaying = () => useMission.getState().setPhase('playing')
const chestDone = () => {
  useMission.getState().finishChest()
  play('missionComplete')
}

/** Slow orbit behind the main menu. */
function MenuCamera() {
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    cine.ownsCamera = true
    return () => {
      cine.ownsCamera = false
    }
  }, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 0.05
    camera.position.set(Math.sin(t) * 34, 13, Math.cos(t) * 34 - 2)
    camera.lookAt(0, 1, -2)
  })
  return null
}

/** Holds the final chest framing while the CV scrolls are open (also used by "Skip to CV"). */
function ScrollsCamera() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  useEffect(() => {
    cine.ownsCamera = true
    const v = CHEST_SHOT.sample(CHEST_SHOT.length)
    cine.lid = v.fx.lid
    cine.glow = v.fx.glow
    cine.rise = v.fx.rise
    return () => {
      cine.ownsCamera = false
    }
  }, [])
  useFrame(() => applyCamera(camera, CHEST_SHOT.sample(CHEST_SHOT.length), size.width / size.height))
  return null
}

export default function Game() {
  useState(() => {
    if (!navReady()) loadNavmesh(buildNavGeometry())
    return true
  })
  const phase = useMission((s) => s.phase)
  const runId = useMission((s) => s.runId)
  const gl = useThree((s) => s.gl)
  const acc = useRef(0)

  useEffect(() => bindDesktopInput(gl.domElement, () => useMission.getState().pause()), [gl])

  useEffect(() => {
    const offAudio = wireAIAudio()
    const offGame = onAIEvent((e) => {
      const m = useMission.getState()
      if (e.type === 'fire' && e.hit) m.damage(e.damage)
      else if (e.type === 'killed') m.registerKill(e.id, e.headshot, e.takedown)
      else if (e.type === 'alert') m.registerAlert()
    })
    return () => {
      offAudio()
      offGame()
    }
  }, [])

  useEffect(() => {
    resetInput()
    if (phase === 'menu') resetCine()
    else if (phase === 'briefing') {
      resetCine()
      setMusic('calm')
    } else if (phase === 'scrolls') setMusic('victory')
    else if (phase === 'dead') {
      setMusic(null)
      unlockPointer()
    }
  }, [phase])

  useFrame((_, dt) => {
    acc.current += dt
    if (acc.current < 0.5) return
    acc.current = 0
    if (useMission.getState().phase === 'playing') setIntensity(getMaxAwareness())
  })

  return (
    <>
      <AdaptiveQuality />
      <Lighting />
      <House />
      <Chest />
      <Scrolls />

      <Physics>
        <Colliders />
        <Fragment key={runId}>
          <Doors />
          <Props />
          <EnemyManager defs={LEVEL.enemies} />
          <Player />
          <Weapon />
          <Interaction />
        </Fragment>
      </Physics>

      <Fragment key={`fx-${runId}`}>
        <Particles />
        <Decals />
        <Gore />
      </Fragment>

      {phase === 'menu' && <MenuCamera />}
      {phase === 'briefing' && <BriefingCinematic onDone={toPlaying} />}
      {phase === 'chest' && <ChestOpenCinematic onDone={chestDone} />}
      {phase === 'scrolls' && <ScrollsCamera />}

      <Effects />
    </>
  )
}