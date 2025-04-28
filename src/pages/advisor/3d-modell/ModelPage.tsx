import React, { Suspense, useState, useEffect } from 'react';
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

import { firestore } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const ModelPage: React.FC = () => {
  const [modalData, setModalData] = useState<{
    muscle: string;
    isOpen: boolean;
  }>({ muscle: '', isOpen: false });

  const [suggestedMachine, setSuggestedMachine] = useState<string | null>(null);

  // Whenever the modal opens for a given muscle, fetch all machines,
  // filter those whose exercises mention that muscle, and pick one at random.
  useEffect(() => {
    if (!modalData.isOpen || !modalData.muscle) {
      setSuggestedMachine(null);
      return;
    }

    const fetchAndSuggest = async () => {
      try {
        const snap = await getDocs(collection(firestore, 'machines'));
        const all = snap.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as any),
        }));
        const matches = all.filter(
          m =>
            Array.isArray(m.exercises) &&
            m.exercises.some(
              (ex: any) =>
                Array.isArray(ex.muscles) &&
                ex.muscles.includes(modalData.muscle)
            )
        );
        if (matches.length) {
          const pick = matches[Math.floor(Math.random() * matches.length)];
          setSuggestedMachine(pick.title);
        } else {
          setSuggestedMachine(null);
        }
      } catch (err) {
        console.error('Error fetching machines:', err);
        setSuggestedMachine(null);
      }
    };

    fetchAndSuggest();
  }, [modalData]);

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
                makeDefault
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
                <p>
                  This muscle is usually trained with the{' '}
                  <strong>{suggestedMachine ?? 'Machine'}</strong>.
                </p>
                <p>Would you like to see available machines?</p>
              </IonText>

              <IonButton
                color="primary"
                routerLink={`/my/machines?muscle=${encodeURIComponent(modalData.muscle)}`}
                routerDirection="forward"
              >
                View Machines
              </IonButton>

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
