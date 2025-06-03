import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonItem,
  IonLabel,
  IonAccordionGroup,
  IonAccordion,
  IonButton,
  IonAlert,
} from '@ionic/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useParams, useHistory } from 'react-router';
import { Routine, MachineSession } from '../../../datamodels';

import { useAuth } from '../../../auth';
import {
  startSession,
  addMachineSession,
} from '../../../services/TrainingSessionService';
import { useTrainingStore } from '../../../stores/useTrainingStore';
import { saveActiveWorkout } from '../../../utils/activeWorkoutStorage';

const RoutineDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [machineNames, setMachineNames] = useState<{ [id: string]: string }>(
    {}
  );
  const [showConfirmAlert, setShowConfirmAlert] = useState(false);

  const { userId } = useAuth();
  const history = useHistory();
  const setMachineSessionsInStore = useTrainingStore(s => s.setMachineSessions);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        if (!id) return;
        const docRef = doc(firestore, 'routines', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setRoutine({ id: snap.id, ...snap.data() } as Routine);
        } else {
          console.log('No routine found with id:', id);
        }
      } catch (error) {
        console.error('Error fetching routine:', error);
      }
    };

    fetchRoutine();
  }, [id]);

  useEffect(() => {
    const fetchMachineNames = async () => {
      if (!routine || !routine.machineSessions) return;

      const machineIds = routine.machineSessions.map(ms => ms.machine_ref);
      const newNames: { [key: string]: string } = {};

      for (const mId of machineIds) {
        if (!mId) continue;
        try {
          const mRef = doc(firestore, 'machines', mId);
          const mSnap = await getDoc(mRef);
          if (mSnap.exists()) {
            newNames[mId] = mSnap.data().title;
          } else {
            newNames[mId] = '(Unknown Machine)';
          }
        } catch (err) {
          console.error('Error fetching machine doc:', err);
          newNames[mId] = '(Error)';
        }
      }

      setMachineNames(newNames);
    };

    fetchMachineNames();
  }, [routine]);

  const handleStartWorkout = async () => {
    if (!routine || !userId) return;

    let newSessionId: string | null = null;

    // 1) Create a fresh "training_sessions" document in Firestore.
    await startSession(
      userId,
      generatedId => (newSessionId = generatedId),
      () => {},
      () => {}
    );
    if (!newSessionId) return;

    // 2) Build up all new MachineSession objects by passing in a "real" setter callback.
    let newMachineSessions: MachineSession[] = [];

    // accumulate must accept either:
    // - a plain MachineSession[] array, OR
    // - a function (prev: MachineSession[]) => MachineSession[].
    // Internally addMachineSession often does: setMachineSessions(prev => [...prev, newSession])
    const accumulate: React.Dispatch<
      React.SetStateAction<MachineSession[]>
    > = value => {
      if (typeof value === 'function') {
        // value is (prev: MachineSession[]) => MachineSession[]
        newMachineSessions = (
          value as (prev: MachineSession[]) => MachineSession[]
        )(newMachineSessions);
      } else {
        // value is MachineSession[]
        newMachineSessions = value;
      }
    };

    for (const ms of routine.machineSessions) {
      const machineRefId = ms.machine_ref;
      // addMachineSession expects a Machines object, but since it immediately does
      // doc(firestore, 'machines', machine.id), passing { id: <string> } works:
      const machinePlaceholder = { id: machineRefId } as any;
      const exerciseName = ms.exercise_name ?? '';

      for (const set of ms.sets) {
        // Pass the current newMachineSessions array and our accumulate setter
        // Each time addMachineSession creates a session, it calls accumulate(updatedList)
        await addMachineSession(
          userId,
          newSessionId,
          machinePlaceholder,
          exerciseName,
          set.reps,
          set.weight,
          newMachineSessions,
          accumulate
        );
      }
    }

    // 3) By now, newMachineSessions is fully populated with each created session.
    // Push them into the Zustand store so the UI will render immediately:
    setMachineSessionsInStore(newMachineSessions);

    // 4) Also serialize & write to localStorage so TrainingStart can rehydrate:
    const serialized = newMachineSessions.map(s => ({
      ...s,
      // Only store { id: <machineId> } since that’s all we need for rehydration
      machine_ref: { id: s.machine_ref.id },
    }));
    localStorage.setItem('machineSessions', JSON.stringify(serialized));

    // 5) Persist the new sessionId so TrainingStart’s useEffect will pick it up:
    localStorage.setItem('sessionId', newSessionId);

    // 6) Mark this workout “active” so TrainingStart will trigger its rehydration:
    saveActiveWorkout(Date.now());

    // 7) Finally navigate to the “Start Training” page:
    history.push('/my/trainingstart');
  };

  if (!routine) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Routine Details</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            Loading routine...
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{routine.name}</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonButton expand="block" onClick={() => setShowConfirmAlert(true)}>
          Start Workout
        </IonButton>

        <IonAlert
          isOpen={showConfirmAlert}
          onDidDismiss={() => setShowConfirmAlert(false)}
          header="Start Workout"
          message="Do you want to start a workout based on the routine?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowConfirmAlert(false),
            },
            {
              text: 'Start',
              handler: () => {
                setShowConfirmAlert(false);
                handleStartWorkout();
              },
            },
          ]}
        />

        <IonAccordionGroup
          multiple
          value={routine.machineSessions.map((_, idx) => `routine-${idx}`)}
        >
          {routine.machineSessions.map((ms, idx) => {
            const machineTitle = machineNames[ms.machine_ref] || '(Loading...)';

            const exerciseToShow =
              ms.exercise_name &&
              ms.exercise_name.trim() !== '' &&
              ms.exercise_name.trim() !== machineTitle.trim()
                ? ms.exercise_name
                : null;

            return (
              <IonAccordion key={idx} value={`routine-${idx}`}>
                <IonItem slot="header" color="light">
                  <IonLabel>
                    <strong>Machine:</strong> {machineTitle}
                    {exerciseToShow && ` - ${exerciseToShow}`}
                  </IonLabel>
                </IonItem>

                <div className="ion-padding" slot="content">
                  {ms.sets.map((set, i) => (
                    <IonItem key={i} lines="none">
                      <IonLabel>
                        Set {i + 1}: {set.reps} reps / {set.weight} kg
                      </IonLabel>
                    </IonItem>
                  ))}
                </div>
              </IonAccordion>
            );
          })}
        </IonAccordionGroup>
      </IonContent>
    </IonPage>
  );
};

export default RoutineDetails;
