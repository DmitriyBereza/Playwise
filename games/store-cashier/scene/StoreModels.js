import { PRODUCT_CATALOG } from '../orderLogic';

const ITEM_POSITIONS = [
  [-1.6, 1.15, -0.8],
  [-0.55, 1.15, -0.8],
  [0.55, 1.15, -0.8],
  [1.6, 1.15, -0.8],
];

const colorById = Object.fromEntries(PRODUCT_CATALOG.map((item) => [item.id, item.color]));

export default function StoreModels({ orderItems = [] }) {
  const highlightIds = new Set(orderItems.map((item) => item.id));

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 8]} />
        <meshStandardMaterial color="#F5EDE0" />
      </mesh>

      <mesh position={[0, 1.6, -2.2]} receiveShadow>
        <boxGeometry args={[8, 3.2, 0.3]} />
        <meshStandardMaterial color="#FFF8F0" />
      </mesh>

      <mesh position={[0, 0.55, -1.4]} castShadow receiveShadow>
        <boxGeometry args={[5.5, 1.1, 1.2]} />
        <meshStandardMaterial color="#E8C9A8" />
      </mesh>

      <mesh position={[0, 1.05, -1.85]} castShadow>
        <boxGeometry args={[5.8, 0.12, 0.5]} />
        <meshStandardMaterial color="#D4B896" />
      </mesh>

      {ITEM_POSITIONS.map((pos, index) => {
        const item = orderItems[index];
        const color = item ? colorById[item.id] || '#C4B5FD' : '#E8E0F0';
        const scale = item && highlightIds.has(item.id) ? 1.15 : 0.85;
        const emissive = item && highlightIds.has(item.id) ? color : '#000000';
        const emissiveIntensity = item && highlightIds.has(item.id) ? 0.25 : 0;

        return (
          <mesh
            key={`shelf-item-${index}`}
            position={pos}
            scale={[scale, scale, scale]}
            castShadow
          >
            <boxGeometry args={[0.55, 0.55, 0.55]} />
            <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
          </mesh>
        );
      })}

      <mesh position={[-3.2, 2.4, -2.05]}>
        <boxGeometry args={[0.8, 0.5, 0.08]} />
        <meshStandardMaterial color="#FFD93D" emissive="#FFD93D" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}
