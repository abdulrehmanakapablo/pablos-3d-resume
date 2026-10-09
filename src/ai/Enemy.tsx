import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import { CapsuleCollider, RigidBody, type RapierRigidBody } from '@react-three/rapier'
import type { Group, Mesh } from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { AnimName, EnemyBrain } from './brain'

/** Set when the GLB exists, e.g. '/models/enemy.glb'. null = placeholder. */
const MODEL_URL: string | null = null
const BOSS_URL: string | null = null

/** Our anim names → clip names inside the GLB (rename Mixamo clips in Blender). */
const CLIPS: Record<AnimName, string> = {
  idle: 'Idle',
  walk: 'Walk',
  run: 'Run',
  aim: 'Aim',
  death: 'Death',
  takedown: 'Takedown',
}

if (MODEL_URL) useGLTF.preload(MODEL_URL)
if (BOSS_URL) useGLTF.preload(BOSS_URL)

function Model({ brain, url }: { brain: EnemyBrain; url: string }) {
  const group = useRef<Group>(null)
  const { scene, animations } = useGLTF(url)
  const model = useMemo(() => {
    const m = clone(scene)
    m.traverse((o) => {
      if ((o as Mesh).isMesh) {
        o.castShadow = true
        o.receiveShadow = true
      }
    })
    return m
  }, [scene])
  const { actions } = useAnimations(animations, group)

  useEffect(() => {
    const v = brain.view
    for (const k of Object.keys(CLIPS) as AnimName[]) {
      const a = actions[CLIPS[k]]
      if (a) v.actions[k] = a
    }
    v.current = null
    return () => {
      v.actions = {}
      v.current = null
    }
  }, [actions, brain])

  return (
    <group ref={group}>
      <primitive object={model} />
    </group>
  )
}

function Placeholder({ boss }: { boss: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.9, 0]}>
        <capsuleGeometry args={[0.35, 1.1, 4, 12]} />
        <meshStandardMaterial color={boss ? '#7f1d1d' : '#334155'} roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.58, 0.28]}>
        <boxGeometry args={[0.36, 0.1, 0.08]} />
        <meshStandardMaterial color="#f87171" emissive="#ef4444" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

export default function Enemy({ brain }: { brain: EnemyBrain }) {
  const body = useRef<RapierRigidBody>(null)
  const root = useRef<Group>(null)
  const url = brain.boss ? (BOSS_URL ?? MODEL_URL) : MODEL_URL

  useEffect(() => {
    const v = brain.view
    v.body = body.current
    v.root = root.current
    return () => {
      v.body = null
      v.root = null
    }
  }, [brain])

  return (
    <RigidBody
      ref={body}
      type="kinematicPosition"
      colliders={false}
      position={[brain.pos.x, brain.pos.y, brain.pos.z]}
      userData={{ type: 'enemy', id: brain.id }}
    >
      <CapsuleCollider args={[0.55, 0.35]} position={[0, 0.9, 0]} />
      <group ref={root} rotation-y={brain.yaw} scale={brain.boss ? 1.12 : 1}>
        {url ? (
          <Suspense fallback={<Placeholder boss={brain.boss} />}>
            <Model brain={brain} url={url} />
          </Suspense>
        ) : (
          <Placeholder boss={brain.boss} />
        )}
      </group>
    </RigidBody>
  )
}