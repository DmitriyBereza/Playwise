import { useMemo } from 'react';
import { CELL_SIZE } from './animations';

function Building({ x, z, width, height, depth, color, windowColor }) {
  const windowPositions = useMemo(() => {
    const wins = [];
    const wCols = Math.floor(width / 0.4);
    const wRows = Math.floor(height / 0.5);
    for (let wr = 0; wr < wRows; wr++) {
      for (let wc = 0; wc < wCols; wc++) {
        wins.push({
          x: (wc - (wCols - 1) / 2) * 0.35,
          y: (wr - (wRows - 1) / 2) * 0.4,
        });
      }
    }
    return wins;
  }, [width, height]);

  return (
    <group position={[x, height / 2, z]}>
      <mesh castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      {windowPositions.map((w, i) => (
        <mesh key={i} position={[w.x, w.y, depth / 2 + 0.01]}>
          <planeGeometry args={[0.15, 0.18]} />
          <meshStandardMaterial
            color={windowColor}
            emissive={windowColor}
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function Environment({ colors, cols, rows }) {
  const gridW = cols * CELL_SIZE;
  const gridD = rows * CELL_SIZE;
  const centerX = gridW * 0.5;
  const centerZ = gridD * 0.5;

  const buildings = useMemo(() => {
    const b = [];
    const seed = cols * 7 + rows * 13;
    for (let i = 0; i < 14; i++) {
      const pseudoRand = ((seed + i * 31) % 100) / 100;
      const pseudoRand2 = ((seed + i * 47 + 11) % 100) / 100;
      const pseudoRand3 = ((seed + i * 67 + 23) % 100) / 100;
      b.push({
        width: 0.6 + pseudoRand * 1.4,
        height: 1.2 + pseudoRand2 * 3.8,
        depth: 0.5 + pseudoRand3 * 0.8,
        x: centerX + (i - 7) * 2.0 + pseudoRand * 0.8,
        z: centerZ - gridD / 2 - 3 - pseudoRand2 * 4,
        hue: 210 + pseudoRand3 * 30,
        sat: 15 + pseudoRand * 15,
        light: 72 + pseudoRand2 * 12,
      });
    }
    return b;
  }, [cols, rows, centerX, centerZ, gridD]);

  const sleepers = useMemo(() => {
    const s = [];
    const trackLen = gridW + 12;
    const count = Math.ceil(trackLen / 0.55);
    for (let i = 0; i < count; i++) {
      s.push(centerX - trackLen / 2 + i * 0.55);
    }
    return s;
  }, [gridW, centerX]);

  const trackZ = centerZ - gridD / 2 - 1.2;

  return (
    <group>
      {/* Ground plane */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.08, centerZ]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color={colors.ground} roughness={0.9} />
      </mesh>

      {/* Platform */}
      <mesh receiveShadow castShadow position={[centerX, -0.01, centerZ]}>
        <boxGeometry args={[gridW + 1.5, 0.15, gridD + 1.5]} />
        <meshStandardMaterial color={colors.platform} roughness={0.7} />
      </mesh>

      {/* Platform edge */}
      <mesh position={[centerX, -0.02, centerZ - gridD / 2 - 0.7]}>
        <boxGeometry args={[gridW + 1.5, 0.18, 0.12]} />
        <meshStandardMaterial color={colors.platformEdge} roughness={0.6} />
      </mesh>

      {/* Safety line */}
      <mesh position={[centerX, 0.06, centerZ - gridD / 2 - 0.5]}>
        <boxGeometry args={[gridW + 1.2, 0.02, 0.1]} />
        <meshStandardMaterial color={colors.safetyLine} emissive={colors.safetyLine} emissiveIntensity={0.2} />
      </mesh>

      {/* Rails */}
      <mesh position={[centerX, 0.02, trackZ - 0.2]}>
        <boxGeometry args={[gridW + 12, 0.06, 0.06]} />
        <meshStandardMaterial color={colors.rail} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[centerX, 0.02, trackZ + 0.2]}>
        <boxGeometry args={[gridW + 12, 0.06, 0.06]} />
        <meshStandardMaterial color={colors.rail} metalness={0.4} roughness={0.3} />
      </mesh>

      {/* Sleepers */}
      {sleepers.map((sx, i) => (
        <mesh key={i} position={[sx, 0.005, trackZ]} receiveShadow>
          <boxGeometry args={[0.12, 0.04, 0.7]} />
          <meshStandardMaterial color={colors.sleeper} roughness={0.8} />
        </mesh>
      ))}

      {/* Background buildings */}
      {buildings.map((b, i) => (
        <Building
          key={i}
          x={b.x}
          z={b.z}
          width={b.width}
          height={b.height}
          depth={b.depth}
          color={`hsl(${b.hue}, ${b.sat}%, ${b.light}%)`}
          windowColor="#FFE4A0"
        />
      ))}
    </group>
  );
}
