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
  IonAccordionGroup,
  IonAccordion,
} from '@ionic/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useParams } from 'react-router';
import { Routine } from '../../../datamodels';

const RoutineDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [routine, setRoutine] = useState<Routine | null>(null);

  // This map stores { machineId: machineTitle } for display
  const [machineNames, setMachineNames] = useState<{
    [machineId: string]: string;
  }>({});

  // 1) Fetch the routine doc by ID
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

  // 2) Once we have routine info, fetch the name for each machine
  useEffect(() => {
    const fetchMachineNames = async () => {
      if (!routine || !routine.machineSessions) return;

      // Build an array of machine IDs we need to fetch
      const machineIds = routine.machineSessions.map(ms => ms.machine_ref);

      const newNames: { [key: string]: string } = {};

      // Fetch each machine doc by ID
      for (const mId of machineIds) {
        if (!mId) continue;
        try {
          const mRef = doc(firestore, 'machines', mId);
          const mSnap = await getDoc(mRef);
          if (mSnap.exists()) {
            const data = mSnap.data();
            // data.title is presumably the machine's name
            newNames[mId] = data.title;
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
        <IonAccordionGroup
          multiple={true}
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
                        Set {i + 1}: {set.reps} reps, {set.weight} kg
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
