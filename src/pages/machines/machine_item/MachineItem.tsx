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
  IonSelect,
  IonSelectOption,
} from '@ionic/react';
import './MachineItem.css';
import { firestore, auth } from '../../../firebase';
import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { useRouteMatch } from 'react-router';
import { Machines } from '../../../datamodels';
import MachineExerciseChart from '../../statistics/machine_exercise_chart/MachineExerciseChart';

interface RouteParams {
  id: string;
}

const timeRanges = ['all', 'week', 'month', '3 months'] as const;
type TimeRange = (typeof timeRanges)[number];

const MachineItem: React.FC = () => {
  const match = useRouteMatch<RouteParams>();
  const { id } = match.params;

  const [machine, setMachine] = useState<Machines | null>(null);
  const [showChart, setShowChart] = useState<Record<number, boolean>>({});
  const [chartData, setChartData] = useState<Record<number, any[]>>({});
  const [selectedRange, setSelectedRange] = useState<TimeRange>('all');

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

  const filterByRange = (timestamp: Timestamp): boolean => {
    const now = new Date();
    const date = timestamp.toDate();

    switch (selectedRange) {
      case 'week':
        return now.getTime() - date.getTime() <= 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now.getTime() - date.getTime() <= 30 * 24 * 60 * 60 * 1000;
      case '3 months':
        return now.getTime() - date.getTime() <= 90 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  };

  const fetchChartData = async (exerciseName: string, index: number) => {
    const userId = auth.currentUser?.uid;
    if (!userId || !machine) return;

    const machineSessionsRef = collection(firestore, 'machine_sessions');
    const machineSessionsQuery = query(
      machineSessionsRef,
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(machineSessionsQuery);

    const matching = snapshot.docs.filter(doc => {
      const data = doc.data();
      return (
        data.machine_ref.id === machine.id &&
        data.exercise_name === exerciseName &&
        filterByRange(data.date_used)
      );
    });

    const setsByDate: any[] = [];

    matching.forEach(doc => {
      const session = doc.data();
      const sessionDate = session.date_used
        .toDate()
        .toISOString()
        .split('T')[0]; // yyyy-mm-dd

      session.sets.forEach((set: any) => {
        setsByDate.push({
          date: sessionDate,
          weight: set.weight,
          reps: set.reps,
        });
      });
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
                  <IonSelect
                    interface="popover"
                    value={selectedRange}
                    onIonChange={e => {
                      setSelectedRange(e.detail.value);
                      fetchChartData(exercise.name, i); // reload with new filter
                    }}
                  >
                    {timeRanges.map(r => (
                      <IonSelectOption key={r} value={r}>
                        {r === 'all' ? 'All Time' : `Last ${r}`}
                      </IonSelectOption>
                    ))}
                  </IonSelect>

                  {chartData[i] && (
                    <div
                      style={{
                        overflowX: chartData[i].length > 6 ? 'auto' : 'hidden',
                        overflowY: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width:
                            chartData[i].length > 6
                              ? chartData[i].length * 35
                              : '100%',
                          minWidth: '100%',
                        }}
                      >
                        <MachineExerciseChart data={chartData[i]} />
                      </div>
                    </div>
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
