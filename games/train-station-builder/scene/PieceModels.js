import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const MAT_PROPS = { roughness: 0.7, metalness: 0.1 };

function Bench({ colors }) {
  return (
    <group>
      {/* Seat plank */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.3]} />
        <meshStandardMaterial color={colors.bench} {...MAT_PROPS} />
      </mesh>
      {/* Backrest */}
      <mesh castShadow position={[0, 0.42, -0.12]}>
        <boxGeometry args={[0.7, 0.2, 0.04]} />
        <meshStandardMaterial color={colors.bench} {...MAT_PROPS} />
      </mesh>
      {/* Legs */}
      {[[-0.28, -0.1], [-0.28, 0.1], [0.28, -0.1], [0.28, 0.1]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.15, z]}>
          <cylinderGeometry args={[0.025, 0.025, 0.28, 6]} />
          <meshStandardMaterial color={colors.benchLeg} {...MAT_PROPS} />
        </mesh>
      ))}
    </group>
  );
}

function Shelter({ colors }) {
  return (
    <group>
      {/* 4 posts */}
      {[[-0.32, -0.32], [-0.32, 0.32], [0.32, -0.32], [0.32, 0.32]].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.035, 0.035, 0.7, 6]} />
          <meshStandardMaterial color={colors.shelterPost} {...MAT_PROPS} />
        </mesh>
      ))}
      {/* Roof */}
      <mesh castShadow position={[0, 0.72, 0]}>
        <boxGeometry args={[0.85, 0.06, 0.85]} />
        <meshStandardMaterial color={colors.shelterRoof} {...MAT_PROPS} />
      </mesh>
      {/* Bench underneath */}
      <mesh castShadow position={[0, 0.22, 0.1]}>
        <boxGeometry args={[0.6, 0.04, 0.22]} />
        <meshStandardMaterial color={colors.bench} {...MAT_PROPS} />
      </mesh>
      {/* Glass back panel */}
      <mesh position={[0, 0.42, -0.3]}>
        <boxGeometry args={[0.75, 0.4, 0.03]} />
        <meshStandardMaterial color={colors.shelterGlass} transparent opacity={0.35} {...MAT_PROPS} />
      </mesh>
    </group>
  );
}

function Elevator({ colors }) {
  return (
    <group>
      {/* Shaft frame */}
      <mesh castShadow position={[0, 0.45, 0]}>
        <boxGeometry args={[0.55, 0.9, 0.55]} />
        <meshStandardMaterial color={colors.elevator} {...MAT_PROPS} />
      </mesh>
      {/* Cab inside */}
      <mesh position={[0, 0.22, 0.02]}>
        <boxGeometry args={[0.42, 0.35, 0.42]} />
        <meshStandardMaterial color={colors.elevatorCab} {...MAT_PROPS} />
      </mesh>
      {/* Door indicators */}
      <mesh position={[-0.08, 0.35, 0.28]}>
        <boxGeometry args={[0.04, 0.28, 0.01]} />
        <meshStandardMaterial color={colors.elevatorDoor} emissive={colors.elevatorDoor} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.08, 0.35, 0.28]}>
        <boxGeometry args={[0.04, 0.28, 0.01]} />
        <meshStandardMaterial color={colors.elevatorDoor} emissive={colors.elevatorDoor} emissiveIntensity={0.3} />
      </mesh>
      {/* Top housing */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <boxGeometry args={[0.48, 0.08, 0.48]} />
        <meshStandardMaterial color={colors.elevator} {...MAT_PROPS} />
      </mesh>
    </group>
  );
}

function Flowerpot({ colors }) {
  return (
    <group>
      {/* Pot */}
      <mesh castShadow position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.16, 0.12, 0.24, 8]} />
        <meshStandardMaterial color={colors.pot} {...MAT_PROPS} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 8]} />
        <meshStandardMaterial color="#5A4030" {...MAT_PROPS} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.28, 4]} />
        <meshStandardMaterial color="#4A8B3A" {...MAT_PROPS} />
      </mesh>
      {/* Leaves */}
      {[[0, 0.55, 0], [0.07, 0.5, 0.05], [-0.06, 0.48, -0.04]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}>
          <sphereGeometry args={[0.07, 6, 6]} />
          <meshStandardMaterial color={colors.plant} {...MAT_PROPS} />
        </mesh>
      ))}
    </group>
  );
}

function Lamp({ colors }) {
  return (
    <group>
      {/* Base */}
      <mesh castShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.1, 0.11, 0.06, 8]} />
        <meshStandardMaterial color={colors.lampPole} {...MAT_PROPS} />
      </mesh>
      {/* Pole */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.025, 0.035, 0.75, 6]} />
        <meshStandardMaterial color={colors.lampPole} {...MAT_PROPS} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0, 0.82, 0]}>
        <sphereGeometry args={[0.09, 8, 8, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        <meshStandardMaterial
          color={colors.lampGlow}
          emissive={colors.lampGlow}
          emissiveIntensity={0.6}
          {...MAT_PROPS}
        />
      </mesh>
      <pointLight position={[0, 0.82, 0]} intensity={0.4} distance={2.5} color={colors.lampGlow} />
    </group>
  );
}

function Clock({ colors }) {
  const hourRef = useRef();
  const minuteRef = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (hourRef.current) hourRef.current.rotation.z = -t * 0.1;
    if (minuteRef.current) minuteRef.current.rotation.z = -t * 0.8;
  });

  return (
    <group>
      {/* Post */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.58, 6]} />
        <meshStandardMaterial color={colors.clockPost} {...MAT_PROPS} />
      </mesh>
      {/* Clock face */}
      <mesh position={[0, 0.68, 0.02]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.04, 16]} />
        <meshStandardMaterial color="#FFFFFF" {...MAT_PROPS} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, 0.68, 0.02]}>
        <torusGeometry args={[0.14, 0.015, 8, 24]} />
        <meshStandardMaterial color={colors.clockRim} {...MAT_PROPS} />
      </mesh>
      {/* Hour hand */}
      <group position={[0, 0.68, 0.05]} ref={hourRef}>
        <mesh position={[0, 0.035, 0]}>
          <boxGeometry args={[0.02, 0.07, 0.01]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
      {/* Minute hand */}
      <group position={[0, 0.68, 0.06]} ref={minuteRef}>
        <mesh position={[0, 0.045, 0]}>
          <boxGeometry args={[0.015, 0.09, 0.008]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
}

function Screen({ colors }) {
  const matRef = useRef();

  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      matRef.current.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.3;
    }
  });

  return (
    <group>
      {/* Post */}
      <mesh castShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.46, 6]} />
        <meshStandardMaterial color={colors.screenPost} {...MAT_PROPS} />
      </mesh>
      {/* Screen panel */}
      <mesh castShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[0.56, 0.32, 0.04]} />
        <meshStandardMaterial color="#1A1A2E" {...MAT_PROPS} />
      </mesh>
      {/* Screen face (emissive) */}
      <mesh position={[0, 0.62, 0.025]}>
        <planeGeometry args={[0.5, 0.26]} />
        <meshStandardMaterial
          ref={matRef}
          color={colors.screenGlow}
          emissive={colors.screenGlow}
          emissiveIntensity={0.8}
        />
      </mesh>
    </group>
  );
}

const PIECE_COMPONENTS = {
  bench: Bench,
  shelter: Shelter,
  elevator: Elevator,
  flowerpot: Flowerpot,
  lamp: Lamp,
  clock: Clock,
  screen: Screen,
};

export default function PieceModel({ pieceType, colors, scale = 1 }) {
  const Component = PIECE_COMPONENTS[pieceType];
  if (!Component) return null;

  return (
    <group scale={[scale, scale, scale]}>
      <Component colors={colors} />
    </group>
  );
}
