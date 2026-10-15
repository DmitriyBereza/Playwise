import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { PARALLAX, PATH_Z } from './animations';

function positions(spacing, period) {
  const count = Math.ceil(period / spacing) + 2;
  return Array.from({ length: count }, (_, i) => -spacing + i * spacing);
}

function ScrollLayer({ scrollRef, factor, position = [0, 0, 0], children }) {
  const ref = useRef();

  useFrame(() => {
    if (ref.current) {
      ref.current.position.x = -((scrollRef.current * factor) % position.period);
    }
  });

  return (
    <group ref={ref} position={[0, position.y || 0, position.z || 0]}>
      {children}
    </group>
  );
}

function Tree({ colors, x, scale, pine, z }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.9, 8]} />
        <meshStandardMaterial color={colors.trunk} roughness={0.9} />
      </mesh>
      {pine ? (
        <>
          <mesh position={[0, 1.05, 0]} castShadow>
            <coneGeometry args={[0.62, 1.1, 10]} />
            <meshStandardMaterial color={colors.foliage} roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.62, 0]} castShadow>
            <coneGeometry args={[0.46, 0.9, 10]} />
            <meshStandardMaterial color={colors.foliageAlt} roughness={0.85} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.15, 0]} castShadow>
            <sphereGeometry args={[0.6, 12, 12]} />
            <meshStandardMaterial color={colors.foliage} roughness={0.85} />
          </mesh>
          <mesh position={[0.34, 1.45, 0]} castShadow>
            <sphereGeometry args={[0.42, 12, 12]} />
            <meshStandardMaterial color={colors.foliageAlt} roughness={0.85} />
          </mesh>
        </>
      )}
    </group>
  );
}

function Bush({ colors, x, scale, z }) {
  return (
    <group position={[x, 0, z]} scale={scale}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <sphereGeometry args={[0.34, 10, 10]} />
        <meshStandardMaterial color={colors.bush} roughness={0.9} />
      </mesh>
      <mesh position={[0.26, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.24, 10, 10]} />
        <meshStandardMaterial color={colors.foliage} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Flower({ colors, x, z }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.14, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.28, 6]} />
        <meshStandardMaterial color={colors.grassDark} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={colors.flower} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Tuft({ colors, x, z }) {
  return (
    <mesh position={[x, 0.07, z]} rotation={[0, 0, 0]}>
      <coneGeometry args={[0.09, 0.2, 5]} />
      <meshStandardMaterial color={colors.grassDark} roughness={1} />
    </mesh>
  );
}

function Cloud({ x, y, z, scale }) {
  return (
    <group position={[x, y, z]} scale={scale}>
      <mesh>
        <sphereGeometry args={[0.7, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
      <mesh position={[0.6, -0.08, 0]}>
        <sphereGeometry args={[0.5, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
      <mesh position={[-0.6, -0.1, 0]}>
        <sphereGeometry args={[0.45, 10, 10]} />
        <meshStandardMaterial color="#ffffff" roughness={1} />
      </mesh>
    </group>
  );
}

export default function Environment({ colors, scrollRef }) {
  const far = useMemo(() => positions(6, 24), []);
  const mid = useMemo(() => positions(5, 20), []);
  const near = useMemo(() => positions(4, 20), []);
  const tufts = useMemo(() => positions(3, 21), []);
  const clouds = useMemo(() => positions(7, 35), []);

  return (
    <group>
      {/* Ground */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[80, 24]} />
        <meshStandardMaterial color={colors.grass} roughness={1} />
      </mesh>

      {/* Running path */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, PATH_Z]}>
        <planeGeometry args={[80, 2.4]} />
        <meshStandardMaterial color={colors.ground} roughness={1} />
      </mesh>

      {/* Clouds (far) */}
      <ScrollLayer scrollRef={scrollRef} factor={PARALLAX.clouds} position={{ y: 6.5, z: -18, period: 35 }}>
        {clouds.map((x, i) => (
          <Cloud key={`cloud-${i}`} x={x} y={0} z={0} scale={1 + (i % 3) * 0.25} />
        ))}
      </ScrollLayer>

      {/* Far treeline */}
      <ScrollLayer scrollRef={scrollRef} factor={PARALLAX.far} position={{ z: -14, period: 24 }}>
        {far.map((x, i) => (
          <Tree key={`far-${i}`} colors={colors} x={x} z={0} scale={1.1 + (i % 2) * 0.2} pine={i % 2 === 0} />
        ))}
      </ScrollLayer>

      {/* Mid trees */}
      <ScrollLayer scrollRef={scrollRef} factor={PARALLAX.mid} position={{ z: -7, period: 20 }}>
        {mid.map((x, i) => (
          <Tree key={`mid-${i}`} colors={colors} x={x} z={0} scale={1.4 + (i % 2) * 0.25} pine={i % 2 === 1} />
        ))}
      </ScrollLayer>

      {/* Near bushes and flowers */}
      <ScrollLayer scrollRef={scrollRef} factor={PARALLAX.near} position={{ z: -2.5, period: 20 }}>
        {near.map((x, i) => (
          <Bush key={`bush-${i}`} colors={colors} x={x} z={0} scale={1.1 + (i % 2) * 0.2} />
        ))}
        {near.map((x, i) => (
          <Flower key={`flower-${i}`} colors={colors} x={x + 1.4} z={0.6} />
        ))}
      </ScrollLayer>

      {/* Ground tufts along the path */}
      <ScrollLayer scrollRef={scrollRef} factor={PARALLAX.ground} position={{ z: 0, period: 21 }}>
        {tufts.map((x, i) => (
          <Tuft key={`tuft-a-${i}`} colors={colors} x={x} z={PATH_Z + 1.35} />
        ))}
        {tufts.map((x, i) => (
          <Tuft key={`tuft-b-${i}`} colors={colors} x={x + 1.5} z={PATH_Z - 1.35} />
        ))}
      </ScrollLayer>
    </group>
  );
}
