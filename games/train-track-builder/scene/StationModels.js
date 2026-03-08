import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { CELL_SIZE, TRAIN_STEP_DURATION, easeOutCubic, lerp } from './animations';

/* ── Station Buildings ─────────────────────────────────────── */

function StationBuilding({ position, colors, type }) {
  const isA = type === 'A';
  const bodyColor = isA ? colors.stationA : colors.stationB;
  const roofColor = isA ? colors.stationARoof : colors.stationBRoof;
  const label = isA ? 'A' : 'B';

  return (
    <group position={position}>
      {/* Platform base */}
      <mesh receiveShadow position={[0, 0.04, 0]}>
        <boxGeometry args={[1.0, 0.08, 1.0]} />
        <meshStandardMaterial color={colors.stationPlatform} roughness={0.7} />
      </mesh>
      {/* Building walls */}
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[0.6, 0.5, 0.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.6} metalness={0.1} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 0.62, 0]}>
        <boxGeometry args={[0.7, 0.08, 0.6]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>
      {/* Roof peak */}
      <mesh castShadow position={[0, 0.69, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.4]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>
      {/* Windows */}
      {[[-0.12, 0.36], [0.12, 0.36]].map(([x, y], i) => (
        <mesh key={i} position={[x, y, 0.251]}>
          <planeGeometry args={[0.1, 0.12]} />
          <meshStandardMaterial
            color={colors.stationWindow}
            emissive={colors.stationWindow}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
      {/* Door */}
      <mesh position={[0, 0.2, 0.251]}>
        <planeGeometry args={[0.12, 0.2]} />
        <meshStandardMaterial color={roofColor} roughness={0.7} />
      </mesh>
    </group>
  );
}

/* ── Locomotive & Wheels ───────────────────────────────────── */

function Wheel({ x, z }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current && ref.current.userData.speed) {
      ref.current.rotation.x += ref.current.userData.speed * delta;
    }
  });

  return (
    <mesh ref={ref} castShadow position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.08, 0.08, 0.04, 10]} />
      <meshStandardMaterial color="#333" metalness={0.3} roughness={0.5} />
    </mesh>
  );
}

function Locomotive({ colors }) {
  return (
    <group>
      {/* Body */}
      <mesh castShadow position={[0, 0.24, 0]}>
        <boxGeometry args={[0.8, 0.32, 0.44]} />
        <meshStandardMaterial color={colors.trainBody} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Roof */}
      <mesh castShadow position={[0, 0.43, 0]}>
        <boxGeometry args={[0.7, 0.05, 0.4]} />
        <meshStandardMaterial color={colors.trainRoof} roughness={0.5} />
      </mesh>
      {/* Chimney */}
      <mesh castShadow position={[0.28, 0.55, 0]}>
        <cylinderGeometry args={[0.04, 0.055, 0.18, 8]} />
        <meshStandardMaterial color={colors.trainChimney} roughness={0.6} />
      </mesh>
      {/* Front bumper */}
      <mesh castShadow position={[0.42, 0.16, 0]}>
        <boxGeometry args={[0.06, 0.2, 0.36]} />
        <meshStandardMaterial color={colors.trainBumper} roughness={0.5} />
      </mesh>
      {/* Windows */}
      {[[-0.06, 0.22], [-0.22, 0.22]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.34, z]}>
          <planeGeometry args={[0.1, 0.1]} />
          <meshStandardMaterial
            color={colors.trainWindow}
            emissive={colors.trainWindow}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
      {/* Wheels */}
      <Wheel x={-0.22} z={-0.24} />
      <Wheel x={-0.22} z={0.24} />
      <Wheel x={0.22} z={-0.24} />
      <Wheel x={0.22} z={0.24} />
    </group>
  );
}

/* ── Steam Puff ────────────────────────────────────────────── */

function SteamPuff({ position, startTime }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.elapsedTime - startTime;
    if (elapsed < 0) return;
    const t = Math.min(elapsed / 1.0, 1);
    meshRef.current.position.y = position[1] + 0.3 + t * 0.5;
    meshRef.current.scale.setScalar(0.5 + t * 1.0);
    meshRef.current.material.opacity = (1 - t) * 0.6;
    if (t >= 1) meshRef.current.visible = false;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.06, 6, 4]} />
      <meshStandardMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

/* ── Train Animation (follows validated path) ──────────────── */

function TrainAnimation({ validPathResult, phase, colors, onTrainArrived }) {
  const groupRef = useRef();
  const animRef = useRef({
    startTime: -1,
    step: 0,
    arrived: false,
    steamPuffs: [],
    steamId: 0,
  });

  const waypoints = useMemo(() => {
    if (!validPathResult?.valid || !validPathResult.path) return [];
    return validPathResult.path.map((cell, i, arr) => {
      const x = cell.col * CELL_SIZE;
      const z = cell.row * CELL_SIZE;
      // Calculate rotation angle (direction of travel)
      let rotY = 0;
      if (i < arr.length - 1) {
        const next = arr[i + 1];
        const dx = next.col - cell.col;
        const dz = next.row - cell.row;
        rotY = Math.atan2(-dx, -dz);
      } else if (i > 0) {
        const prev = arr[i - 1];
        const dx = cell.col - prev.col;
        const dz = cell.row - prev.row;
        rotY = Math.atan2(-dx, -dz);
      }
      return { x, y: 0.15, z, rotY };
    });
  }, [validPathResult]);

  useFrame((state) => {
    if (!groupRef.current || phase !== 'running' || waypoints.length < 2) return;

    const anim = animRef.current;

    if (anim.arrived) return;

    if (anim.startTime < 0) {
      anim.startTime = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - anim.startTime;
    const totalDuration = (waypoints.length - 1) * TRAIN_STEP_DURATION;
    const progress = Math.min(elapsed / totalDuration, 1);
    const floatStep = progress * (waypoints.length - 1);
    const stepIdx = Math.floor(floatStep);
    const stepFrac = floatStep - stepIdx;

    const currIdx = Math.min(stepIdx, waypoints.length - 1);
    const nextIdx = Math.min(stepIdx + 1, waypoints.length - 1);
    const curr = waypoints[currIdx];
    const next = waypoints[nextIdx];

    const easedFrac = easeOutCubic(stepFrac);
    groupRef.current.position.x = lerp(curr.x, next.x, easedFrac);
    groupRef.current.position.y = curr.y;
    groupRef.current.position.z = lerp(curr.z, next.z, easedFrac);

    // Smooth rotation
    let targetRotY = curr.rotY;
    if (currIdx !== nextIdx) {
      // Interpolate rotation, handling angle wrapping
      let diff = next.rotY - curr.rotY;
      if (diff > Math.PI) diff -= Math.PI * 2;
      if (diff < -Math.PI) diff += Math.PI * 2;
      targetRotY = curr.rotY + diff * easedFrac;
    }
    groupRef.current.rotation.y = targetRotY;

    // Wheel speed
    const speed = progress < 1 ? 8 : 0;
    groupRef.current.traverse((child) => {
      if (child.userData !== undefined) {
        child.userData.speed = speed;
      }
    });

    // Check arrival
    if (progress >= 1 && !anim.arrived) {
      anim.arrived = true;
      if (onTrainArrived) onTrainArrived();
    }
  });

  // Reset when phase changes away from running
  if (phase !== 'running' && animRef.current.startTime >= 0) {
    animRef.current = { startTime: -1, step: 0, arrived: false, steamPuffs: [], steamId: 0 };
  }

  if (phase !== 'running' || waypoints.length < 2) return null;

  return (
    <group ref={groupRef} position={[waypoints[0].x, waypoints[0].y, waypoints[0].z]}>
      <Locomotive colors={colors} />
    </group>
  );
}

/* ── Main export ───────────────────────────────────────────── */

export default function StationModels({
  stationA, stationB, validPathResult, phase, colors, cols, rows, onTrainArrived,
}) {
  return (
    <group>
      {stationA && (
        <StationBuilding
          position={[stationA.col * CELL_SIZE, 0.075, stationA.row * CELL_SIZE]}
          colors={colors}
          type="A"
        />
      )}
      {stationB && (
        <StationBuilding
          position={[stationB.col * CELL_SIZE, 0.075, stationB.row * CELL_SIZE]}
          colors={colors}
          type="B"
        />
      )}

      <TrainAnimation
        validPathResult={validPathResult}
        phase={phase}
        colors={colors}
        onTrainArrived={onTrainArrived}
      />
    </group>
  );
}
