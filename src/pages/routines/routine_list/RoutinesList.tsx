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
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useAuth } from '../../../auth'; // or wherever your useAuth is
import { Routine } from '../../../datamodels'; // re-use your existing interface

const RoutineList: React.FC = () => {
  const { userId } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);

  // For prompting the user before deletion
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchRoutines = async () => {
      try {
        const routinesRef = collection(firestore, 'routines');
        const q = query(routinesRef, where('user_id', '==', userId));
        const snap = await getDocs(q);
        const fetched: Routine[] = [];

        snap.forEach(docSnap => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Routine);
        });
        setRoutines(fetched);
      } catch (error) {
        console.error('Error fetching routines:', error);
      }
    };

    fetchRoutines();
  }, [userId]);

  const formatTimestamp = (timestamp?: {
    seconds: number;
    nanoseconds: number;
  }) => {
    if (!timestamp) return 'Unknown Date';
    const { seconds } = timestamp;
    return new Date(seconds * 1000).toLocaleString();
  };

  const handleDelete = async (routineId: string) => {
    try {
      await deleteDoc(doc(firestore, 'routines', routineId));
      setRoutines(prev => prev.filter(r => r.id !== routineId));
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
              routerLink={`/my/routines/${routine.id}`}
            >
              <IonLabel>
                <h2>{routine.name}</h2>
                <p>Created: {formatTimestamp(routine.created_at)}</p>
              </IonLabel>

              <IonButton
                color="danger"
                slot="end"
                onClick={e => {
                  e.preventDefault(); // don't navigate to details
                  e.stopPropagation();
                  // Instead of deleting directly, show the confirm prompt
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
                }
                setConfirmDeleteId(null);
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default RoutineList;
