'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { BASE_SCROLL_SPEED } from './animations';
import { getCorgiColors } from './skinThemes';
import Environment from './Environment';
import Obstacle from './Obstacle';
import Corgi from './Corgi';

const CAMERA_PITCH = -0.158;

function SceneContent({ colors, phase, paused, questionId, feedback, feedbackSeq }) {
  const { size } = useThree();
  const scrollRef = useRef(0);

  useFrame((_, delta) => {
    if (phase === 'playing' && !paused) {
      scrollRef.current += Math.min(delta, 0.05) * BASE_SCROLL_SPEED;
    }
  });

  const zoom = useMemo(() => {
    const width = size.width || 800;
    const height = size.height || 500;
    return Math.min(width / 15, height / 9);
  }, [size.width, size.height]);

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[1.6, 3.6, 16]}
        rotation={[CAMERA_PITCH, 0, 0]}
        zoom={zoom}
        near={0.1}
        far={200}
      />

      <ambientLight intensity={0.72} color="#fff8ee" />
      <hemisphereLight args={[colors.skyTop, colors.grass, 0.42]} />
      <directionalLight
        position={[6, 16, 10]}
        intensity={1.05}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-14}
        shadow-camera-right={16}
        shadow-camera-top={10}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
      />

      <fog attach="fog" args={[colors.fog, 24, 50]} />

      <Environment colors={colors} scrollRef={scrollRef} />
      <Obstacle phase={phase} questionId={questionId} feedback={feedback} feedbackSeq={feedbackSeq} />
      <Corgi phase={phase} paused={paused} feedback={feedback} feedbackSeq={feedbackSeq} />
    </>
  );
}

export default function RunnerScene({ skin, phase, paused, questionId, feedback, feedbackSeq }) {
  const colors = useMemo(() => getCorgiColors(skin), [skin]);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent
        colors={colors}
        phase={phase}
        paused={paused}
        questionId={questionId}
        feedback={feedback}
        feedbackSeq={feedbackSeq}
      />
    </Canvas>
  );
}
