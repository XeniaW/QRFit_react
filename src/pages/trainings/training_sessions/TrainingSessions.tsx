import {
  IonRow,
  IonCol,
  IonContent,
  IonHeader,
  IonButtons,
  IonBackButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
} from '@ionic/react';
import { useState } from 'react';
import { useAuth } from '../../../auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useIonViewWillEnter } from '@ionic/react';

import {
  convertFirestoreTimestampToDate,
  calculateDuration,
} from '../../../utils/TrainingSessionUtils';

const TrainingSessions: React.FC = () => {
  const { userId } = useAuth(); // Get the userId from the AuthContext
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const trainingSessionRef = collection(firestore, 'training_sessions');

  const fetchTrainingSessions = async () => {
    if (!userId) {
      console.error('User is not authenticated.');
      return;
    }

    const q = query(trainingSessionRef, where('user_id', '==', userId)); // Filter by user_id

    try {
      const data = await getDocs(q);
      setTrainingSessions(
        data.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      );
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    }
  };

  // Refresh data every time the view is displayed
  useIonViewWillEnter(() => {
    fetchTrainingSessions();
  });

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle size="large">Training Sessions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          {trainingSessions.map(trainingSession => {
            const startDate = convertFirestoreTimestampToDate(
              trainingSession.start_date
            );
            const endDate = convertFirestoreTimestampToDate(
              trainingSession.end_date
            );
            const formattedStartDate = startDate
              ? startDate.toLocaleString()
              : 'No Start Date';
            const duration =
              startDate && endDate
                ? calculateDuration(startDate, endDate)
                : 'Duration not available';

            return (
              <IonItem
                key={trainingSession.id}
                routerLink={`/my/sessions/${trainingSession.id}`}
              >
                <IonRow style={{ width: '100%' }}>
                  <IonCol size="10">
                    <p>
                      <strong>Start Date:</strong> {formattedStartDate}
                    </p>
                    <p>
                      <strong>Duration:</strong> {duration}
                    </p>
                  </IonCol>
                </IonRow>
              </IonItem>
            );
          })}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default TrainingSessions;
