import React from 'react';
import { useGLTF } from '@react-three/drei';
import ClickDetector from './ClickDetector';

const BodyModel: React.FC<{
  setModalData: React.Dispatch<
    React.SetStateAction<{ muscle: string; isOpen: boolean }>
  >;
}> = ({ setModalData }) => {
  const { scene } = useGLTF('/assets/modell/scene.gltf');

  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[3, 5, 2]} intensity={1} />
      <spotLight position={[5, 10, 5]} angle={0.3} intensity={1} />
      <primitive
        object={scene}
        scale={[0.03, 0.03, 0.03]}
        position={[0, -3, 0]}
      />
      <ClickDetector model={scene} setModalData={setModalData} />
    </>
  );
};

export default BodyModel;
