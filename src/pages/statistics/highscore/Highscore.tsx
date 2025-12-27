import React, { useState, useEffect, useMemo } from 'react';
import {
  IonSpinner,
  IonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
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

type MuscleRange = 'week' | 'month' | 'all';

const DEBUG_MUSCLE_FILTER = true;

/**
 * Normalize timestamps to SECONDS.
 * Supports:
 * - Firestore Timestamp: { seconds } OR { toMillis() }
 * - Firestore internal shapes: { _seconds }
 * - numbers in seconds
 * - numbers in milliseconds (Date.now())
 * - numeric strings in seconds/ms
 */
function toSeconds(ts: any): number | null {
  if (ts == null) return null;

  if (typeof ts === 'object' && typeof ts.toMillis === 'function') {
    const ms = ts.toMillis();
    if (!Number.isFinite(ms)) return null;
    return Math.floor(ms / 1000);
  }

  if (typeof ts === 'object' && ts.seconds != null) {
    const s = Number(ts.seconds);
    if (!Number.isFinite(s)) return null;
    return s;
  }

  if (typeof ts === 'object' && ts._seconds != null) {
    const s = Number(ts._seconds);
    if (!Number.isFinite(s)) return null;
    return s;
  }

  if (typeof ts === 'number') {
    if (!Number.isFinite(ts)) return null;
    return ts > 1e12 ? Math.floor(ts / 1000) : ts;
  }

  if (typeof ts === 'string') {
    const n = Number(ts);
    if (!Number.isFinite(n)) return null;
    return n > 1e12 ? Math.floor(n / 1000) : n;
  }

  return null;
}

/**
 * Embedded version: renders ONLY the statistics content (no IonPage / Header / BackButton).
 * Use this inside the Statistics page.
 */
export const HighscoreContent: React.FC = () => {
  const [loading, setLoading] = useState(true);

  const [muscleRange, setMuscleRange] = useState<MuscleRange>('month');

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

  // NEW: master list of all muscles (so we can show zeros too)
  const [allMuscles, setAllMuscles] = useState<string[]>([]);

  // sessionId -> session start timestamp (seconds)
  const [sessionStartById, setSessionStartById] = useState<
    Record<string, number>
  >({});

  // sessionId -> unique muscles trained in that session
  const [musclesBySession, setMusclesBySession] = useState<
    Record<string, string[]>
  >({});

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

        // 1) build exercise → muscles map + master muscle list
        const machinesSnap = await getDocs(collection(firestore, 'machines'));
        const exerciseMusclesByName: Record<string, string[]> = {};
        const muscleSet = new Set<string>();

        machinesSnap.docs.forEach(docSnap => {
          const m = docSnap.data() as any;
          (m.exercises ?? []).forEach((ex: any) => {
            const muscles: string[] = ex.muscles ?? [];
            exerciseMusclesByName[ex.name] = muscles;

            muscles.forEach((mus: string) => {
              if (mus && typeof mus === 'string') muscleSet.add(mus);
            });
          });
        });

        // stable-ish order: alphabetical
        setAllMuscles(Array.from(muscleSet).sort((a, b) => a.localeCompare(b)));

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

        const startMap: Record<string, number> = {};

        tsSnap.forEach(docSnap => {
          const d = docSnap.data() as any;

          const start = toSeconds(d.start_date);
          const end = toSeconds(d.end_date);
          if (start == null || end == null) return;

          const dur = end - start;
          totalDuration += dur;
          longestDuration = Math.max(longestDuration, dur);
          sessionDates.push(start);
          firstTrainingTs = Math.min(firstTrainingTs, start);

          startMap[docSnap.id] = start;

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

        const sessionMuscles: Record<string, Set<string>> = {};

        msSnap.docs.forEach(ds => {
          const m = ds.data() as any;

          const mid = m.machine_ref?.id;
          if (mid) usageCount[mid] = (usageCount[mid] || 0) + 1;

          (m.sets ?? []).forEach((s: any) => {
            if (s.weight > highestWeight) {
              highestWeight = s.weight;
              highestWeightMachineId = mid || '';
            }
          });

          const sid = m.session_id ?? m.training_session_id;
          if (!sid) return;

          if (!sessionMuscles[sid]) sessionMuscles[sid] = new Set();

          const muscles = exerciseMusclesByName[m.exercise_name] ?? [];
          muscles.forEach((mus: string) => sessionMuscles[sid].add(mus));

          // fallback: infer start for sid if needed
          if (startMap[sid] == null) {
            const msStart = toSeconds(m.start_date ?? m.started_at ?? m.date);
            if (msStart != null) startMap[sid] = msStart;
          }
        });

        setSessionStartById(startMap);

        const musclesBySessionArr: Record<string, string[]> = {};
        Object.entries(sessionMuscles).forEach(([sid, set]) => {
          musclesBySessionArr[sid] = Array.from(set);
        });
        setMusclesBySession(musclesBySessionArr);

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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  // Derived muscle chart data based on range
  const muscleData: MuscleData[] = useMemo(() => {
    const nowSec = Math.floor(Date.now() / 1000);

    let cutoff = 0;
    if (muscleRange === 'week') cutoff = nowSec - 7 * 24 * 60 * 60;
    if (muscleRange === 'month') cutoff = nowSec - 30 * 24 * 60 * 60;

    const counts: Record<string, number> = {};

    let includedSessions = 0;
    let totalSessions = 0;

    Object.entries(musclesBySession).forEach(([sid, muscles]) => {
      totalSessions += 1;

      const start = sessionStartById[sid];
      if (start == null) return;

      if (muscleRange !== 'all' && start < cutoff) return;

      includedSessions += 1;
      muscles.forEach(mus => {
        counts[mus] = (counts[mus] || 0) + 1;
      });
    });

    if (DEBUG_MUSCLE_FILTER) {
      console.log('[muscleRange]', muscleRange);
      console.log('[cutoff]', cutoff, new Date(cutoff * 1000).toISOString());
      console.log('[sessions]', { totalSessions, includedSessions });
      console.log('[muscles total]', allMuscles.length);
      console.log('[muscles used]', Object.keys(counts).length);
    }

    // IMPORTANT: always return ALL muscles (unused => 0)
    // If allMuscles not loaded yet, fall back to used ones.
    const baseList = allMuscles.length ? allMuscles : Object.keys(counts);

    return baseList.map(muscle => ({
      muscle,
      count: counts[muscle] || 0,
    }));
  }, [muscleRange, musclesBySession, sessionStartById, allMuscles]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <IonSpinner />
      </div>
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
    <div style={{ padding: 16 }}>
      <StatsOverview items={items} />

      <IonCard className="welcome-card">
        <IonCardHeader>
          <IonCardTitle>Muscle Spread</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonText className="welcome-card__text">
            This chart shows how many workouts involved each muscle group. Each
            muscle is counted once per workout, regardless of how many sets
            targeted it.
          </IonText>

          <div style={{ marginTop: 12, marginBottom: 12 }}>
            <IonSegment
              value={muscleRange}
              onIonChange={e => {
                const v = e.detail.value;
                if (v === 'week' || v === 'month' || v === 'all')
                  setMuscleRange(v);
              }}
            >
              <IonSegmentButton value="week">
                <IonLabel>Week</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="month">
                <IonLabel>Month</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton value="all">
                <IonLabel>All</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>

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
    </div>
  );
};

/**
 * Keep the original default export to avoid breaking existing routes/imports.
 */
const Highscore: React.FC = () => {
  return <HighscoreContent />;
};

export default Highscore;
