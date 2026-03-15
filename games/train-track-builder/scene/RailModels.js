import { useMemo } from 'react';

/**
 * 3D Rail models for straight and curve track pieces.
 * Each piece is built from sleepers, steel rails, and a ballast bed.
 * Rotation is applied externally via the parent group.
 */

function StraightRail({ colors }) {
  // Straight rail runs along the X-axis (left-right at rotation=90, top-bottom at rotation=0)
  // Default orientation: connects top and bottom (Z-axis)
  const sleeperCount = 5;
  const sleeperPositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < sleeperCount; i++) {
      positions.push(-0.4 + i * (0.8 / (sleeperCount - 1)));
    }
    return positions;
  }, []);

  return (
    <group>
      {/* Ballast bed */}
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[0.7, 0.04, 0.95]} />
        <meshStandardMaterial color={colors.ballast} roughness={0.9} />
      </mesh>

      {/* Sleepers (perpendicular to rail direction) */}
      {sleeperPositions.map((z, i) => (
        <mesh key={i} receiveShadow position={[0, 0.035, z]}>
          <boxGeometry args={[0.65, 0.04, 0.1]} />
          <meshStandardMaterial color={colors.sleeper} roughness={0.8} />
        </mesh>
      ))}

      {/* Left rail */}
      <mesh castShadow position={[-0.18, 0.065, 0]}>
        <boxGeometry args={[0.05, 0.04, 1.0]} />
        <meshStandardMaterial color={colors.rail} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Left rail shine (top) */}
      <mesh position={[-0.18, 0.087, 0]}>
        <boxGeometry args={[0.035, 0.005, 1.0]} />
        <meshStandardMaterial color={colors.railShine} metalness={0.7} roughness={0.2} />
      </mesh>

      {/* Right rail */}
      <mesh castShadow position={[0.18, 0.065, 0]}>
        <boxGeometry args={[0.05, 0.04, 1.0]} />
        <meshStandardMaterial color={colors.rail} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Right rail shine (top) */}
      <mesh position={[0.18, 0.087, 0]}>
        <boxGeometry args={[0.035, 0.005, 1.0]} />
        <meshStandardMaterial color={colors.railShine} metalness={0.7} roughness={0.2} />
      </mesh>
    </group>
  );
}

function CurveRail({ colors }) {
  // Curve connects bottom (+Z, row+1) and right (+X, col+1) at rotation 0.
  // Arc center is at (+0.5, +0.5) — bottom-right corner of the cell.
  // The arc sweeps from the right edge to the bottom edge.
  const segments = 8;

  const railSegments = useMemo(() => {
    const segs = [];
    for (let i = 0; i < segments; i++) {
      const a1 = (i / segments) * (Math.PI / 2);
      const a2 = ((i + 1) / segments) * (Math.PI / 2);
      const midAngle = (a1 + a2) / 2;

      // Inner rail (radius ~0.32)
      const innerR = 0.32;
      segs.push({
        type: 'inner',
        x: 0.5 - Math.sin(midAngle) * innerR,
        z: 0.5 - Math.cos(midAngle) * innerR,
        rotY: midAngle,
        length: (Math.PI / 2) * innerR / segments + 0.02,
      });

      // Outer rail (radius ~0.68)
      const outerR = 0.68;
      segs.push({
        type: 'outer',
        x: 0.5 - Math.sin(midAngle) * outerR,
        z: 0.5 - Math.cos(midAngle) * outerR,
        rotY: midAngle,
        length: (Math.PI / 2) * outerR / segments + 0.02,
      });
    }
    return segs;
  }, []);

  const sleeperPieces = useMemo(() => {
    const pieces = [];
    const sleeperCount = 5;
    for (let i = 0; i < sleeperCount; i++) {
      const angle = ((i + 0.5) / sleeperCount) * (Math.PI / 2);
      const centerR = 0.5;
      pieces.push({
        x: 0.5 - Math.sin(angle) * centerR,
        z: 0.5 - Math.cos(angle) * centerR,
        rotY: angle,
      });
    }
    return pieces;
  }, []);

  return (
    <group>
      {/* Ballast bed - quarter circle approximated by a box */}
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[0.95, 0.04, 0.95]} />
        <meshStandardMaterial color={colors.ballast} roughness={0.9} transparent opacity={0.7} />
      </mesh>

      {/* Sleepers along the curve */}
      {sleeperPieces.map((s, i) => (
        <mesh key={`sleeper-${i}`} receiveShadow position={[s.x, 0.035, s.z]} rotation={[0, -s.rotY, 0]}>
          <boxGeometry args={[0.1, 0.04, 0.5]} />
          <meshStandardMaterial color={colors.sleeper} roughness={0.8} />
        </mesh>
      ))}

      {/* Rail segments along curve */}
      {railSegments.map((seg, i) => (
        <mesh key={`rail-${i}`} castShadow position={[seg.x, 0.065, seg.z]} rotation={[0, -seg.rotY, 0]}>
          <boxGeometry args={[0.05, 0.04, seg.length]} />
          <meshStandardMaterial
            color={colors.rail}
            metalness={0.6}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Main RailModel component.
 * pieceType: 'straight' | 'curve'
 * rotation: 0 | 90 | 180 | 270 (degrees)
 */
export default function RailModel({ pieceType, rotation, colors }) {
  // Convert rotation degrees to radians for Y-axis rotation
  const rotY = -(rotation * Math.PI) / 180;

  return (
    <group rotation={[0, rotY, 0]}>
      {pieceType === 'straight' ? (
        <StraightRail colors={colors} />
      ) : (
        <CurveRail colors={colors} />
      )}
    </group>
  );
}
