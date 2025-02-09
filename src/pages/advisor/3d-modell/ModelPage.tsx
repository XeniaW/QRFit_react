import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import BodyModel from './BodyModel';
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
                <p>This muscle is usually trained with the **Machine**.</p>
                <p>Would you like to see available machines?</p>
              </IonText>
              <IonButton color="primary">View Machines</IonButton>
              <IonButton
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
