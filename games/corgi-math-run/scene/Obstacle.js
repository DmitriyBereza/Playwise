import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  OBSTACLE_APPROACH_DURATION,
  OBSTACLE_START_X,
  OBSTACLE_STOP_X,
  PATH_Z,
  clamp,
  easeOutCubic,
  lerp,
} from './animations';

const VARIANTS = ['log', 'mushroom', 'rock'];

function Log() {
  return (
    <group>
      <mesh position={[0, 0.24, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.24, 0.24, 1.1, 12]} />
        <meshStandardMaterial color="#9A6B3F" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.24, 0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 12]} />
        <meshStandardMaterial color="#7A5230" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.24, -0.56]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.02, 12]} />
        <meshStandardMaterial color="#7A5230" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Mushroom() {
  return (
    <group>
      <mesh position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.14, 0.52, 10]} />
        <meshStandardMaterial color="#F3E2C7" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.56, 0]} castShadow>
        <sphereGeometry args={[0.32, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#E4574C" roughness={0.7} />
      </mesh>
      {[[0.14, 0.6, 0.12], [-0.15, 0.62, -0.08], [0.02, 0.66, -0.16]].map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color="#FFF6E6" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Rock() {
  return (
    <group>
      <mesh position={[0, 0.26, 0]} rotation={[0.3, 0.5, 0]} castShadow>
        <dodecahedronGeometry args={[0.38, 0]} />
        <meshStandardMaterial color="#9AA3AB" roughness={0.95} />
      </mesh>
      <mesh position={[0.3, 0.15, 0.1]} castShadow>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial color="#8B949C" roughness={0.95} />
      </mesh>
    </group>
  );
}

export default function Obstacle({ phase, questionId, feedback, feedbackSeq }) {
  const rootRef = useRef();
  const spinRef = useRef();
  const stateRef = useRef({ lastQuestion: -1, approachStart: 0, lastSeq: 0, spinStart: 0, wobbleStart: 0, spinning: false, wobbling: false });

  const variant = useMemo(() => VARIANTS[Math.floor(Math.random() * VARIANTS.length)], [questionId]);

  useFrame((state) => {
    const root = rootRef.current;
    if (!root) return;
    const now = state.clock.elapsedTime;
    const st = stateRef.current;

    if (questionId !== st.lastQuestion) {
      st.lastQuestion = questionId;
      st.approachStart = now;
    }

    if (feedbackSeq !== st.lastSeq) {
      st.lastSeq = feedbackSeq;
      if (feedback === 'correct') {
        st.spinning = true;
        st.spinStart = now;
      } else if (feedback === 'wrong') {
        st.wobbling = true;
        st.wobbleStart = now;
      }
    }

    const t = clamp((now - st.approachStart) / OBSTACLE_APPROACH_DURATION, 0, 1);
    root.position.x = lerp(OBSTACLE_START_X, OBSTACLE_STOP_X, easeOutCubic(t));
    root.position.y = t >= 1 ? Math.sin(now * 2.5) * 0.03 : 0;
    root.rotation.z = 0;

    if (spinRef.current) {
      if (st.spinning) {
        const e = clamp((now - st.spinStart) / 0.5, 0, 1);
        spinRef.current.rotation.y = e * Math.PI * 4;
        spinRef.current.scale.setScalar(1 - 0.28 * Math.sin(e * Math.PI));
        if (e >= 1) {
          st.spinning = false;
          spinRef.current.rotation.y = 0;
          spinRef.current.scale.setScalar(1);
        }
      } else if (st.wobbling) {
        const e = clamp((now - st.wobbleStart) / 0.5, 0, 1);
        spinRef.current.rotation.z = Math.sin(e * Math.PI * 4) * 0.18 * (1 - e);
        if (e >= 1) {
          st.wobbling = false;
          spinRef.current.rotation.z = 0;
        }
      }
    }

    root.visible = phase === 'playing';
  });

  return (
    <group ref={rootRef} position={[OBSTACLE_START_X, 0, PATH_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.5, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} />
      </mesh>
      <group ref={spinRef}>
        {variant === 'log' && <Log />}
        {variant === 'mushroom' && <Mushroom />}
        {variant === 'rock' && <Rock />}
      </group>
    </group>
  );
}
