import { useMemo } from 'react';
import { CELL_SIZE } from './animations';

function Hill({ x, z, scaleX, scaleY, scaleZ, color }) {
  return (
    <mesh position={[x, scaleY * 0.5 - 0.08, z]} castShadow>
      <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      <meshStandardMaterial color={color} roughness={0.9} />
      <group scale={[scaleX, scaleY, scaleZ]} />
    </mesh>
  );
}

function BackgroundTree({ x, z, height, colors }) {
  return (
    <group position={[x, 0, z]}>
      {/* Trunk */}
      <mesh castShadow position={[0, height * 0.25, 0]}>
        <cylinderGeometry args={[0.06, 0.08, height * 0.5, 6]} />
        <meshStandardMaterial color={colors.bgTreeTrunk} roughness={0.8} />
      </mesh>
      {/* Canopy */}
      <mesh castShadow position={[0, height * 0.65, 0]}>
        <sphereGeometry args={[height * 0.3, 8, 6]} />
        <meshStandardMaterial color={colors.bgTreeCanopy} roughness={0.85} />
      </mesh>
    </group>
  );
}

export default function Environment({ colors, cols, rows }) {
  const gridW = cols * CELL_SIZE;
  const gridD = rows * CELL_SIZE;
  const centerX = gridW * 0.5;
  const centerZ = gridD * 0.5;

  // Generate background hills
  const hills = useMemo(() => {
    const h = [];
    const seed = cols * 7 + rows * 13;
    for (let i = 0; i < 5; i++) {
      const pr = ((seed + i * 37) % 100) / 100;
      const pr2 = ((seed + i * 53 + 7) % 100) / 100;
      h.push({
        x: centerX + (i - 2) * 4 + pr * 2,
        z: centerZ - gridD / 2 - 4 - pr2 * 5,
        scaleX: 2.5 + pr * 3,
        scaleY: 1.0 + pr2 * 2.0,
        scaleZ: 2.0 + pr * 2,
        color: i % 2 === 0 ? colors.hillColor : colors.hillColorLight,
      });
    }
    return h;
  }, [cols, rows, centerX, centerZ, gridD, colors.hillColor, colors.hillColorLight]);

  // Generate background trees
  const bgTrees = useMemo(() => {
    const t = [];
    const seed = cols * 11 + rows * 17;
    for (let i = 0; i < 12; i++) {
      const pr = ((seed + i * 41) % 100) / 100;
      const pr2 = ((seed + i * 59 + 13) % 100) / 100;
      t.push({
        x: centerX + (i - 6) * 2.5 + pr * 1.5,
        z: centerZ - gridD / 2 - 2 - pr2 * 8,
        height: 0.8 + pr * 1.4,
      });
    }
    return t;
  }, [cols, rows, centerX, centerZ, gridD]);

  return (
    <group>
      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.08, centerZ]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={colors.ground} roughness={0.9} />
      </mesh>

      {/* Platform under grid */}
      <mesh receiveShadow castShadow position={[centerX, -0.01, centerZ]}>
        <boxGeometry args={[gridW + 1.5, 0.15, gridD + 1.5]} />
        <meshStandardMaterial color={colors.platform} roughness={0.7} />
      </mesh>

      {/* Platform edge */}
      <mesh position={[centerX, -0.02, centerZ - gridD / 2 - 0.7]}>
        <boxGeometry args={[gridW + 1.5, 0.18, 0.12]} />
        <meshStandardMaterial color={colors.platformEdge} roughness={0.6} />
      </mesh>

      {/* Background hills */}
      {hills.map((h, i) => (
        <mesh key={`hill-${i}`} position={[h.x, h.scaleY * 0.5 - 0.08, h.z]} scale={[h.scaleX, h.scaleY, h.scaleZ]}>
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={h.color} roughness={0.9} />
        </mesh>
      ))}

      {/* Background trees */}
      {bgTrees.map((t, i) => (
        <BackgroundTree key={`bgtree-${i}`} x={t.x} z={t.z} height={t.height} colors={colors} />
      ))}
    </group>
  );
}
