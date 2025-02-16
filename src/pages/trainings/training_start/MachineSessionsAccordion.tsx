import React from 'react';
import {
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonIcon,
  IonLabel,
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
  return (
    <IonAccordionGroup>
      {machineSessions.map((session, sessionIndex) => {
        const machineId = session.machine_ref.id;
        const machineTitle = machineNames[machineId] || 'Loading...';
        const exerciseName = session.exercise_name;

        // If the exerciseName is different from the machineTitle, display it.
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
              {session.sets.map((set, setIndex) => (
                <IonItem key={set.set_number}>
                  <IonLabel>
                    Set {set.set_number}: {set.reps} reps, {set.weight} kg
                  </IonLabel>
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
