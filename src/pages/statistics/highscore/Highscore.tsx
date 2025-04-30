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
import { auth, firestore } from '../../../firebase'; // Corrected
import { usePageTitle } from '../../../contexts/usePageTitle';
import {
  formatDurationWithSeconds,
  formatDate,
  calculateLongestStreak,
} from '../../../utils/timeUtils'; // Updated utils
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
    trainingFrequencyPerWeek: 0,
    longestStreakDays: 0,
    exercisesPerWorkout: 0,
    firstTrainingDate: '',
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
      const sessionDates: number[] = [];
      let firstTrainingTimestamp = Number.MAX_SAFE_INTEGER;
      let totalExercises = 0;

      trainingSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const start = data.start_date?.seconds;
        const end = data.end_date?.seconds;
        const duration = end - start;

        if (start == null || end == null) return; // skip broken docs

        totalDuration += duration;
        if (duration > longestDuration) {
          longestDuration = duration;
        }
        trainingSessionIds.push(docSnap.id);
        sessionDates.push(start);

        if (start < firstTrainingTimestamp) {
          firstTrainingTimestamp = start;
        }

        if (data.machine_sessions) {
          totalExercises += data.machine_sessions.length;
        }
      });

      // Calculate streak
      const longestStreak = calculateLongestStreak(sessionDates);

      // Calculate frequency per week
      const weeksMap: Record<string, number> = {};
      sessionDates.forEach(timestamp => {
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const week = getWeekNumber(date);
        const key = `${year}-W${week}`;
        weeksMap[key] = (weeksMap[key] || 0) + 1;
      });

      const trainingFrequencyPerWeek =
        Object.values(weeksMap).reduce((a, b) => a + b, 0) /
        (Object.keys(weeksMap).length || 1);

      // Favorite machine and highest weight
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
        trainingFrequencyPerWeek: trainingFrequencyPerWeek,
        longestStreakDays: longestStreak,
        exercisesPerWorkout: trainingSnapshot.size
          ? totalExercises / trainingSnapshot.size
          : 0,
        firstTrainingDate: firstTrainingTimestamp
          ? formatDate(firstTrainingTimestamp)
          : '',
      });
    } catch (error) {
      console.error('Failed to fetch statistics', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / (24 * 60 * 60 * 1000);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
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
          {/* Existing Rows */}
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

          {/* New Requested Rows */}
          <IonRow className="highscore-row">
            <IonCol>📅 Training Frequency (per week)</IonCol>
            <IonCol>{stats.trainingFrequencyPerWeek.toFixed(2)}</IonCol>
          </IonRow>
          <IonRow className="highscore-row">
            <IonCol>🔥 Longest Streak (days)</IonCol>
            <IonCol>{stats.longestStreakDays}</IonCol>
          </IonRow>
          <IonRow className="highscore-row">
            <IonCol>🏋️‍♂️ Exercises per Workout (avg)</IonCol>
            <IonCol>{stats.exercisesPerWorkout.toFixed(2)}</IonCol>
          </IonRow>
          <IonRow className="highscore-row">
            <IonCol>📅 First Training Session</IonCol>
            <IonCol>{stats.firstTrainingDate}</IonCol>
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
