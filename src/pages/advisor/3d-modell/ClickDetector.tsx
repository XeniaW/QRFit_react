import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface ClickDetectorProps {
  model: THREE.Object3D;
  setModalData: React.Dispatch<
    React.SetStateAction<{ muscle: string; isOpen: boolean }>
  >;
}

const ClickDetector: React.FC<ClickDetectorProps> = ({
  model,
  setModalData,
}) => {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // track last highlighted mesh so we can restore it
  const prev = useRef<{
    mesh: THREE.Mesh;
    originalColors: THREE.Color[];
  } | null>(null);

  const clearHighlight = () => {
    if (!prev.current) return;
    const { mesh, originalColors } = prev.current;
    originalColors.forEach((col, i) => {
      const m = Array.isArray(mesh.material) ? mesh.material[i] : mesh.material;
      (m as THREE.MeshStandardMaterial).color.copy(col);
    });
    prev.current = null;
  };

  const handleClick = (e: MouseEvent) => {
    if (!model) return;
    const rect = gl.domElement.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    const meshes: THREE.Mesh[] = [];
    model.traverse(c => {
      if ((c as THREE.Mesh).isMesh) meshes.push(c as THREE.Mesh);
    });

    const hits = raycaster.current.intersectObjects(meshes, true);
    if (!hits.length) {
      clearHighlight();
      setModalData({ muscle: '', isOpen: false });
      return;
    }

    const clicked = hits[0].object as THREE.Mesh;
    // Determine the "muscle" name by walking up to the first named parent
    const nodeName =
      clicked.parent && clicked.parent.type === 'Group' && clicked.parent.name
        ? clicked.parent.name
        : clicked.name;

    // **FILTER**: ignore anything whose name starts with "Cube" or is "RootNode"
    if (/^(Cube|RootNode)/.test(nodeName)) {
      // clicked on non-muscle → clear any old highlight but do nothing else
      clearHighlight();
      setModalData({ muscle: '', isOpen: false });
      return;
    }

    // at this point it's a valid muscle part
    // 1) clear old
    clearHighlight();

    // 2) clone & tint the clicked mesh
    let originalColors: THREE.Color[];
    if (Array.isArray(clicked.material)) {
      clicked.material = clicked.material.map(
        m => m.clone() as THREE.MeshStandardMaterial
      );
      originalColors = (clicked.material as THREE.MeshStandardMaterial[]).map(
        m => m.color.clone()
      );
      clicked.material.forEach(m =>
        (m as THREE.MeshStandardMaterial).color.set('#800080')
      );
    } else {
      const mat = (clicked.material as THREE.MeshStandardMaterial).clone();
      originalColors = [mat.color.clone()];
      mat.color.set('#800080');
      clicked.material = mat;
    }

    // 3) remember & fire modal
    prev.current = { mesh: clicked, originalColors };
    setModalData({ muscle: nodeName, isOpen: true });
  };

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [model, camera]);

  return null;
};

export default ClickDetector;
