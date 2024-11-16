import { IonRow, IonCol, IonContent, IonHeader, IonButtons, IonBackButton, IonPage, IonTitle, IonToolbar, IonList, IonItem } from '@ionic/react';
import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useIonViewWillEnter } from '@ionic/react';

import { convertFirestoreTimestampToDate, calculateDuration } from '../utils/TrainingSessionUtils';

const TrainingSessions: React.FC = () => {
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const trainingSessionRef = collection(firestore, "training_sessions");

  // Fetch training sessions from Firestore
  const fetchTrainingSessions = async () => {
    const data = await getDocs(trainingSessionRef);
    setTrainingSessions(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
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
            <IonBackButton defaultHref='/' />
          </IonButtons>
          <IonTitle size="large">Training Sessions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          {trainingSessions.map((trainingSession) => {
            const startDate = convertFirestoreTimestampToDate(trainingSession.start_date);
            const endDate = convertFirestoreTimestampToDate(trainingSession.end_date);
            const formattedStartDate = startDate ? startDate.toLocaleString() : "No Start Date";
            const duration = startDate && endDate ? calculateDuration(startDate, endDate) : "Duration not available";

            return (
              <IonItem key={trainingSession.id} routerLink={`/my/sessions/${trainingSession.id}`}>
                <IonRow style={{ width: '100%' }}>
                  <IonCol size="10">
                    <p><strong>Start Date:</strong> {formattedStartDate}</p>
                    <p><strong>Duration:</strong> {duration}</p>
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
