import { memo, useRef, useMemo, useCallback, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CELL_SIZE, PIECE_PLACE_DURATION, PIECE_PLACE_START_Y, PIECE_PLACE_END_Y, lerp, easeOutBounce } from './animations';
import PieceModel from './PieceModels';
import { PIECE_DEFS } from '../pieces';

function PlacedPiece({ pieceType, colors }) {
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
      <PieceModel pieceType={pieceType} colors={colors} />
    </group>
  );
}

function HighlightPlane({ isWarn }) {
  const matRef = useRef();

  useFrame((state) => {
    if (matRef.current) {
      const t = state.clock.elapsedTime;
      matRef.current.opacity = 0.2 + Math.sin(t * 3) * 0.15;
    }
  });

  const color = isWarn ? '#ff9800' : '#4AAF5A';

  return (
    <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.95, 0.95]} />
      <meshStandardMaterial
        ref={matRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.4}
        transparent
        opacity={0.3}
        depthWrite={false}
      />
    </mesh>
  );
}

function Pillar({ colors }) {
  return (
    <mesh castShadow position={[0, 0.4, 0]}>
      <cylinderGeometry args={[0.12, 0.15, 0.8, 8]} />
      <meshStandardMaterial color={colors.pillar} roughness={0.6} metalness={0.1} />
    </mesh>
  );
}

const GridCell = memo(function GridCell({
  r, c, cell, isHighlighted, isScreenBlocked, colors, onCellClick,
}) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

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

  let tileColor = colors.tileOpen;
  if (cell.type === 'blocked') tileColor = colors.tileBlocked;
  else if (cell.type === 'decoration') tileColor = colors.tileDeco;
  else if (cell.piece) tileColor = colors.tilePlaced;

  const canInteract = cell.type === 'open';
  const tileScale = hovered && canInteract ? 1.03 : 1;

  return (
    <group position={[c * CELL_SIZE, 0, r * CELL_SIZE]}>
      {/* Base tile */}
      <mesh
        ref={meshRef}
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

      {/* Pillar on blocked cells */}
      {cell.type === 'blocked' && <Pillar colors={colors} />}

      {/* Pre-placed decoration */}
      {cell.type === 'decoration' && cell.preDecoType && (
        <group position={[0, PIECE_PLACE_END_Y, 0]}>
          <PieceModel pieceType={cell.preDecoType} colors={colors} scale={0.65} />
        </group>
      )}

      {/* Placed piece */}
      {cell.piece && cell.type === 'open' && (
        <PlacedPiece pieceType={cell.piece} colors={colors} />
      )}

      {/* Highlight for available cells */}
      {isHighlighted && !cell.piece && cell.type === 'open' && (
        <HighlightPlane isWarn={isScreenBlocked} />
      )}
    </group>
  );
}, (prev, next) => {
  return prev.cell.type === next.cell.type
    && prev.cell.piece === next.cell.piece
    && prev.cell.preDecoType === next.cell.preDecoType
    && prev.isHighlighted === next.isHighlighted
    && prev.isScreenBlocked === next.isScreenBlocked;
});

export default function GridBoard({
  grid, cols, rows, selectedPieceId, selectedPieceType,
  screenBlocked, phase, colors, onCellClick,
}) {
  const hasSelection = !!selectedPieceId && phase === 'building';

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
            isScreenBlocked={hasSelection && screenBlocked}
            colors={colors}
            onCellClick={onCellClick}
          />
        ))
      )}
    </group>
  );
}
