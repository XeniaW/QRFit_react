import React from 'react';
import {
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonIcon,
  IonLabel,
} from '@ionic/react';
import { trash, add } from 'ionicons/icons';

import { MachineSession } from '../../../datamodels';
import { deleteMachineSession as deleteSessionService } from '../../../services/TrainingSessionService';
import SetRow from './SetRow';

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
  const commitReps = (si: number, ui: number, val: number) => {
    setMachineSessions(prev => {
      const next = [...prev];
      next[si].sets[ui].reps = val;
      return next;
    });
  };

  const commitWeight = (si: number, ui: number, val: number) => {
    setMachineSessions(prev => {
      const next = [...prev];
      next[si].sets[ui].weight = val;
      return next;
    });
  };

  return (
    <IonAccordionGroup>
      {machineSessions.map((session, si) => {
        const title = machineNames[session.machine_ref.id] || 'Loading...';
        const extra =
          session.exercise_name && session.exercise_name !== title
            ? ` – ${session.exercise_name}`
            : '';

        return (
          <IonAccordion key={session.id} value={session.id}>
            <IonItem slot="header" color="light">
              <IonLabel>
                <strong>Machine:</strong> {title}
                {extra}
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
                  style={{ fontSize: '.75rem', fontWeight: 'bold' }}
                >
                  Set
                </IonLabel>
                <IonLabel style={{ fontSize: '.75rem', fontWeight: 'bold' }}>
                  Reps
                </IonLabel>
                <IonLabel style={{ fontSize: '.75rem', fontWeight: 'bold' }}>
                  Weight
                </IonLabel>
              </IonItem>

              {session.sets.map((set, ui) => (
                <SetRow
                  key={set.set_number}
                  sessionIndex={si}
                  setIndex={ui}
                  reps={set.reps}
                  weight={set.weight}
                  onRepsCommit={commitReps}
                  onWeightCommit={commitWeight}
                  handleRemoveSet={handleRemoveSet}
                />
              ))}

              <IonItem
                button
                onClick={() => {
                  setSelectedSessionIndex(si);
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
