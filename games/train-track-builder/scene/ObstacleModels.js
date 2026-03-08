import { useMemo } from 'react';

function Tree({ colors, seed = 0 }) {
  const slight = ((seed * 37) % 100) / 100;
  const rotY = slight * Math.PI * 2;
  const scale = 0.85 + slight * 0.3;

  return (
    <group rotation={[0, rotY, 0]} scale={[scale, scale, scale]}>
      {/* Trunk */}
      <mesh castShadow position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.4, 6]} />
        <meshStandardMaterial color={colors.treeTrunk} roughness={0.8} />
      </mesh>
      {/* Lower canopy */}
      <mesh castShadow position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.22, 8, 6]} />
        <meshStandardMaterial color={colors.treeCanopy} roughness={0.85} />
      </mesh>
      {/* Upper canopy */}
      <mesh castShadow position={[0.05, 0.62, 0.03]}>
        <sphereGeometry args={[0.14, 8, 6]} />
        <meshStandardMaterial color={colors.treeCanopyLight} roughness={0.85} />
      </mesh>
    </group>
  );
}

function Rock({ colors, seed = 0 }) {
  const pr = ((seed * 43) % 100) / 100;
  const rotY = pr * Math.PI * 2;

  return (
    <group rotation={[0, rotY, 0]}>
      {/* Main rock */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.18, 6, 5]} />
        <meshStandardMaterial color={colors.rock} roughness={0.9} />
      </mesh>
      {/* Smaller rock */}
      <mesh castShadow position={[0.14, 0.08, 0.08]}>
        <sphereGeometry args={[0.1, 5, 4]} />
        <meshStandardMaterial color={colors.rockLight} roughness={0.9} />
      </mesh>
      {/* Tiny rock */}
      <mesh castShadow position={[-0.1, 0.06, -0.06]}>
        <sphereGeometry args={[0.07, 5, 4]} />
        <meshStandardMaterial color={colors.rock} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Pond({ colors }) {
  return (
    <group>
      {/* Water surface */}
      <mesh receiveShadow position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.32, 16]} />
        <meshStandardMaterial
          color={colors.pond}
          transparent
          opacity={0.7}
          emissive={colors.pond}
          emissiveIntensity={0.15}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      {/* Edge / bank */}
      <mesh receiveShadow position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.36, 16]} />
        <meshStandardMaterial color={colors.tileGrass} roughness={0.85} />
      </mesh>
      {/* Ripple */}
      <mesh position={[0.05, 0.025, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.06, 0.08, 12]} />
        <meshStandardMaterial
          color={colors.pondRipple}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function House({ colors, seed = 0 }) {
  const pr = ((seed * 47) % 100) / 100;
  const rotY = Math.floor(pr * 4) * (Math.PI / 2);

  return (
    <group rotation={[0, rotY, 0]}>
      {/* Walls */}
      <mesh castShadow position={[0, 0.22, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.35]} />
        <meshStandardMaterial color={colors.houseBrick} roughness={0.8} />
      </mesh>
      {/* Roof - triangular prism approximated as box */}
      <mesh castShadow position={[0, 0.48, 0]}>
        <boxGeometry args={[0.46, 0.12, 0.38]} />
        <meshStandardMaterial color={colors.houseRoof} roughness={0.7} />
      </mesh>
      {/* Roof peak */}
      <mesh castShadow position={[0, 0.56, 0]}>
        <boxGeometry args={[0.32, 0.06, 0.26]} />
        <meshStandardMaterial color={colors.houseRoof} roughness={0.7} />
      </mesh>
      {/* Window */}
      <mesh position={[0, 0.26, 0.176]}>
        <planeGeometry args={[0.1, 0.1]} />
        <meshStandardMaterial
          color={colors.houseWindow}
          emissive={colors.houseWindow}
          emissiveIntensity={0.3}
        />
      </mesh>
      {/* Door */}
      <mesh position={[-0.1, 0.12, 0.176]}>
        <planeGeometry args={[0.08, 0.2]} />
        <meshStandardMaterial color={colors.houseRoof} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Signal({ colors }) {
  return (
    <group>
      {/* Pole */}
      <mesh castShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.6, 6]} />
        <meshStandardMaterial color={colors.signalPole} roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Signal head */}
      <mesh castShadow position={[0, 0.56, 0]}>
        <boxGeometry args={[0.1, 0.18, 0.06]} />
        <meshStandardMaterial color="#222222" roughness={0.6} />
      </mesh>
      {/* Red light */}
      <mesh position={[0, 0.62, 0.031]}>
        <circleGeometry args={[0.025, 8]} />
        <meshStandardMaterial
          color={colors.signalRed}
          emissive={colors.signalRed}
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Amber light */}
      <mesh position={[0, 0.56, 0.031]}>
        <circleGeometry args={[0.025, 8]} />
        <meshStandardMaterial
          color={colors.signalAmber}
          emissive={colors.signalAmber}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* Green light */}
      <mesh position={[0, 0.5, 0.031]}>
        <circleGeometry args={[0.025, 8]} />
        <meshStandardMaterial
          color={colors.signalGreen}
          emissive={colors.signalGreen}
          emissiveIntensity={0.4}
        />
      </mesh>
    </group>
  );
}

const OBSTACLE_COMPONENTS = {
  tree: Tree,
  rock: Rock,
  pond: Pond,
  house: House,
  signal: Signal,
};

export default function ObstacleModel({ type, colors, seed = 0 }) {
  const Component = OBSTACLE_COMPONENTS[type];
  if (!Component) return null;

  return <Component colors={colors} seed={seed} />;
}
