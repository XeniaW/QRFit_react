import React from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { useTimer } from '../../contexts/TimerContext';

import { star } from 'ionicons/icons';

const GlobalTimerHeader: React.FC = () => {
  const { isRunning } = useTimer();
  if (!isRunning) return null;

  return (
    <IonHeader>
      <IonToolbar>
        {isRunning && (
          <IonButtons slot="end">
            <IonButton
              color="success"
              size="small"
              routerLink="/my/trainingstart"
            >
              <IonIcon slot="start" icon={star}></IonIcon>
              Training in progress
            </IonButton>
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default GlobalTimerHeader;
