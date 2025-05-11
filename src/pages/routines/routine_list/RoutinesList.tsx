import React, { useEffect, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonAlert,
} from '@ionic/react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuth } from '../../../auth';
import { useHistory } from 'react-router-dom';
import { Routine } from '../../../datamodels';

const RoutineList: React.FC = () => {
  const { userId } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const history = useHistory();

  useEffect(() => {
    if (!userId) return;
    const routinesRef = collection(firestore, 'routines');
    const q = query(routinesRef, where('user_id', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const fetched: Routine[] = [];
        snapshot.forEach(docSnap => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Routine);
        });
        setRoutines(fetched);
      },
      error => {
        console.error('Error fetching routines:', error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const formatTimestamp = (timestamp?: {
    seconds: number;
    nanoseconds: number;
  }) => {
    if (!timestamp) return 'Unknown Date';
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const handleDelete = async (routineId: string) => {
    try {
      await deleteDoc(doc(firestore, 'routines', routineId));
      // onSnapshot will update list automatically
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Routines</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {routines.length === 0 && (
          <div style={{ textAlign: 'center', margin: '2rem' }}>
            <strong>No routines yet</strong>
          </div>
        )}

        <IonList>
          {routines.map(routine => (
            <IonItem
              key={routine.id}
              button
              onClick={() => history.push(`/my/routines/${routine.id}`)}
            >
              <IonLabel>
                <h2>{routine.name}</h2>
                <p>Created: {formatTimestamp(routine.created_at)}</p>
              </IonLabel>

              <IonButton
                color="danger"
                slot="end"
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirmDeleteId(routine.id!);
                }}
              >
                Delete
              </IonButton>
            </IonItem>
          ))}
        </IonList>

        {/* Confirmation Alert for Deletion */}
        <IonAlert
          isOpen={!!confirmDeleteId}
          onDidDismiss={() => setConfirmDeleteId(null)}
          header="Confirm Delete"
          message="Are you sure you want to delete this routine?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => setConfirmDeleteId(null),
            },
            {
              text: 'Delete',
              handler: () => {
                if (confirmDeleteId) {
                  handleDelete(confirmDeleteId);
                  setConfirmDeleteId(null);
                }
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default RoutineList;
