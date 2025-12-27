import React from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
} from '@ionic/react';

import TrainingSessionsWidget from './TrainingSessionsWidget';

const TrainingSessions: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle size="large">Training Sessions</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <TrainingSessionsWidget variant="page" />
      </IonContent>
    </IonPage>
  );
};

export default TrainingSessions;
