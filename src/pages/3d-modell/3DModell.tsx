import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  IonPage,
  IonContent,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonText,
} from '@ionic/react';

/**
 * **Pectoralis Major Quadrant Bounds**
 */
const PECTORALIS_MAJOR_QUADRANT = {
  xMin: -0.44,
  xMax: 0.46,
  yMin: 1.32,
  yMax: 1.63,
  zMin: 0.11,
  zMax: 0.3,
};

/**
 * **Click Detector: Handles Click & Highlights Area**
 */
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

    // Convert screen coordinates to normalized device coordinates (NDC)
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Find meshes in the model
    const meshes: THREE.Mesh[] = [];
    model.traverse(child => {
      if ((child as THREE.Mesh).isMesh) meshes.push(child as THREE.Mesh);
    });

    const intersects = raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const { point } = intersects[0]; // Clicked point

      console.log(
        `Clicked 3D Coordinate: x=${point.x}, y=${point.y}, z=${point.z}`
      );

      // Check if the click is inside **pectoralis major quadrant**
      if (
        point.x >= PECTORALIS_MAJOR_QUADRANT.xMin &&
        point.x <= PECTORALIS_MAJOR_QUADRANT.xMax &&
        point.y >= PECTORALIS_MAJOR_QUADRANT.yMin &&
        point.y <= PECTORALIS_MAJOR_QUADRANT.yMax &&
        point.z >= PECTORALIS_MAJOR_QUADRANT.zMin &&
        point.z <= PECTORALIS_MAJOR_QUADRANT.zMax
      ) {
        setModalData({ muscle: 'Pectoralis Major', isOpen: true }); // ✅ Open Ionic modal

        // Highlight Clicked Area
        if (highlight) {
          scene.remove(highlight); // Remove previous highlight
        }

        const highlightMesh = new THREE.Mesh(
          new THREE.PlaneGeometry(0.2, 0.2), // Thin surface highlight
          new THREE.MeshBasicMaterial({
            color: 'red',
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
          })
        );

        highlightMesh.position.copy(point);
        highlightMesh.lookAt(camera.position); // Rotate to face the camera
        scene.add(highlightMesh);
        setHighlight(highlightMesh);
      } else {
        setModalData({ muscle: '', isOpen: false });
        if (highlight) {
          scene.remove(highlight); // Remove highlight if outside the area
        }
      }
    }
  };

  useEffect(() => {
    gl.domElement.addEventListener('click', handleClick);
    return () => gl.domElement.removeEventListener('click', handleClick);
  }, [model, highlight]);

  return null; // Nothing rendered in Canvas
};

/**
 * **3D Model Component**
 */
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

/**
 * **3D Canvas Page with Ionic Modal**
 */
const ModelPage: React.FC = () => {
  const [modalData, setModalData] = useState<{
    muscle: string;
    isOpen: boolean;
  }>({ muscle: '', isOpen: false });

  return (
    <IonPage>
      <IonContent fullscreen>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Canvas
            style={{ width: '100%', height: '100%' }}
            camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 1000 }}
          >
            <Suspense
              fallback={
                <mesh>
                  <boxGeometry />
                  <meshBasicMaterial color="grey" />
                </mesh>
              }
            >
              <OrbitControls
                enablePan
                enableZoom
                minDistance={2}
                maxDistance={10}
              />
              <BodyModel setModalData={setModalData} />
            </Suspense>
          </Canvas>

          {/* ✅ IONIC MODAL - Shows when muscle is clicked */}
          <IonModal
            isOpen={modalData.isOpen}
            onDidDismiss={() => setModalData({ muscle: '', isOpen: false })}
          >
            <IonHeader>
              <IonToolbar>
                <IonTitle>{modalData.muscle}</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              <IonText>
                <h2>{modalData.muscle}</h2>
                <p>This muscle is trained with the **Chest Press Machine**.</p>
                <p>Would you like to see available machines?</p>
              </IonText>
              <IonButton
                expand="full"
                color="primary"
                onClick={() => alert('Redirecting to machine page...')}
              >
                View Machines
              </IonButton>
              <IonButton
                expand="full"
                color="danger"
                onClick={() => setModalData({ muscle: '', isOpen: false })}
              >
                Close
              </IonButton>
            </IonContent>
          </IonModal>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ModelPage;
