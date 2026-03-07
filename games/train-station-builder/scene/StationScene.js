import { useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import { getSkinColors } from './skinThemes';
import { CELL_SIZE } from './animations';
import GridBoard from './GridBoard';
import Environment from './Environment';
import Passengers from './Passengers';
import Train from './Train';

function SceneContent({
  grid, cols, rows, selectedPieceId, selectedPieceType,
  screenBlocked, phase, skin, onCellClick,
  passengerCount, seatedCount, passengersSeated, trainArrived,
}) {
  const cameraRef = useRef();
  const colors = useMemo(() => getSkinColors(skin), [skin]);

  const gridW = cols * CELL_SIZE;
  const gridD = rows * CELL_SIZE;
  const centerX = gridW * 0.5;
  const centerZ = gridD * 0.5;

  const camPos = useMemo(() => [centerX + 8, 8, centerZ + 8], [centerX, centerZ]);
  const camTarget = useMemo(() => [centerX, 0, centerZ], [centerX, centerZ]);

  const zoom = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 600;
    const base = Math.min(vw, 620) / (cols * 1.8);
    return vw < 480 ? base * 0.8 : base;
  }, [cols]);

  // Point camera at the grid center
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.lookAt(camTarget[0], camTarget[1], camTarget[2]);
      cameraRef.current.updateProjectionMatrix();
    }
  }, [camPos, camTarget]);

  return (
    <>
      <OrthographicCamera
        ref={cameraRef}
        makeDefault
        position={camPos}
        zoom={zoom}
        near={0.1}
        far={200}
      />

      <ambientLight intensity={0.6} color="#fff8f0" />
      <directionalLight
        position={[centerX + 6, 12, centerZ - 2]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.1}
        shadow-camera-far={50}
      />
      <hemisphereLight
        args={[colors.skyTint, colors.groundTint, 0.3]}
      />

      <fog attach="fog" args={[colors.fog, 25, 50]} />

      <Environment colors={colors} cols={cols} rows={rows} />

      <GridBoard
        grid={grid}
        cols={cols}
        rows={rows}
        selectedPieceId={selectedPieceId}
        selectedPieceType={selectedPieceType}
        screenBlocked={screenBlocked}
        phase={phase}
        colors={colors}
        onCellClick={onCellClick}
      />

      <Passengers
        colors={colors}
        cols={cols}
        rows={rows}
        passengerCount={passengerCount}
        seatedCount={seatedCount}
        passengersSeated={passengersSeated}
        phase={phase}
      />

      {(phase === 'arriving' || phase === 'celebrating') && (
        <Train
          colors={colors}
          cols={cols}
          rows={rows}
          trainArrived={trainArrived}
        />
      )}
    </>
  );
}

export default function StationScene(props) {
  // Force R3F to detect container size after conditional mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      window.dispatchEvent(new Event('resize'));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent {...props} />
    </Canvas>
  );
}
