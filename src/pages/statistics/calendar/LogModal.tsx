import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonTextarea,
  IonCheckbox,
  IonFooter,
} from '@ionic/react';
import { CalendarLog } from '../../../datamodels';

interface LogModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  dateStr: string;
  mood?: 'good' | 'neutral' | 'bad';
  setMood: (mood: 'good' | 'neutral' | 'bad') => void;
  note: string;
  setNote: (note: string) => void;
  onPeriod: boolean;
  setOnPeriod: (v: boolean) => void;
  saveLog: () => Promise<void>;
  existingLog?: CalendarLog;
}

const LogModal: React.FC<LogModalProps> = ({
  isOpen,
  onDismiss,
  dateStr,
  mood,
  setMood,
  note,
  setNote,
  onPeriod,
  setOnPeriod,
  saveLog,
  existingLog,
}) => (
  <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Log for {dateStr}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      <IonItem>
        <IonLabel>Mood</IonLabel>
      </IonItem>
      <IonItem>
        <IonButton
          expand="block"
          fill={mood === 'good' ? 'solid' : 'outline'}
          onClick={() => setMood('good')}
        >
          😊 Good
        </IonButton>
        <IonButton
          expand="block"
          fill={mood === 'neutral' ? 'solid' : 'outline'}
          onClick={() => setMood('neutral')}
        >
          😐 Neutral
        </IonButton>
        <IonButton
          expand="block"
          fill={mood === 'bad' ? 'solid' : 'outline'}
          onClick={() => setMood('bad')}
        >
          ☹️ Bad
        </IonButton>
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Note (optional)</IonLabel>
        <IonTextarea
          value={note}
          onIonChange={e => setNote(e.detail.value!)}
          rows={4}
        />
      </IonItem>
      <IonItem>
        <IonLabel>Currently on period</IonLabel>
        <IonCheckbox
          checked={onPeriod}
          onIonChange={e => setOnPeriod(e.detail.checked)}
          slot="end"
        />
      </IonItem>
    </IonContent>
    <IonFooter>
      <IonToolbar>
        <IonButton expand="block" color="medium" onClick={onDismiss}>
          Cancel
        </IonButton>
        <IonButton
          expand="block"
          onClick={saveLog}
          disabled={!mood && !note.trim() && !onPeriod && !existingLog}
        >
          Save Log
        </IonButton>
      </IonToolbar>
    </IonFooter>
  </IonModal>
);

export default LogModal;
