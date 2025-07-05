import React, {
  Suspense,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonIcon,
  useIonViewDidEnter,
  useIonViewWillLeave,
} from '@ionic/react';
import { informationCircle } from 'ionicons/icons';

import { firestore } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

const ModelPage: React.FC = () => {
  const [modalData, setModalData] = useState<{
    muscle: string;
    isOpen: boolean;
  }>({
    muscle: '',
    isOpen: false,
  });
  const [suggestedMachine, setSuggestedMachine] = useState<string | null>(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [renderCanvas, setRenderCanvas] = useState(true);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<any>(null);

  const resetCamera = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  const forceRecreateCanvas = () => {
    setRenderCanvas(false); // Unmount Canvas
    setTimeout(() => {
      const wrapper = canvasWrapperRef.current;
      if (wrapper) {
        const existing = wrapper.querySelector('canvas');
        if (existing) {
          wrapper.removeChild(existing); // Physically remove <canvas> from DOM
        }
      }
      setCanvasKey(prev => prev + 1); // Force a new <Canvas />
      setRenderCanvas(true);
    }, 100); // Enough time to allow real unmount + DOM GC
  };

  useIonViewDidEnter(() => {
    forceRecreateCanvas();
  });

  useIonViewWillLeave(() => {
    setRenderCanvas(false);
  });

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
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>3D Advisor</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setInfoModalOpen(true)} shape="round">
              <IonIcon icon={informationCircle} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <div
          ref={canvasWrapperRef}
          style={{ position: 'relative', width: '100%', height: '100%' }}
        >
          {renderCanvas && (
            <Canvas
              key={canvasKey}
              style={{ width: '100%', height: '100%' }}
              camera={{ position: [0, 1, 5], fov: 50, near: 0.1, far: 1000 }}
              onCreated={({ gl }) => {
                // Optional: Monitor if needed
              }}
            >
              <color attach="background" args={['#888888']} />
              <Suspense
                fallback={
                  <mesh>
                    <boxGeometry />
                    <meshBasicMaterial color="grey" />
                    <Html center>
                      <IonSpinner name="crescent" />
                    </Html>
                  </mesh>
                }
              >
                <OrbitControls
                  ref={orbitRef}
                  makeDefault
                  enablePan
                  enableZoom
                  minDistance={2}
                  maxDistance={10}
                />
                <BodyModel setModalData={setModalData} />
              </Suspense>
            </Canvas>
          )}
        </div>

        {/* Muscle modal */}
        <IonModal
          isOpen={modalData.isOpen}
          onDidDismiss={() => setModalData({ muscle: '', isOpen: false })}
          initialBreakpoint={0.35}
          breakpoints={[0, 0.35, 0.5, 0.8]}
          handleBehavior="cycle"
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>{modalData.muscle}</IonTitle>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <IonText>
              <p>
                This muscle is usually trained with the{' '}
                <strong>{suggestedMachine ?? 'Machine'}</strong>.
              </p>
              <p>Would you like to see available machines?</p>
            </IonText>

            <IonButton
              expand="block"
              color="primary"
              routerLink={`/my/machines?muscle=${encodeURIComponent(modalData.muscle)}`}
              routerDirection="forward"
            >
              View Machines
            </IonButton>
          </IonContent>
        </IonModal>
        {/* Info modal */}
        <IonModal
          isOpen={infoModalOpen}
          onDidDismiss={() => setInfoModalOpen(false)}
          initialBreakpoint={0.35}
          breakpoints={[0, 0.35, 0.5, 0.8]}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>3D Advisor Info</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setInfoModalOpen(false)} />
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding">
            <p>
              This 3D model lets you explore different muscle groups. Tap on a
              muscle to see what machines are best for training it. You can
              rotate and zoom using touch gestures.
            </p>

            <IonButton expand="block" onClick={resetCamera}>
              Reset View
            </IonButton>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ModelPage;
