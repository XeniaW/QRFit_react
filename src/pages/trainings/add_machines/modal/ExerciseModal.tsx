import React, { useEffect, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonFooter,
  IonButton,
} from '@ionic/react';
import { Exercise } from '../../../../datamodels'; // Import Exercise interface

interface ExerciseModalProps {
  isOpen: boolean;
  exercises: Exercise[];
  onConfirm: (exerciseName: string) => void;
  onCancel: () => void;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  isOpen,
  exercises,
  onConfirm,
  onCancel,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedExercise(null);
    }
  }, [isOpen]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Select an Exercise</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          {exercises.map((exercise, index) => (
            <IonItem
              button
              key={index}
              onClick={() => setSelectedExercise(exercise.name)}
              color={selectedExercise === exercise.name ? 'primary' : ''}
            >
              <IonLabel>{exercise.name}</IonLabel>
            </IonItem>
          ))}
        </IonList>
      </IonContent>
      <IonFooter>
        <IonButton
          expand="block"
          onClick={() => selectedExercise && onConfirm(selectedExercise)}
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

export default ExerciseModal;
