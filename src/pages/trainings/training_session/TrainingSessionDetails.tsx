import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonAlert,
  IonButtons,
  IonBackButton,
  IonToast,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { firestore } from '../../../firebase';
import { doc, getDoc, DocumentReference } from 'firebase/firestore';
import {
  convertFirestoreTimestampToDate,
  calculateDuration,
  deleteTrainingSession,
} from '../../../utils/TrainingSessionUtils';
import { useAuth } from '../../../auth';
import { useParams, useHistory } from 'react-router-dom';
import {
  Machines,
  TrainingSessions,
  MachineSession,
} from '../../../datamodels';
import { saveRoutine } from '../../../services/RoutineService';

interface MachineDetails {
  machine: Machines;
  exerciseName: string | null;
  sets: MachineSession['sets'];
  musclesTrained: string[]; // <-- added
}

const TrainingSessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trainingSession, setTrainingSession] =
    useState<TrainingSessions | null>(null);
  const [machineDetails, setMachineDetails] = useState<MachineDetails[]>([]);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [showToast, setShowToast] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });

  const history = useHistory();
  const { userId } = useAuth();

  useEffect(() => {
    const fetchSession = async () => {
      if (!userId) {
        console.error('User is not authenticated');
        return;
      }

      const sessionRef = doc(firestore, 'training_sessions', id);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) return;
      const sessionData = sessionDoc.data() as TrainingSessions;
      setTrainingSession(sessionData);

      const promises = sessionData.machine_sessions.map(async msId => {
        const msRef = doc(firestore, 'machine_sessions', msId);
        const msDoc = await getDoc(msRef);
        if (!msDoc.exists()) return null;

        const msData = msDoc.data() as MachineSession;
        const machineRef = msData.machine_ref as DocumentReference;

        const machineDoc = await getDoc(machineRef);
        if (!machineDoc.exists()) return null;

        const machine = { id: machineDoc.id, ...machineDoc.data() } as Machines;

        const exerciseName = msData.exercise_name || null;

        // ---- derive muscles for this machine session ----
        const exercises = Array.isArray(machine.exercises)
          ? machine.exercises
          : [];

        let muscles: string[] = [];

        if (exerciseName) {
          const ex = exercises.find(e => e?.name === exerciseName);
          muscles = Array.isArray(ex?.muscles) ? ex!.muscles : [];
        } else {
          // fallback: aggregate all muscles for this machine
          const set = new Set<string>();
          exercises.forEach(e => {
            const m = Array.isArray(e?.muscles) ? e.muscles : [];
            m.forEach(x => {
              const t = typeof x === 'string' ? x.trim() : '';
              if (t) set.add(t);
            });
          });
          muscles = Array.from(set);
        }

        // normalize + dedupe
        const musclesTrained = Array.from(
          new Set(
            muscles
              .map(m => (typeof m === 'string' ? m.trim() : ''))
              .filter(Boolean)
          )
        );

        return {
          machine,
          exerciseName,
          sets: msData.sets,
          musclesTrained,
        } as MachineDetails;
      });

      const detailed = (await Promise.all(promises)).filter(
        (md): md is MachineDetails => md !== null
      );
      setMachineDetails(detailed);
    };

    fetchSession();
  }, [id, userId]);

  const handleDelete = async () => {
    if (!userId) {
      console.error('User is not authenticated.');
      return;
    }
    try {
      await deleteTrainingSession(id, userId);
      history.push('/my/sessions');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleSaveRoutine = async (name: string) => {
    if (!userId) {
      console.error('User is not authenticated');
      return;
    }
    if (!name.trim()) return;

    try {
      const msForRoutine: MachineSession[] = machineDetails.map(
        md =>
          ({
            machine_ref: doc(
              firestore,
              'machines',
              md.machine.id
            ) as DocumentReference,
            exercise_name: md.exerciseName ?? md.machine.title,
            sets: md.sets,
          }) as unknown as MachineSession
      );

      await saveRoutine(userId, name, msForRoutine);
      setShowToast({ isOpen: true, message: `Routine "${name}" saved!` });
    } catch (err) {
      console.error('Error saving routine:', err);
      setShowToast({ isOpen: true, message: 'Failed to save routine.' });
    } finally {
      setShowSaveAlert(false);
      setRoutineName('');
    }
  };

  const startDate = trainingSession
    ? convertFirestoreTimestampToDate(trainingSession.start_date)
    : null;
  const endDate = trainingSession
    ? convertFirestoreTimestampToDate(trainingSession.end_date)
    : null;

  const formattedStartDate = startDate
    ? startDate.toLocaleString()
    : 'No Start Date';

  const duration =
    startDate && endDate
      ? calculateDuration(startDate, endDate)
      : 'Duration not available';

  // Session-level muscles (union across all machine sessions)
  const sessionMusclesTrained = useMemo(() => {
    const set = new Set<string>();
    machineDetails.forEach(md => {
      (md.musclesTrained || []).forEach(m => set.add(m));
    });
    return Array.from(set);
  }, [machineDetails]);

  const sessionMusclesText =
    sessionMusclesTrained.length > 0 ? sessionMusclesTrained.join(', ') : '-';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>Training Session Details</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <h2>Session ID: {id}</h2>

        <p>
          <strong>Date:</strong> {formattedStartDate}
        </p>
        <p>
          <strong>Duration:</strong> {duration}
        </p>

        {/* Added: muscles trained for the whole session */}
        <p>
          <strong>Muscles trained:</strong> {sessionMusclesText}
        </p>

        <p>
          <strong>Machines:</strong>
        </p>

        {machineDetails.length > 0 ? (
          <ul>
            {machineDetails.map(
              ({ machine, sets, exerciseName, musclesTrained }) => {
                const showExerciseName =
                  exerciseName && exerciseName !== machine.title
                    ? ` - ${exerciseName}`
                    : '';

                const musclesText =
                  musclesTrained.length > 0 ? musclesTrained.join(', ') : '-';

                return (
                  <li key={machine.id}>
                    <p>
                      <strong>
                        {machine.title || 'Unnamed Machine'}
                        {showExerciseName}
                      </strong>
                    </p>

                    {sets.length > 0 ? (
                      <ul>
                        {sets.map(set => (
                          <li key={set.set_number}>
                            Set {set.set_number}: {set.reps} reps, {set.weight}{' '}
                            kg
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No sets recorded.</p>
                    )}
                  </li>
                );
              }
            )}
          </ul>
        ) : (
          <p>No machines added for this session.</p>
        )}

        <IonButton
          onClick={() => setShowSaveAlert(true)}
          disabled={machineDetails.length === 0}
        >
          Save as Routine
        </IonButton>

        <IonButton color="danger" onClick={() => setShowDeleteAlert(true)}>
          Delete Session
        </IonButton>

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Delete Session"
          message="Are you sure you want to delete this session?"
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => setShowDeleteAlert(false),
            },
            { text: 'Yes', handler: handleDelete },
          ]}
        />

        <IonAlert
          isOpen={showSaveAlert}
          onDidDismiss={() => setShowSaveAlert(false)}
          header="Name your routine"
          inputs={[
            {
              name: 'routineName',
              type: 'text',
              placeholder: 'e.g. My Leg Day',
            },
          ]}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setShowSaveAlert(false),
            },
            {
              text: 'Save',
              handler: data => handleSaveRoutine(data.routineName || ''),
            },
          ]}
        />

        <IonToast
          isOpen={showToast.isOpen}
          message={showToast.message}
          duration={2000}
          position="top"
          onDidDismiss={() => setShowToast({ ...showToast, isOpen: false })}
        />
      </IonContent>
    </IonPage>
  );
};

export default TrainingSessionDetails;
