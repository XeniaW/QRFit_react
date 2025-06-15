import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, firestore } from '../../../firebase';

import {
  formatDurationWithSeconds,
  formatDate,
  calculateLongestStreak,
} from '../../../utils/timeUtils';

import './Highscore.css';

const Highscore: React.FC = () => {
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

  // helper to get ISO week number
  const getWeekNumber = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        // 1) training_sessions
        const tsRef = collection(firestore, 'training_sessions');
        const tsSnap = await getDocs(
          query(tsRef, where('user_id', '==', userId))
        );

        let totalDuration = 0,
          longestDuration = 0,
          totalExercises = 0;
        const sessionDates: number[] = [];
        let firstTrainingTs = Number.MAX_SAFE_INTEGER;

        tsSnap.forEach(docSnap => {
          const d = docSnap.data();
          const start = d.start_date?.seconds,
            end = d.end_date?.seconds;
          if (start == null || end == null) return;
          const dur = end - start;
          totalDuration += dur;
          if (dur > longestDuration) longestDuration = dur;
          sessionDates.push(start);
          firstTrainingTs = Math.min(firstTrainingTs, start);
          if (d.machine_sessions) totalExercises += d.machine_sessions.length;
        });

        const longestStreak = calculateLongestStreak(sessionDates);
        const weeksMap: Record<string, number> = {};
        sessionDates.forEach(ts => {
          const d = new Date(ts * 1000);
          const key = `${d.getFullYear()}-W${getWeekNumber(d)}`;
          weeksMap[key] = (weeksMap[key] || 0) + 1;
        });
        const freqPerWeek =
          Object.values(weeksMap).reduce((a, b) => a + b, 0) /
          (Object.keys(weeksMap).length || 1);

        // 2) machine_sessions
        const msRef = collection(firestore, 'machine_sessions');
        const msSnap = await getDocs(
          query(msRef, where('user_id', '==', userId))
        );
        const usage: Record<string, number> = {};
        let highestWeight = 0,
          highestWeightMachineId = '';

        msSnap.docs.forEach(ds => {
          const d = ds.data();
          const mid = d.machine_ref.id;
          usage[mid] = (usage[mid] || 0) + 1;
          if (d.sets)
            d.sets.forEach((s: any) => {
              if (s.weight > highestWeight) {
                highestWeight = s.weight;
                highestWeightMachineId = mid;
              }
            });
        });

        // favorite machine name
        let favoriteMachine = '';
        if (Object.keys(usage).length) {
          const [favId] = Object.entries(usage).reduce(
            (max, curr) => (curr[1] > max[1] ? curr : max),
            ['', 0] as [string, number]
          );
          const favSnap = await getDoc(doc(firestore, 'machines', favId));
          favoriteMachine = favSnap.exists() ? favSnap.data()?.title : '';
        }

        // highest weight machine name
        let highestWeightMachine = '';
        if (highestWeightMachineId) {
          const hwSnap = await getDoc(
            doc(firestore, 'machines', highestWeightMachineId)
          );
          highestWeightMachine = hwSnap.exists() ? hwSnap.data()?.title : '';
        }

        setStats({
          workoutsCompleted: tsSnap.size,
          totalTrainingTime: totalDuration,
          averageWorkout: tsSnap.size
            ? Math.floor(totalDuration / tsSnap.size)
            : 0,
          longestWorkout: longestDuration,
          favoriteMachine,
          highestWeight,
          highestWeightMachine,
          trainingFrequencyPerWeek: freqPerWeek,
          longestStreakDays: longestStreak,
          exercisesPerWorkout: tsSnap.size ? totalExercises / tsSnap.size : 0,
          firstTrainingDate: firstTrainingTs ? formatDate(firstTrainingTs) : '',
        });
      } catch (err) {
        console.error('Failed to fetch statistics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

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

  // build a simple list of stats
  const items = [
    { title: '🏆 Workouts Completed', value: stats.workoutsCompleted },
    {
      title: '⏱️ Total Training Time',
      value: formatDurationWithSeconds(stats.totalTrainingTime),
    },
    {
      title: '📈 Average Workout',
      value: formatDurationWithSeconds(stats.averageWorkout),
    },
    {
      title: '💪 Highest Weight Lifted',
      value: `${stats.highestWeight} kg (${stats.highestWeightMachine})`,
    },
    {
      title: '📅 Training Frequency (per week)',
      value: stats.trainingFrequencyPerWeek.toFixed(2),
    },
    {
      title: '🏋️‍♂️ Exercises per Workout (avg)',
      value: stats.exercisesPerWorkout.toFixed(2),
    },
    {
      title: '📅 First Training Session',
      value: stats.firstTrainingDate || '—',
    },
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Score</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen style={{ padding: '16px' }}>
        {items.map((item, idx) => (
          <IonCard key={idx} style={{ marginBottom: '12px' }}>
            <IonCardHeader>
              <IonCardTitle>{item.title}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>{item.value}</IonCardContent>
          </IonCard>
        ))}
        <IonButton expand="full" color="primary" routerLink="/my/statistics">
          Back to Statistics
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Highscore;
