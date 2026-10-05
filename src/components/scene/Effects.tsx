import { EffectComposer, Bloom } from '@react-three/postprocessing';

export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      {/* threshold 1: only emissive-boosted surfaces (sun, planets, orbit
          lines with toneMapped=false) bloom; smoothing widens the falloff
          for a softer, more cinematic halo */}
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1} luminanceSmoothing={0.25} />
    </EffectComposer>
  );
}
