import React from 'react';
import {
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonIcon,
  IonLabel,
  IonInput,
} from '@ionic/react';
import { trash, add, remove } from 'ionicons/icons';

import { MachineSession } from '../../../datamodels';
import { deleteMachineSession as deleteSessionService } from '../../../services/TrainingSessionService';

interface MachineSessionsAccordionProps {
  machineSessions: MachineSession[];
  machineNames: { [key: string]: string };
  sessionId: string | null;
  handleRemoveSet: (sessionIndex: number, setIndex: number) => void;
  setSelectedSessionIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setShowTextModal: React.Dispatch<React.SetStateAction<boolean>>;
  deleteMachineSession: typeof deleteSessionService;
  setMachineSessions: React.Dispatch<React.SetStateAction<MachineSession[]>>;
}

const MachineSessionsAccordion: React.FC<MachineSessionsAccordionProps> = ({
  machineSessions,
  machineNames,
  sessionId,
  handleRemoveSet,
  setSelectedSessionIndex,
  setShowTextModal,
  deleteMachineSession,
  setMachineSessions,
}) => {
  const handleInputChange = (
    sessionIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) return;

    setMachineSessions(prev => {
      const updated = [...prev];
      const updatedSets = [...updated[sessionIndex].sets];
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: numericValue,
      };
      updated[sessionIndex] = {
        ...updated[sessionIndex],
        sets: updatedSets,
      };
      return updated;
    });
  };

  return (
    <IonAccordionGroup>
      {machineSessions.map((session, sessionIndex) => {
        const machineId = session.machine_ref.id;
        const machineTitle = machineNames[machineId] || 'Loading...';
        const exerciseName = session.exercise_name;

        const showExerciseName =
          exerciseName && exerciseName !== machineTitle
            ? ` - ${exerciseName}`
            : '';

        return (
          <IonAccordion key={session.id} value={session.id}>
            <IonItem slot="header" color="light">
              <IonLabel>
                <strong>Machine:</strong> {machineTitle}
                {showExerciseName}
              </IonLabel>
              <IonIcon
                icon={trash}
                slot="end"
                onClick={() =>
                  deleteMachineSession(
                    session.id,
                    sessionId!,
                    machineSessions,
                    setMachineSessions
                  )
                }
              />
            </IonItem>
            <div className="ion-padding" slot="content">
              <IonItem lines="none">
                <IonLabel
                  slot="start"
                  style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  Set
                </IonLabel>
                <IonLabel style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Reps
                </IonLabel>
                <IonLabel style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                  Weight
                </IonLabel>
                <IonLabel
                  style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                ></IonLabel>
              </IonItem>
              {session.sets.map((set, setIndex) => (
                <IonItem key={set.set_number}>
                  <IonLabel slot="start">{set.set_number}:</IonLabel>
                  <IonInput
                    value={set.reps}
                    type="number"
                    placeholder="Reps"
                    onIonInput={e =>
                      handleInputChange(
                        sessionIndex,
                        setIndex,
                        'reps',
                        (e.detail.value ?? '').toString()
                      )
                    }
                  />
                  <IonInput
                    value={set.weight}
                    type="number"
                    placeholder="Weight (kg)"
                    onIonInput={e =>
                      handleInputChange(
                        sessionIndex,
                        setIndex,
                        'weight',
                        (e.detail.value ?? '').toString()
                      )
                    }
                  />

                  <IonIcon
                    icon={remove}
                    slot="end"
                    onClick={() => handleRemoveSet(sessionIndex, setIndex)}
                  />
                </IonItem>
              ))}

              <IonItem
                button
                onClick={() => {
                  setSelectedSessionIndex(sessionIndex);
                  setShowTextModal(true);
                }}
              >
                <IonLabel>Add New Set</IonLabel>
                <IonIcon icon={add} slot="end" />
              </IonItem>
            </div>
          </IonAccordion>
        );
      })}
    </IonAccordionGroup>
  );
};

export default MachineSessionsAccordion;
