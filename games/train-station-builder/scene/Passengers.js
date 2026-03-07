import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CELL_SIZE, PASSENGER_WALK_DURATION, PASSENGER_STAGGER, lerp, easeOutCubic } from './animations';

const BODY_COLORS = ['#5BC0EB', '#FFD93D', '#FF8FAB', '#A78BFA', '#4AAF5A', '#FF9E5E'];

function PassengerFigure({ index, bodyColor, skinColor, phase, seated, walkStartTime }) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    if (phase === 'arriving' && !seated && walkStartTime > 0) {
      // Walking animation
      const walkElapsed = t - walkStartTime;
      const walkT = Math.min(walkElapsed / PASSENGER_WALK_DURATION, 1);

      // Move forward (negative z)
      groupRef.current.position.z = lerp(0, -0.8, easeOutCubic(walkT));

      // Leg swing while walking
      if (walkT < 1) {
        const legAngle = Math.sin(t * 10) * 0.3;
        if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle;
        if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle;
      } else {
        // Seated pose
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0.5;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0.5;
        groupRef.current.scale.setScalar(0.85);
      }
    } else if (seated) {
      // Already seated
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.5;
      groupRef.current.scale.setScalar(0.85);
      groupRef.current.position.z = -0.8;
    } else {
      // Waiting idle animation
      groupRef.current.position.y = Math.sin(t * 2 + index * 1.1) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 1.5 + index * 0.7) * 0.08;
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh castShadow position={[0, 0.52, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={skinColor} roughness={0.7} />
      </mesh>
      {/* Body */}
      <mesh castShadow position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.22, 8]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      {/* Left leg */}
      <group ref={leftLegRef} position={[-0.03, 0.24, 0]}>
        <mesh castShadow position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
          <meshStandardMaterial color="#555" roughness={0.7} />
        </mesh>
      </group>
      {/* Right leg */}
      <group ref={rightLegRef} position={[0.03, 0.24, 0]}>
        <mesh castShadow position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.16, 6]} />
          <meshStandardMaterial color="#555" roughness={0.7} />
        </mesh>
      </group>
      {/* Left arm */}
      <mesh castShadow position={[-0.09, 0.38, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.13, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
      {/* Right arm */}
      <mesh castShadow position={[0.09, 0.38, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.13, 6]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} />
      </mesh>
    </group>
  );
}

export default function Passengers({
  colors, cols, rows, passengerCount, seatedCount, passengersSeated, phase,
}) {
  const gridD = rows * CELL_SIZE;
  const gridW = cols * CELL_SIZE;
  const centerX = gridW * 0.5;
  const baseZ = gridD + 0.8;

  const walkStartTimeRef = useRef(0);

  // Track when arriving phase starts
  useFrame((state) => {
    if (phase === 'arriving' && walkStartTimeRef.current === 0) {
      walkStartTimeRef.current = state.clock.elapsedTime;
    }
    if (phase !== 'arriving' && phase !== 'celebrating') {
      walkStartTimeRef.current = 0;
    }
  });

  const passengers = useMemo(() => {
    const p = [];
    for (let i = 0; i < passengerCount; i++) {
      p.push({
        id: i,
        bodyColor: BODY_COLORS[i % BODY_COLORS.length],
        xOffset: (i - (passengerCount - 1) / 2) * 0.4,
      });
    }
    return p;
  }, [passengerCount]);

  return (
    <group position={[centerX, 0, baseZ]}>
      {passengers.map((p) => {
        const isSeated = phase === 'celebrating' || (passengersSeated) || (p.id < seatedCount);
        const walkStart = walkStartTimeRef.current > 0
          ? walkStartTimeRef.current + p.id * PASSENGER_STAGGER
          : 0;

        return (
          <group key={p.id} position={[p.xOffset, 0, 0]}>
            <PassengerFigure
              index={p.id}
              bodyColor={p.bodyColor}
              skinColor={colors.passengerSkin}
              phase={phase}
              seated={isSeated}
              walkStartTime={walkStart}
            />
          </group>
        );
      })}
    </group>
  );
}
