import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  BUMP_DURATION,
  CORGI_X,
  HOP_DURATION,
  PATH_Z,
  RUN_CYCLE_SPEED,
  clamp,
} from './animations';

const BODY = '#EAA45C';
const BODY_DARK = '#D98F45';
const CREAM = '#FBEFDD';
const DARK = '#3A2E28';

function Leg({ legRef, x, z, color }) {
  return (
    <group ref={legRef} position={[x, 0.42, z]}>
      <mesh position={[0, -0.2, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.06, 0.4, 8]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.4, 0.02]} castShadow>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshStandardMaterial color={CREAM} roughness={0.8} />
      </mesh>
    </group>
  );
}

export default function Corgi({ phase, paused, feedback, feedbackSeq }) {
  const rootRef = useRef();
  const bodyRef = useRef();
  const tailRef = useRef();
  const legsRef = useRef([]);
  const clockRef = useRef(0);
  const actionRef = useRef({ type: 'idle', start: 0, lastSeq: 0 });

  const setLeg = (index) => (el) => {
    legsRef.current[index] = el;
  };

  useFrame((state, delta) => {
    const root = rootRef.current;
    if (!root) return;

    const running = phase === 'playing' && !paused;
    if (running) {
      clockRef.current += delta * RUN_CYCLE_SPEED;
    }
    const t = clockRef.current;
    const now = state.clock.elapsedTime;
    const action = actionRef.current;

    if (feedbackSeq !== action.lastSeq && (feedback === 'correct' || feedback === 'wrong')) {
      action.lastSeq = feedbackSeq;
      action.type = feedback === 'correct' ? 'hop' : 'bump';
      action.start = now;
    }

    root.position.set(CORGI_X, 0, PATH_Z);
    root.rotation.set(0, 0, 0);

    const legs = legsRef.current;
    const swing = Math.sin(t) * 0.7;

    if (action.type === 'hop') {
      const e = clamp((now - action.start) / HOP_DURATION, 0, 1);
      const h = Math.sin(e * Math.PI);
      root.position.y += h * 0.95;
      root.rotation.z = -h * 0.32;
      legs.forEach((leg, i) => {
        if (leg) leg.rotation.x = (i < 2 ? -1 : 1) * -0.9 * h;
      });
      if (tailRef.current) tailRef.current.rotation.z = 0.2 + h * 0.6;
      if (bodyRef.current) bodyRef.current.rotation.z = 0;
      if (e >= 1) action.type = 'idle';
    } else if (action.type === 'bump') {
      const e = clamp((now - action.start) / BUMP_DURATION, 0, 1);
      root.position.x = CORGI_X - 0.35 * (1 - e);
      root.rotation.z = 0.22 * Math.sin(e * Math.PI);
      legs.forEach((leg, i) => {
        if (leg) leg.rotation.x = i < 2 ? 0.5 * (1 - e) : 0;
      });
      if (e >= 1) action.type = 'idle';
    } else if (running) {
      root.position.y = Math.abs(Math.sin(t)) * 0.06;
      if (legs[0]) legs[0].rotation.x = swing;
      if (legs[1]) legs[1].rotation.x = -swing;
      if (legs[2]) legs[2].rotation.x = -swing;
      if (legs[3]) legs[3].rotation.x = swing;
      if (bodyRef.current) bodyRef.current.rotation.z = Math.sin(t) * 0.03;
      if (tailRef.current) tailRef.current.rotation.z = 0.2 + Math.sin(t * 1.6) * 0.25;
    } else {
      legs.forEach((leg) => {
        if (leg) leg.rotation.x = 0;
      });
      if (bodyRef.current) bodyRef.current.rotation.z = 0;
      if (tailRef.current) tailRef.current.rotation.z = 0.15 + Math.sin(now * 1.2) * 0.12;
    }

    if (phase === 'won') {
      root.position.x = CORGI_X + 0.7;
      root.position.y = Math.abs(Math.sin(now * 3)) * 0.32;
      root.rotation.z = Math.sin(now * 3) * 0.12;
    }
  });

  return (
    <group ref={rootRef} position={[CORGI_X, 0, PATH_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.56, 20]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.16} />
      </mesh>

      <group ref={bodyRef}>
        <mesh position={[0, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color={BODY} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0.5, 0.04]} castShadow>
          <sphereGeometry args={[0.34, 16, 16]} />
          <meshStandardMaterial color={CREAM} roughness={0.8} />
        </mesh>
        <mesh position={[-0.52, 0.62, 0]} castShadow>
          <sphereGeometry args={[0.3, 14, 14]} />
          <meshStandardMaterial color={BODY} roughness={0.8} />
        </mesh>

        <group position={[0.5, 0.9, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial color={BODY} roughness={0.75} />
          </mesh>
          <mesh position={[0.2, -0.06, 0]} castShadow>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color={CREAM} roughness={0.8} />
          </mesh>
          <mesh position={[0.37, -0.01, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={DARK} roughness={0.6} />
          </mesh>
          <mesh position={[0.14, 0.1, 0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={DARK} roughness={0.6} />
          </mesh>
          <mesh position={[0.14, 0.1, -0.15]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={DARK} roughness={0.6} />
          </mesh>
          <mesh position={[-0.02, 0.28, 0.15]} rotation={[0, 0, -0.25]} castShadow>
            <coneGeometry args={[0.11, 0.26, 8]} />
            <meshStandardMaterial color={BODY_DARK} roughness={0.8} />
          </mesh>
          <mesh position={[-0.02, 0.28, -0.15]} rotation={[0, 0, -0.25]} castShadow>
            <coneGeometry args={[0.11, 0.26, 8]} />
            <meshStandardMaterial color={BODY_DARK} roughness={0.8} />
          </mesh>
        </group>

        <group ref={tailRef} position={[-0.74, 0.72, 0]}>
          <mesh position={[-0.06, 0.08, 0]} rotation={[0, 0, 0.5]} castShadow>
            <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
            <meshStandardMaterial color={BODY} roughness={0.8} />
          </mesh>
        </group>
      </group>

      <Leg legRef={setLeg(0)} x={0.3} z={0.17} color={BODY} />
      <Leg legRef={setLeg(1)} x={0.3} z={-0.17} color={BODY} />
      <Leg legRef={setLeg(2)} x={-0.32} z={0.17} color={BODY} />
      <Leg legRef={setLeg(3)} x={-0.32} z={-0.17} color={BODY} />
    </group>
  );
}
