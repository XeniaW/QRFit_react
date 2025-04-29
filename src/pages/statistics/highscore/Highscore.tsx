import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonSpinner,
} from '@ionic/react';
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, firestore } from '../../../firebase'; // CORRECT: use firestore
import { usePageTitle } from '../../../contexts/usePageTitle';
import { formatDurationWithSeconds } from '../../../utils/timeUtils'; // New util
import './Highscore.css';

const Highscore: React.FC = () => {
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    workoutsCompleted: 0,
    totalTrainingTime: 0,
    averageWorkout: 0,
    longestWorkout: 0,
    favoriteMachine: '',
    highestWeight: 0,
    highestWeightMachine: '',
  });

  useEffect(() => {
    setTitle('Your Score');
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Fetch training sessions
      const trainingSessionsRef = collection(firestore, 'training_sessions');
      const trainingQuery = query(
        trainingSessionsRef,
        where('user_id', '==', userId)
      );
      const trainingSnapshot = await getDocs(trainingQuery);

      let totalDuration = 0;
      let longestDuration = 0;
      const trainingSessionIds: string[] = [];

      trainingSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const start = data.start_date.seconds;
        const end = data.end_date.seconds;
        const duration = end - start;
        totalDuration += duration;
        if (duration > longestDuration) {
          longestDuration = duration;
        }
        trainingSessionIds.push(docSnap.id);
      });

      // Fetch machine sessions
      const machineSessionsRef = collection(firestore, 'machine_sessions');
      const machineQuery = query(
        machineSessionsRef,
        where('user_id', '==', userId)
      );
      const machineSnapshot = await getDocs(machineQuery);

      const machineUsageCount: Record<string, number> = {};
      let highestWeight = 0;
      let highestWeightMachine = '';

      for (const docSnap of machineSnapshot.docs) {
        const data = docSnap.data();
        const machineId = data.machine_ref.id;

        machineUsageCount[machineId] = (machineUsageCount[machineId] || 0) + 1;

        if (data.sets) {
          for (const set of data.sets) {
            if (set.weight > highestWeight) {
              highestWeight = set.weight;
              highestWeightMachine = machineId;
            }
          }
        }
      }

      // Favorite machine
      let favoriteMachineId = '';
      let maxUsage = 0;
      for (const [machineId, count] of Object.entries(machineUsageCount)) {
        if (count > maxUsage) {
          maxUsage = count;
          favoriteMachineId = machineId;
        }
      }

      let favoriteMachineName = '';
      let highestWeightMachineName = '';

      if (favoriteMachineId) {
        const machineDoc = await getDoc(
          doc(firestore, 'machines', favoriteMachineId)
        );
        favoriteMachineName = machineDoc.exists()
          ? machineDoc.data()?.title
          : '';
      }

      if (highestWeightMachine) {
        const machineDoc = await getDoc(
          doc(firestore, 'machines', highestWeightMachine)
        );
        highestWeightMachineName = machineDoc.exists()
          ? machineDoc.data()?.title
          : '';
      }

      setStats({
        workoutsCompleted: trainingSnapshot.size,
        totalTrainingTime: totalDuration,
        averageWorkout: trainingSnapshot.size
          ? Math.floor(totalDuration / trainingSnapshot.size)
          : 0,
        longestWorkout: longestDuration,
        favoriteMachine: favoriteMachineName,
        highestWeight: highestWeight,
        highestWeightMachine: highestWeightMachineName,
      });
    } catch (error) {
      console.error('Failed to fetch statistics', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Your Score</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Score</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonGrid>
          <IonRow className="highscore-row">
            <IonCol>🏆 Workouts Completed</IonCol>
            <IonCol>{stats.workoutsCompleted}</IonCol>
          </IonRow>

          <IonRow className="highscore-row">
            <IonCol>⏱️ Total Training Time</IonCol>
            <IonCol>
              {formatDurationWithSeconds(stats.totalTrainingTime)}
            </IonCol>
          </IonRow>

          <IonRow className="highscore-row">
            <IonCol>📈 Average Workout</IonCol>
            <IonCol>{formatDurationWithSeconds(stats.averageWorkout)}</IonCol>
          </IonRow>

          <IonRow className="highscore-row">
            <IonCol>🏅 Longest Workout</IonCol>
            <IonCol>{formatDurationWithSeconds(stats.longestWorkout)}</IonCol>
          </IonRow>

          <IonRow className="highscore-row">
            <IonCol>🚴‍♂️ Favorite Machine</IonCol>
            <IonCol>{stats.favoriteMachine}</IonCol>
          </IonRow>

          <IonRow className="highscore-row">
            <IonCol>💪 Highest Weight Lifted</IonCol>
            <IonCol>
              {stats.highestWeight} kg ({stats.highestWeightMachine})
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonButton expand="full" color="primary" routerLink="/my/statistics">
          Back to Statistics
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Highscore;
