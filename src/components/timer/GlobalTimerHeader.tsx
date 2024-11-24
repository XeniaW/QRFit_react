import React from 'react';
import { IonHeader, IonToolbar, IonTitle, IonButtons } from '@ionic/react';
import { useTimer } from '../../contexts/TimerContext'; // Global timer context
import { formatTime } from '../../utils/TrainingSessionUtils'; // Format function for timer

const GlobalTimerHeader: React.FC = () => {
  const { timer, isRunning } = useTimer(); // Access global timer context

  return (
    <IonHeader>
      <IonToolbar>
        <IonTitle>Training Session</IonTitle>
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
