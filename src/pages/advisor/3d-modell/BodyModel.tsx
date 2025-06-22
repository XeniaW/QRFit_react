import React, { useRef, useEffect } from 'react';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import ClickDetector from './ClickDetector';

const TARGET_SIZE = 4;

interface BodyModelProps {
  setModalData: React.Dispatch<
    React.SetStateAction<{ muscle: string; isOpen: boolean }>
  >;
}

const BodyModel: React.FC<BodyModelProps> = ({ setModalData }) => {
  const { scene } = useGLTF('/assets/model_female/female_2.gltf');
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    // — Center & scale —
    const box = new THREE.Box3().setFromObject(groupRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scaleFactor = TARGET_SIZE / Math.max(size.x, size.y, size.z);

    groupRef.current.scale.setScalar(scaleFactor);
    groupRef.current.position.set(
      -center.x * scaleFactor,
      -center.y * scaleFactor,
      -center.z * scaleFactor
    );

    // — Darken & tone-down reflections per material —
    groupRef.current.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material];

        mats.forEach(mat => {
          if (mat instanceof THREE.MeshStandardMaterial) {
            mat.roughness = 1.0; // make it fully matte
            mat.metalness = 0.0; // non-metal
            mat.color.multiplyScalar(0.95); // 70% brightness
            mat.envMapIntensity = 0.2; // really tame the HDRI
          }
        });
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      {/* Very soft ambient */}
      <ambientLight intensity={0.1} />

      {/* Subtle sky/ground fill */}
      <hemisphereLight
        skyColor="#ffffff"
        groundColor="#444444"
        intensity={0.1}
      />

      {/* One low-power directional */}
      <directionalLight position={[5, 10, 5]} intensity={0.1} />

      {/* HDRI studio (no `intensity` prop here) */}
      <Environment preset="studio" background={false} />

      {/* Model + click logic */}
      <primitive object={scene} />
      <ClickDetector model={scene} setModalData={setModalData} />
    </group>
  );
};

export default BodyModel;
