import type { ReactElement } from 'react'
import {
  Bloom,
  BrightnessContrast,
  EffectComposer,
  HueSaturation,
  N8AO,
  Noise,
  SMAA,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useQuality, useQualityStore } from '../hooks/useQuality'

/** Cinematic post stack, scaled by quality tier. Renderer is `flat`, so AgX tone mapping happens here. */
export default function Effects() {
  const tier = useQualityStore((s) => s.tier)
  const q = useQuality()
  const passes: ReactElement[] = []

  if (q.ao)
    passes.push(
      <N8AO
        key="ao"
        aoRadius={1.2}
        distanceFalloff={0.6}
        intensity={2.4}
        quality={q.aoHalfRes ? 'performance' : 'high'}
        halfRes={q.aoHalfRes}
      />,
    )
  if (q.bloom) passes.push(<Bloom key="bloom" mipmapBlur luminanceThreshold={0.9} luminanceSmoothing={0.25} intensity={0.85} />)
  passes.push(
    <ToneMapping key="tm" mode={ToneMappingMode.AGX} />,
    <HueSaturation key="hs" saturation={0.12} />,
    <BrightnessContrast key="bc" brightness={0.02} contrast={0.1} />,
    <Vignette key="vig" offset={0.28} darkness={0.55} />,
  )
  if (q.grain) passes.push(<Noise key="grain" premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.3} />)
  passes.push(<SMAA key="smaa" />)

  return (
    <EffectComposer key={tier} multisampling={0} enableNormalPass={false}>
      {passes}
    </EffectComposer>
  )
}