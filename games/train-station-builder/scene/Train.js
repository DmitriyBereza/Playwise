import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { CELL_SIZE, TRAIN_ARRIVAL_DURATION, easeOutCubic } from './animations';

function Wheel({ x, z }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current && ref.current.userData.speed) {
      ref.current.rotation.x += ref.current.userData.speed * delta;
    }
  });

  return (
    <mesh ref={ref} castShadow position={[x, 0.1, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.1, 0.1, 0.05, 12]} />
      <meshStandardMaterial color="#333" metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

function Locomotive({ wheelRefs }) {
  return (
    <group>
      {/* Body */}
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[1.1, 0.44, 0.55]} />
        <meshStandardMaterial color="#D94040" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[0.95, 0.06, 0.5]} />
        <meshStandardMaterial color="#C73535" roughness={0.5} />
      </mesh>
      {/* Chimney */}
      <mesh castShadow position={[0.38, 0.72, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.22, 8]} />
        <meshStandardMaterial color="#444" roughness={0.6} />
      </mesh>
      {/* Front bumper */}
      <mesh castShadow position={[0.58, 0.22, 0]}>
        <boxGeometry args={[0.08, 0.26, 0.45]} />
        <meshStandardMaterial color="#FFD93D" roughness={0.5} />
      </mesh>
      {/* Windows */}
      {[[-0.08, 0.28], [-0.3, 0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.44, z]}>
          <planeGeometry args={[0.14, 0.14]} />
          <meshStandardMaterial color="#87CEEB" emissive="#87CEEB" emissiveIntensity={0.15} />
        </mesh>
      ))}
      {/* Wheels */}
      <Wheel x={-0.3} z={-0.3} />
      <Wheel x={-0.3} z={0.3} />
      <Wheel x={0.3} z={-0.3} />
      <Wheel x={0.3} z={0.3} />
    </group>
  );
}

function Carriage({ offsetX, color }) {
  return (
    <group position={[offsetX, 0, 0]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.0, 0.4, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 0.53, 0]}>
        <boxGeometry args={[0.9, 0.05, 0.46]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Windows */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 0.36, 0.26]}>
          <planeGeometry args={[0.12, 0.12]} />
          <meshStandardMaterial color="#FFE4A0" emissive="#FFE4A0" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {/* Wheels */}
      <Wheel x={-0.3} z={-0.28} />
      <Wheel x={-0.3} z={0.28} />
      <Wheel x={0.3} z={-0.28} />
      <Wheel x={0.3} z={0.28} />
    </group>
  );
}

export default function Train({ colors, cols, rows, trainArrived }) {
  const groupRef = useRef();
  const startTimeRef = useRef(0);
  const wheelGroupRef = useRef();

  const gridW = cols * CELL_SIZE;
  const gridD = rows * CELL_SIZE;
  const centerX = gridW * 0.5;
  const trackZ = gridD * 0.5 - gridD / 2 - 1.2;

  const startX = gridW + 10;
  const targetX = centerX;

  useFrame((state) => {
    if (!groupRef.current) return;

    if (!trainArrived) {
      groupRef.current.position.x = startX;
      startTimeRef.current = 0;
      return;
    }

    if (startTimeRef.current === 0) {
      startTimeRef.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTimeRef.current;
    const t = Math.min(elapsed / TRAIN_ARRIVAL_DURATION, 1);
    const eased = easeOutCubic(t);

    // Slight overshoot at the end
    let position = eased;
    if (t > 0.85) {
      const overT = (t - 0.85) / 0.15;
      position = eased + Math.sin(overT * Math.PI) * 0.015;
    }

    groupRef.current.position.x = startX + (targetX - startX) * position;

    // Set wheel speed based on velocity
    const speed = (1 - t) * 12;
    groupRef.current.traverse((child) => {
      if (child.userData !== undefined) {
        child.userData.speed = speed;
      }
    });
  });

  const carriageColors = ['#6BCBEF', '#5AACCC', '#4A9CBC'];

  return (
    <group ref={groupRef} position={[startX, 0, trackZ]}>
      <Locomotive />
      {carriageColors.map((color, i) => (
        <Carriage key={i} offsetX={-(i + 1) * 1.3} color={color} />
      ))}
    </group>
  );
}
