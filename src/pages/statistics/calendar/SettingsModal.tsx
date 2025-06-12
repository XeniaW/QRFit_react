import React from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonFooter,
  IonButton,
} from '@ionic/react';

interface SettingsModalProps {
  isOpen: boolean;
  onDismiss: () => void;
  cycleLength: number;
  periodLength: number;
  setCycleLength: (v: number) => void;
  setPeriodLength: (v: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onDismiss,
  cycleLength,
  periodLength,
  setCycleLength,
  setPeriodLength,
}) => (
  <IonModal isOpen={isOpen} onDidDismiss={onDismiss}>
    <IonHeader>
      <IonToolbar>
        <IonTitle>Calendar Settings</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent className="ion-padding">
      <IonItem>
        <IonLabel position="stacked">Cycle Length (days)</IonLabel>
        <IonInput
          type="number"
          value={cycleLength}
          onIonChange={e => setCycleLength(Number(e.detail.value))}
        />
      </IonItem>
      <IonItem>
        <IonLabel position="stacked">Period Length (days)</IonLabel>
        <IonInput
          type="number"
          value={periodLength}
          onIonChange={e => setPeriodLength(Number(e.detail.value))}
        />
      </IonItem>
    </IonContent>
    <IonFooter>
      <IonToolbar>
        <IonButton expand="block" onClick={onDismiss}>
          Close
        </IonButton>
      </IonToolbar>
    </IonFooter>
  </IonModal>
);

export default SettingsModal;
