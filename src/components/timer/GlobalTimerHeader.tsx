import React from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import { useTimer } from '../../contexts/TimerContext';
import { formatTime } from '../../utils/TrainingSessionUtils';
import { usePageTitle } from '../../contexts/usePageTitle';

const GlobalTimerHeader: React.FC = () => {
  const { timer, isRunning } = useTimer();
  const { title } = usePageTitle(); // Get dynamic title

  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>{title}</IonTitle> {/* Dynamic Title from Hook */}
        {isRunning && (
          <IonButtons slot="end">
            <div style={{ fontWeight: 'bold' }}>{formatTime(timer)}</div>
          </IonButtons>
        )}
      </IonToolbar>
    </IonHeader>
  );
};

export default GlobalTimerHeader;
