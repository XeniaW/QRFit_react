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
  sets: MachineSession['sets'];
}

const TrainingSessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trainingSession, setTrainingSession] =
    useState<TrainingSessions | null>(null);
  const [machineDetails, setMachineDetails] = useState<MachineDetails[]>([]); // Store machine and set details
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const history = useHistory();
  const { userId } = useAuth(); // Fetch the current user's ID from AuthContext

  useEffect(() => {
    const fetchSession = async () => {
      const sessionRef = doc(firestore, 'training_sessions', id);
      const sessionDoc = await getDoc(sessionRef);

      if (!userId) {
        console.error('User is not authenticated');
        return;
      }
      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data() as TrainingSessions;
        setTrainingSession(sessionData);

        // Fetch machine_sessions and resolve machine references
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

              // Fetch machine details using machine_ref (DocumentReference)
              const machineRef =
                machineSessionData.machine_ref as DocumentReference;
              const machineDoc = await getDoc(machineRef);
              if (machineDoc.exists()) {
                return {
                  machine: {
                    id: machineDoc.id,
                    ...machineDoc.data(),
                  } as Machines,
                  sets: machineSessionData.sets,
                };
              }
            }
            return null;
          }
        );

        // Resolve all promises and filter out any null values
        const detailedData = (await Promise.all(machineSessionPromises)).filter(
          data => data !== null
        ) as MachineDetails[];
        setMachineDetails(detailedData);
      }
    };

    fetchSession();
  }, [id]);

  const handleDelete = async () => {
    if (!userId) {
      console.error('User is not authenticated.');
      return;
    }

    try {
      await deleteTrainingSession(id, userId); // Pass userId as the second argument
      history.push('/my/sessions'); // Redirect back to sessions list after deletion
    } catch (error) {
      console.error('Error deleting document:', error);
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
            {machineDetails.map(({ machine, sets }) => (
              <li key={machine.id}>
                <p>
                  <strong>{machine.title || 'Unnamed Machine'}</strong>
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
            ))}
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
