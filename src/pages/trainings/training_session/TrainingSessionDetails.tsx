import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonAlert, IonButtons, IonBackButton } from '@ionic/react';
import { useEffect, useState } from 'react';
import { firestore } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { convertFirestoreTimestampToDate, calculateDuration, deleteTrainingSession } from '../TrainingSessionUtils';
import { useParams, useHistory } from 'react-router-dom';

const TrainingSessionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [trainingSession, setTrainingSession] = useState<any>(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const fetchSession = async () => {
      const sessionRef = doc(firestore, "training_sessions", id);
      const sessionDoc = await getDoc(sessionRef);
      if (sessionDoc.exists()) {
        setTrainingSession({ id: sessionDoc.id, ...sessionDoc.data() });
      }
    };
    fetchSession();
  }, [id]);

  const handleDelete = async () => {
    try {
      await deleteTrainingSession(id);
      history.push('/my/sessions'); // Redirect back to sessions list after deletion
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const startDate = trainingSession ? convertFirestoreTimestampToDate(trainingSession.start_date) : null;
  const endDate = trainingSession ? convertFirestoreTimestampToDate(trainingSession.end_date) : null;
  const formattedStartDate = startDate ? startDate.toLocaleString() : "No Start Date";
  const duration = startDate && endDate ? calculateDuration(startDate, endDate) : "Duration not available";

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref='/' />
          </IonButtons>
          <IonTitle>Training Session Details</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <h2>Session ID: {id}</h2>
        <p><strong>Start Date:</strong> {formattedStartDate}</p>
        <p><strong>Duration:</strong> {duration}</p>
        <IonButton color="danger" onClick={() => setShowDeleteAlert(true)}>Delete Session</IonButton>
        
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
              handler: () => setShowDeleteAlert(false)
            },
            {
              text: 'Yes',
              handler: handleDelete
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default TrainingSessionDetails;
