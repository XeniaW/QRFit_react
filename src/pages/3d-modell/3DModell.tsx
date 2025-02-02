import React, { Suspense, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
} from '@ionic/react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { usePageTitle } from '../../contexts/usePageTitle';

/**
 * A child component that loads the GLTF model
 * and returns a Three.js object for rendering.
 */
const BodyModel: React.FC = () => {
  // Load the GLTF model from the public folder
  const { scene } = useGLTF('/assets/modell/scene.gltf');

  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('3D Modell'); // Set title when component mounts
  }, []);

  return (
    <>
      {/* Lights to improve visibility */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={0.8} />
      <spotLight position={[5, 10, 5]} angle={0.3} intensity={0.6} />

      {/* Render the loaded glTF scene with a smaller scale */}
      <primitive
        object={scene}
        scale={[0.03, 0.03, 0.03]}
        position={[0, -3, 0]}
      />
    </>
  );
};

const ModelPage: React.FC = () => {
  return (
    <IonPage>
      {/* Wrapper ensures the Canvas takes full available height */}
      <IonContent fullscreen>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <Canvas
            style={{ width: '100%', height: '100%' }}
            camera={{
              position: [0, 1, 5], // Position camera slightly above the model
              fov: 50, // Adjust the field of view for a more natural perspective
              near: 0.1,
              far: 1000,
            }}
          >
            <Suspense
              fallback={
                <mesh>
                  <boxGeometry />
                  <meshBasicMaterial color="grey" />
                </mesh>
              }
            >
              {/* OrbitControls for better interaction */}
              // @ts-expect-error
              <OrbitControls
                autoRotate={false} // Set to 'true' if you still want rotation
                enablePan={true} // Allow panning around
                enableZoom={true} // Enable zooming
                minDistance={2} // Prevent too much zoom-in
                maxDistance={10} // Prevent zoom-out too far
                maxPolarAngle={Math.PI / 2.5} // Limit how far user can rotate down
                minPolarAngle={Math.PI / 4} // Limit how far user can rotate up
              />
              <BodyModel />
            </Suspense>
          </Canvas>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ModelPage;
