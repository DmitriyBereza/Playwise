import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CUSTOMER_END_Z, CUSTOMER_START_Z, easeOutCubic } from './animations';

const SHIRT_COLORS = ['#7EC8E3', '#FF8FAB', '#A78BFA', '#86EFAC', '#FDBA74'];

export default function CustomerAnimation({ phase, walkProgress, customerIndex = 0 }) {
  const groupRef = useRef();
  const shirtColor = SHIRT_COLORS[customerIndex % SHIRT_COLORS.length];

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }

    const eased = easeOutCubic(walkProgress);
    let z = CUSTOMER_START_Z;

    if (phase === 'customerEntering') {
      z = CUSTOMER_START_Z + (CUSTOMER_END_Z - CUSTOMER_START_Z) * eased;
    } else if (phase === 'customerLeaving') {
      z = CUSTOMER_END_Z + (CUSTOMER_START_Z - CUSTOMER_END_Z) * eased;
    } else if (
      phase === 'showOrder' ||
      phase === 'pickTotal' ||
      phase === 'totalFeedback' ||
      phase === 'showPayment' ||
      phase === 'pickChange' ||
      phase === 'changeFeedback'
    ) {
      z = CUSTOMER_END_Z;
    }

    const bob =
      phase !== 'customerEntering' && phase !== 'customerLeaving'
        ? Math.sin(state.clock.elapsedTime * 2.2) * 0.04
        : 0;

    groupRef.current.position.set(0.8, 0.55 + bob, z);
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.35]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#FFE4C4" />
      </mesh>
      <mesh position={[0, 0.92, 0.2]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
      <mesh position={[-0.1, 0.9, 0.22]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
      <mesh position={[0.1, 0.9, 0.22]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
    </group>
  );
}
