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

const TextModal: React.FC<TextModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setReps('');
      setWeight('');
    }
  }, [isOpen]);

  // only used to enable/disable Confirm
  const isRepsValid = () => /^[1-9]\d*$/.test(reps);
  const isWeightValid = () => {
    const norm = weight.replace(',', '.');
    return /^\d+(\.\d+)?$/.test(norm) && parseFloat(norm) > 0;
  };

  const handleConfirm = () => {
    if (!isRepsValid() || !isWeightValid()) return;
    onConfirm(parseInt(reps, 10), parseFloat(weight.replace(',', '.')));
    setReps('');
    setWeight('');
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Enter Reps and Weight</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: 16 }}>
          <IonInput
            placeholder="Reps"
            value={reps}
            inputMode="numeric"
            onIonInput={e => setReps(e.detail.value ?? '')}
          />
          <IonInput
            placeholder="Weight (kg)"
            value={weight}
            inputMode="decimal"
            onIonInput={e => setWeight(e.detail.value ?? '')}
          />
        </div>
      </IonContent>
      <IonFooter>
        <IonButton
          expand="block"
          onClick={handleConfirm}
          disabled={!isRepsValid() || !isWeightValid()}
        >
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
