import React, { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { MUSCLE_AREAS } from '../../../data/muscles';

const ClickDetector: React.FC<{
  model: THREE.Object3D;
  setModalData: React.Dispatch<
    React.SetStateAction<{ muscle: string; isOpen: boolean }>
  >;
}> = ({ model, setModalData }) => {
  const { camera, gl, scene } = useThree();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const [highlight, setHighlight] = useState<THREE.Mesh | null>(null);

  const handleClick = (event: MouseEvent) => {
    if (!model) return;

    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const meshes: THREE.Mesh[] = [];
    model.traverse(child => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
    });

    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const { point } = intersects[0];

      console.log(
        `Clicked 3D Coordinate: x=${point.x}, y=${point.y}, z=${point.z}`
      );

      const clickedMuscle = MUSCLE_AREAS.find(
        muscle =>
          point.x >= muscle.xMin &&
          point.x <= muscle.xMax &&
          point.y >= muscle.yMin &&
          point.y <= muscle.yMax &&
          point.z >= muscle.zMin &&
          point.z <= muscle.zMax
      );

      if (clickedMuscle) {
        setModalData({ muscle: clickedMuscle.name, isOpen: true });

        if (highlight) {
          scene.remove(highlight);
        }

        const highlightMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 0.2),
          new THREE.MeshBasicMaterial({
            color: 'red',
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
          })
        );

        highlightMesh.position.copy(point);
        highlightMesh.lookAt(camera.position);
        scene.add(highlightMesh);
        setHighlight(highlightMesh);
      } else {
        setModalData({ muscle: '', isOpen: false });
        if (highlight) scene.remove(highlight);
      }
    }
  };

  useEffect(() => {
    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [model, highlight]);

  return null;
};

export default ClickDetector;
