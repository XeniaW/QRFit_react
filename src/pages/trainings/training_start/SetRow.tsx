import React, { useState, useEffect } from 'react';
import { IonItem, IonLabel, IonInput, IonIcon } from '@ionic/react';
import { remove } from 'ionicons/icons';

interface SetRowProps {
  sessionIndex: number;
  setIndex: number;
  reps: number;
  weight: number;
  onRepsCommit: (sessionIndex: number, setIndex: number, reps: number) => void;
  onWeightCommit: (
    sessionIndex: number,
    setIndex: number,
    weight: number
  ) => void;
  handleRemoveSet: (sessionIndex: number, setIndex: number) => void;
}

const SetRow: React.FC<SetRowProps> = ({
  sessionIndex,
  setIndex,
  reps,
  weight,
  onRepsCommit,
  onWeightCommit,
  handleRemoveSet,
}) => {
  const [repsStr, setRepsStr] = useState(reps.toString());
  const [weightStr, setWeightStr] = useState(
    weight.toString().replace('.', ',')
  );

  // sync if parent state changes
  useEffect(() => setRepsStr(reps.toString()), [reps]);
  useEffect(() => setWeightStr(weight.toString().replace('.', ',')), [weight]);

  const commitReps = () => {
    if (/^[1-9]\d*$/.test(repsStr)) {
      onRepsCommit(sessionIndex, setIndex, parseInt(repsStr, 10));
    } else {
      setRepsStr(reps.toString());
    }
  };

  const commitWeight = () => {
    const normalized = weightStr.replace(',', '.');
    if (/^\d+(\.\d+)?$/.test(normalized) && parseFloat(normalized) > 0) {
      onWeightCommit(sessionIndex, setIndex, parseFloat(normalized));
    } else {
      setWeightStr(weight.toString().replace('.', ','));
    }
  };

  return (
    <IonItem>
      <IonLabel slot="start">{setIndex + 1}:</IonLabel>
      <IonInput
        type="text"
        inputMode="numeric"
        value={repsStr}
        placeholder="Reps"
        onIonInput={e => setRepsStr(e.detail.value ?? '')}
        onIonBlur={commitReps}
      />
      <IonInput
        type="text"
        inputMode="decimal"
        value={weightStr}
        placeholder="Weight (kg)"
        onIonInput={e => setWeightStr(e.detail.value ?? '')}
        onIonBlur={commitWeight}
      />
      <IonIcon
        icon={remove}
        slot="end"
        onClick={() => handleRemoveSet(sessionIndex, setIndex)}
      />
    </IonItem>
  );
};

export default SetRow;
