import { useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import StoreModels from './StoreModels';
import CustomerAnimation from './CustomerAnimation';

function SceneContent({ phase, walkProgress, orderItems, customerIndex }) {
  const cameraRef = useRef();
  const camPos = useMemo(() => [5, 6, 5], []);
  const camTarget = useMemo(() => [0, 0.8, -0.5], []);

  const zoom = useMemo(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 600;
    return vw < 480 ? 52 : 62;
  }, []);

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
        far={100}
      />

      <ambientLight intensity={0.65} color="#fff8f0" />
      <directionalLight
        position={[4, 8, 3]}
        intensity={0.75}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />

      <StoreModels orderItems={orderItems} />
      <CustomerAnimation phase={phase} walkProgress={walkProgress} customerIndex={customerIndex} />
    </>
  );
}

export default function StoreScene({ phase, walkProgress, orderItems, customerIndex }) {
  return (
    <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
      <SceneContent
        phase={phase}
        walkProgress={walkProgress}
        orderItems={orderItems}
        customerIndex={customerIndex}
      />
    </Canvas>
  );
}
