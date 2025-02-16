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
} from '@ionic/react';
import { useEffect, useState } from 'react';
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

interface MachineDetails {
  machine: Machines;
  exerciseName: string | null; // <--- added
  sets: MachineSession['sets'];
}

const TrainingSessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trainingSession, setTrainingSession] =
    useState<TrainingSessions | null>(null);
  const [machineDetails, setMachineDetails] = useState<MachineDetails[]>([]);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const history = useHistory();
  const { userId } = useAuth();

  useEffect(() => {
    const fetchSession = async () => {
      if (!userId) {
        console.error('User is not authenticated');
        return;
      }

      // 1) Fetch the training session
      const sessionRef = doc(firestore, 'training_sessions', id);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data() as TrainingSessions;
        setTrainingSession(sessionData);

        // 2) For each machine session ID, fetch the machine_session doc
        const machineSessionPromises = sessionData.machine_sessions.map(
          async machineSessionId => {
            const machineSessionRef = doc(
              firestore,
              'machine_sessions',
              machineSessionId
            );
            const machineSessionDoc = await getDoc(machineSessionRef);

            if (machineSessionDoc.exists()) {
              const machineSessionData =
                machineSessionDoc.data() as MachineSession;

              // 2a) Fetch the machine itself
              const machineRef =
                machineSessionData.machine_ref as DocumentReference;
              const machineDoc = await getDoc(machineRef);

              if (machineDoc.exists()) {
                return {
                  machine: {
                    id: machineDoc.id,
                    ...machineDoc.data(),
                  } as Machines,
                  // read from the machine session doc
                  exerciseName: machineSessionData.exercise_name || null,
                  sets: machineSessionData.sets,
                };
              }
            }
            return null;
          }
        );

        // 3) Resolve all machine_session fetch promises
        const detailedData = (await Promise.all(machineSessionPromises)).filter(
          data => data !== null
        ) as MachineDetails[];

        setMachineDetails(detailedData);
      }
    };

    fetchSession();
  }, [id, userId]);

  // Delete session
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

  // Calculate date & duration
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

        {/* Machines List */}
        <p>
          <strong>Machines:</strong>
        </p>
        {machineDetails.length > 0 ? (
          <ul>
            {machineDetails.map(({ machine, sets, exerciseName }) => {
              // If exerciseName is the same as machine.title, or if exerciseName is null,
              // we just show the machine title
              const showExerciseName =
                exerciseName && exerciseName !== machine.title
                  ? ` - ${exerciseName}`
                  : '';

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
                          Set {set.set_number}: {set.reps} reps, {set.weight} kg
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No sets recorded.</p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No machines added for this session.</p>
        )}

        <IonButton color="danger" onClick={() => setShowDeleteAlert(true)}>
          Delete Session
        </IonButton>

        {/* Confirmation Alert for Deletion */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header={'Delete Session'}
          message={'Are you sure you want to delete this session?'}
          buttons={[
            {
              text: 'No',
              role: 'cancel',
              handler: () => setShowDeleteAlert(false),
            },
            {
              text: 'Yes',
              handler: handleDelete,
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TrainingSessionDetails;
