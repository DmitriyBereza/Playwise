import { memo, useRef, useCallback, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CELL_SIZE, PIECE_PLACE_DURATION, PIECE_PLACE_START_Y, PIECE_PLACE_END_Y, lerp, easeOutBounce } from './animations';
import RailModel from './RailModels';
import ObstacleModel from './ObstacleModels';

function PlacedRail({ pieceType, rotation, colors }) {
  const groupRef = useRef();
  const animRef = useRef({ startTime: -1, active: true });

  useFrame((state) => {
    if (!animRef.current.active || !groupRef.current) return;
    if (animRef.current.startTime < 0) {
      animRef.current.startTime = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - animRef.current.startTime;
    const t = Math.min(elapsed / PIECE_PLACE_DURATION, 1);
    const eased = easeOutBounce(t);

    groupRef.current.position.y = lerp(PIECE_PLACE_START_Y, PIECE_PLACE_END_Y, eased);
    const s = lerp(0.3, 1, eased);
    groupRef.current.scale.set(s, s, s);

    if (t >= 1) animRef.current.active = false;
  });

  return (
    <group ref={groupRef} position={[0, PIECE_PLACE_START_Y, 0]} scale={[0.3, 0.3, 0.3]}>
      <RailModel pieceType={pieceType} rotation={rotation} colors={colors} />
    </group>
  );
}

function HighlightPlane() {
  const matRef = useRef();

  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      matRef.current.opacity = 0.2 + Math.sin(t * 3) * 0.15;
    }
  });

  return (
    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.95, 0.95]} />
      <meshStandardMaterial
        ref={matRef}
        color="#4AAF5A"
        emissive="#4AAF5A"
        emissiveIntensity={0.4}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
}

function PathGlowPlane({ delay, colors }) {
  const matRef = useRef();
  const animRef = useRef({ startTime: -1 });

  useFrame((state) => {
    if (!matRef.current) return;
    if (animRef.current.startTime < 0) {
      animRef.current.startTime = state.clock.elapsedTime;
    }
    const elapsed = state.clock.elapsedTime - animRef.current.startTime;
    const adjustedTime = elapsed - delay;
    if (adjustedTime < 0) {
      matRef.current.opacity = 0;
      return;
    }
    const fadeIn = Math.min(adjustedTime / 0.3, 1);
    matRef.current.opacity = fadeIn * (0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
  });

  return (
    <mesh position={[0, 0.078, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.98, 0.98]} />
      <meshStandardMaterial
        ref={matRef}
        color={colors.pathGlow}
        emissive={colors.pathGlow}
        emissiveIntensity={0.5}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}

const GridCell = memo(function GridCell({
  r, c, cell, isHighlighted, pathIndex, colors, onCellClick,
}) {
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    onCellClick(r, c);
  }, [r, c, onCellClick]);

  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback(() => {
    setHovered(false);
    document.body.style.cursor = 'auto';
  }, []);

  const isStation = cell.type === 'stationA' || cell.type === 'stationB';
  const hasObstacle = !!cell.obstacle;
  const hasPiece = !!cell.piece;
  const canPlace = !isStation && !hasObstacle && !hasPiece && cell.type === 'empty';
  const canInteract = cell.type === 'empty' && !hasObstacle;

  let tileColor = colors.tileOpen;
  if (isStation) tileColor = colors.tileStation;
  else if (hasObstacle) tileColor = colors.tileGrass;
  else if (hasPiece) tileColor = colors.tilePlaced;

  const tileScale = hovered && canInteract ? 1.03 : 1;

  return (
    <group position={[c * CELL_SIZE, 0, r * CELL_SIZE]}>
      {/* Base tile */}
      <mesh
        receiveShadow
        onClick={canInteract ? handleClick : undefined}
        onPointerOver={canInteract ? handlePointerOver : undefined}
        onPointerOut={canInteract ? handlePointerOut : undefined}
        scale={[tileScale, 1, tileScale]}
      >
        <boxGeometry args={[1.0, 0.15, 1.0]} />
        <meshStandardMaterial color={tileColor} roughness={0.75} metalness={0.05} />
      </mesh>

      {/* Tile border */}
      <lineSegments position={[0, 0.001, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.0, 0.15, 1.0)]} />
        <lineBasicMaterial color={colors.tileBorder} transparent opacity={0.4} />
      </lineSegments>

      {/* Obstacle model */}
      {hasObstacle && (
        <group position={[0, 0.075, 0]}>
          <ObstacleModel type={cell.obstacle} colors={colors} seed={r * 10 + c} />
        </group>
      )}

      {/* Placed rail piece */}
      {hasPiece && (
        <PlacedRail pieceType={cell.piece} rotation={cell.rotation} colors={colors} />
      )}

      {/* Highlight for available cells */}
      {isHighlighted && canPlace && <HighlightPlane />}

      {/* Connected path glow */}
      {pathIndex !== undefined && (
        <PathGlowPlane delay={pathIndex * 0.08} colors={colors} />
      )}
    </group>
  );
}, (prev, next) => {
  return prev.cell.type === next.cell.type
    && prev.cell.piece === next.cell.piece
    && prev.cell.rotation === next.cell.rotation
    && prev.cell.obstacle === next.cell.obstacle
    && prev.isHighlighted === next.isHighlighted
    && prev.pathIndex === next.pathIndex;
});

export default function GridBoard({
  grid, cols, rows, selectedPieceId, validPathResult,
  phase, colors, onCellClick,
}) {
  const hasSelection = !!selectedPieceId && phase === 'building';

  // Build path index map for glow effect
  const pathIndexMap = {};
  if (validPathResult?.valid && validPathResult.path) {
    validPathResult.path.forEach((cell, i) => {
      pathIndexMap[`${cell.row},${cell.col}`] = i;
    });
  }

  return (
    <group>
      {grid.map((row, r) =>
        row.map((cell, c) => (
          <GridCell
            key={`${r}-${c}`}
            r={r}
            c={c}
            cell={cell}
            isHighlighted={hasSelection}
            pathIndex={pathIndexMap[`${r},${c}`]}
            colors={colors}
            onCellClick={onCellClick}
          />
        ))
      )}
    </group>
  );
}
