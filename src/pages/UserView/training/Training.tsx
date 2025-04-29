import {
  IonRow,
  IonCol,
  IonContent,
  IonButton,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import React from 'react';
import { useAuth } from '../../../auth'; // Adjust the path to your AuthContext
import { usePageTitle } from '../../../contexts/usePageTitle';
import { useEffect } from 'react';
import './Training.css';

const Training: React.FC = () => {
  const { email } = useAuth(); // Assuming `userEmail` is provided by AuthContext

  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Training'); // Set title dynamically
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Training</IonTitle>
          </IonToolbar>
        </IonHeader>

        {/* Welcome message */}
        <IonRow>
          <IonCol>
            <h2 style={{ textAlign: 'center' }}>Hello {email || 'Guest'}!</h2>
          </IonCol>
        </IonRow>

        {/* Main Image */}
        <IonRow>
          <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt="MainImage" />
          </IonCol>
        </IonRow>

        {/* Buttons */}
        <IonRow>
          <IonCol>
            <IonButton
              expand="full"
              color="light"
              routerLink="/my/trainingstart"
            >
              Start Training
            </IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton expand="full" color="light" routerLink="/my/sessions">
              My Training Sessions
            </IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton expand="full" color="light" routerLink="/my/routines">
              My Routines
            </IonButton>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton expand="full" color="light" routerLink="/my/machines">
              Browse Machines
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Training;
