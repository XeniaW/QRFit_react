import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonSpinner,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
} from '@ionic/react';
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
import StatsOverview, { StatItem } from './StatsOverview';
import MostTrainedMusclesChart, {
  MuscleData,
} from '../machine_exercise_chart/MostTrainedMusclesChart';

interface Stats {
  workoutsCompleted: number;
  totalTrainingTime: number;
  averageWorkout: number;
  longestWorkout: number;
  favoriteMachine: string;
  highestWeight: number;
  highestWeightMachine: string;
  trainingFrequencyPerWeek: number;
  longestStreakDays: number;
  exercisesPerWorkout: number;
  firstTrainingDate: string;
}

const Highscore: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
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
  const [muscleData, setMuscleData] = useState<MuscleData[]>([]);

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

        // 1) build exercise → muscles map
        const machinesSnap = await getDocs(collection(firestore, 'machines'));
        const exerciseMusclesByName: Record<string, string[]> = {};
        machinesSnap.docs.forEach(docSnap => {
          const m = docSnap.data() as any;
          (m.exercises ?? []).forEach((ex: any) => {
            exerciseMusclesByName[ex.name] = ex.muscles ?? [];
          });
        });

        // 2) fetch training_sessions
        const tsSnap = await getDocs(
          query(
            collection(firestore, 'training_sessions'),
            where('user_id', '==', userId)
          )
        );
        let totalDuration = 0;
        let longestDuration = 0;
        let totalExercises = 0;
        const sessionDates: number[] = [];
        let firstTrainingTs = Number.MAX_SAFE_INTEGER;

        tsSnap.forEach(docSnap => {
          const d = docSnap.data() as any;
          const start = d.start_date?.seconds;
          const end = d.end_date?.seconds;
          if (start == null || end == null) return;
          const dur = end - start;
          totalDuration += dur;
          longestDuration = Math.max(longestDuration, dur);
          sessionDates.push(start);
          firstTrainingTs = Math.min(firstTrainingTs, start);
          if (Array.isArray(d.machine_sessions)) {
            totalExercises += d.machine_sessions.length;
          }
        });

        // 3) streak & frequency
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

        // 4) fetch machine_sessions
        const msSnap = await getDocs(
          query(
            collection(firestore, 'machine_sessions'),
            where('user_id', '==', userId)
          )
        );
        const usageCount: Record<string, number> = {};
        let highestWeight = 0;
        let highestWeightMachineId = '';

        msSnap.docs.forEach(ds => {
          const m = ds.data() as any;
          const mid = m.machine_ref.id;
          usageCount[mid] = (usageCount[mid] || 0) + 1;
          (m.sets ?? []).forEach((s: any) => {
            if (s.weight > highestWeight) {
              highestWeight = s.weight;
              highestWeightMachineId = mid;
            }
          });
        });

        // favorite machine
        let favoriteMachine = '';
        if (Object.keys(usageCount).length) {
          const [favId] = Object.entries(usageCount).reduce(
            (max, curr) => (curr[1] > max[1] ? curr : max),
            ['', 0] as [string, number]
          );
          const favSnap = await getDoc(doc(firestore, 'machines', favId));
          favoriteMachine = favSnap.exists()
            ? (favSnap.data() as any).title
            : '';
        }

        // highest-weight machine
        let highestWeightMachine = '';
        if (highestWeightMachineId) {
          const hwSnap = await getDoc(
            doc(firestore, 'machines', highestWeightMachineId)
          );
          highestWeightMachine = hwSnap.exists()
            ? (hwSnap.data() as any).title
            : '';
        }

        // 5) count muscles per workout (unique per training session)
        const sessionMuscles: Record<string, Set<string>> = {};
        msSnap.docs.forEach(ds => {
          const m = ds.data() as any;
          const sid = m.session_id ?? m.training_session_id;
          if (!sessionMuscles[sid]) sessionMuscles[sid] = new Set();
          const muscles = exerciseMusclesByName[m.exercise_name] ?? [];
          muscles.forEach(mus => sessionMuscles[sid].add(mus));
        });
        const counts: Record<string, number> = {};
        Object.values(sessionMuscles).forEach(set =>
          set.forEach(mus => (counts[mus] = (counts[mus] || 0) + 1))
        );
        const muscleArray: MuscleData[] = Object.entries(counts)
          .map(([muscle, count]) => ({ muscle, count }))
          .sort((a, b) => b.count - a.count);

        // set all state
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
          trainingFrequencyPerWeek: Math.round(freqPerWeek),
          longestStreakDays: longestStreak,
          exercisesPerWorkout: Math.round(
            tsSnap.size ? totalExercises / tsSnap.size : 0
          ),
          firstTrainingDate: firstTrainingTs ? formatDate(firstTrainingTs) : '',
        });
        setMuscleData(muscleArray);
      } catch (err) {
        console.error(err);
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
            <IonButtons slot="start">
              <IonBackButton defaultHref="/my/statistics" />
            </IonButtons>
            <IonTitle>Statistics</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

  const items: StatItem[] = [
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
      value: stats.trainingFrequencyPerWeek,
    },
    {
      title: '🏋️‍♂️ Exercises per Workout (avg)',
      value: stats.exercisesPerWorkout,
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
          <IonButtons slot="start">
            <IonBackButton defaultHref="/my/statistics" />
          </IonButtons>
          <IonTitle>Statistics</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen style={{ padding: '16px' }}>
        <StatsOverview items={items} />

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Muscle Spread</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              This chart shows how many workouts involved each muscle group.
              Each muscle is counted once per workout, regardless of how many
              sets targeted it.
            </IonText>
            {muscleData.length > 0 ? (
              <MostTrainedMusclesChart data={muscleData} />
            ) : (
              <IonText
                color="medium"
                style={{ display: 'block', marginTop: '1em' }}
              >
                no muscle data yet
              </IonText>
            )}
          </IonCardContent>
        </IonCard>
      </IonContent>
    </IonPage>
  );
};

export default Highscore;
