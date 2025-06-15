import {
  IonContent,
  IonHeader,
  IonButtons,
  IonBackButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonText,
} from '@ionic/react';
import './MachineItem.css';
import { firestore, auth } from '../../../firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useRouteMatch } from 'react-router';
import { Machines } from '../../../datamodels';
import MachineExerciseChart from '../../statistics/machine_exercise_chart/MachineExerciseChart';

interface RouteParams {
  id: string;
}

const MachineItem: React.FC = () => {
  const match = useRouteMatch<RouteParams>();
  const { id } = match.params;

  const [machine, setMachine] = useState<Machines | null>(null);
  const [showChart, setShowChart] = useState<Record<number, boolean>>({});
  const [chartData, setChartData] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchMachine = async () => {
      const snap = await getDocs(query(collection(firestore, 'machines')));
      const found = snap.docs.find(doc => doc.id === id);
      if (found) {
        setMachine({ id: found.id, ...found.data() } as Machines);
      }
    };
    fetchMachine();
  }, [id]);

  const fetchChartData = async (exerciseName: string, index: number) => {
    const userId = auth.currentUser?.uid;
    if (!userId || !machine) return;

    const machineSessionsRef = collection(firestore, 'machine_sessions');
    const machineSessionsQuery = query(
      machineSessionsRef,
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(machineSessionsQuery);

    const setsByDate: any[] = [];

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (
        data.machine_ref.id === machine.id &&
        data.exercise_name === exerciseName
      ) {
        const sessionDate = data.date_used.toDate().toISOString().split('T')[0];

        data.sets.forEach((set: any) => {
          setsByDate.push({
            date: sessionDate,
            weight: set.weight,
            reps: set.reps,
          });
        });
      }
    });

    setsByDate.sort((a, b) => a.date.localeCompare(b.date));
    setChartData(prev => ({ ...prev, [index]: setsByDate }));
  };

  const handleToggleChart = async (i: number, exerciseName: string) => {
    const willShow = !showChart[i];

    if (willShow && !chartData[i]) {
      await fetchChartData(exerciseName, i);
    }

    setShowChart(prev => ({ ...prev, [i]: willShow }));
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle size="large">
            {machine?.title || 'Unnamed Machine'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {(machine?.exercises ?? []).map((exercise, i) => (
          <IonCard key={i}>
            <IonCardHeader>
              <IonCardSubtitle>
                {(exercise.muscles ?? []).join(', ')}
              </IonCardSubtitle>
              <IonCardTitle>{exercise.name}</IonCardTitle>
            </IonCardHeader>

            <IonCardContent>
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => handleToggleChart(i, exercise.name)}
              >
                {showChart[i] ? 'Hide Statistics' : 'Show Statistics'}
              </IonButton>

              {showChart[i] && (
                <>
                  {chartData[i]?.length ? (
                    <MachineExerciseChart data={chartData[i]} />
                  ) : (
                    <IonText
                      color="medium"
                      style={{
                        display: 'block',
                        marginTop: '2em',
                        textAlign: 'center',
                      }}
                    >
                      No data yet
                    </IonText>
                  )}
                </>
              )}
            </IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default MachineItem;
