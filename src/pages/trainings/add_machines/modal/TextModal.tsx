import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonInput,
  IonFooter,
  IonButton,
} from '@ionic/react';

interface TextModalProps {
  isOpen: boolean;
  onConfirm: (reps: number, weight: number) => void;
  onCancel: () => void;
}

const TextModal: React.FC<TextModalProps> = ({ isOpen, onConfirm, onCancel }) => {
  const [reps, setReps] = useState<string>(''); // Use string to directly bind with IonInput
  const [weight, setWeight] = useState<string>(''); // Use string to directly bind with IonInput

  // Reset values when modal opens
  useEffect(() => {
    if (isOpen) {
      setReps('');
      setWeight('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const parsedReps = parseInt(reps, 10);
    const parsedWeight = parseInt(weight, 10);

    if (!isNaN(parsedReps) && !isNaN(parsedWeight)) {
      onConfirm(parsedReps, parsedWeight);
      setReps('');
      setWeight('');
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Enter Reps and Weight</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '16px' }}>
          <IonInput
            type="number"
            placeholder="Reps"
            value={reps}
            onIonInput={(e) => setReps(e.detail.value!)} // Properly update state
          />
          <IonInput
            type="number"
            placeholder="Weight (kg)"
            value={weight}
            onIonInput={(e) => setWeight(e.detail.value!)} // Properly update state
          />
        </div>
      </IonContent>
      <IonFooter>
        <IonButton expand="block" onClick={handleConfirm}>
          Confirm
        </IonButton>
        <IonButton expand="block" color="light" onClick={onCancel}>
          Cancel
        </IonButton>
      </IonFooter>
    </IonModal>
  );
};

export default TextModal;
