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
import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, firestore } from '../../../firebase';
import { usePageTitle } from '../../../contexts/usePageTitle';
import {
  formatDurationWithSeconds,
  formatDate,
  calculateLongestStreak,
} from '../../../utils/timeUtils';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, EffectCreative, Autoplay } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-creative';

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

      // Fetch and process data (unchanged)...
      const trainingSessionsRef = collection(firestore, 'training_sessions');
      const trainingQuery = query(
        trainingSessionsRef,
        where('user_id', '==', userId)
      );
      const trainingSnapshot = await getDocs(trainingQuery);
      let totalDuration = 0,
        longestDuration = 0,
        totalExercises = 0;
      const sessionDates: number[] = [];
      let firstTrainingTimestamp = Number.MAX_SAFE_INTEGER;

      trainingSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const start = data.start_date?.seconds;
        const end = data.end_date?.seconds;
        if (start == null || end == null) return;
        const duration = end - start;
        totalDuration += duration;
        if (duration > longestDuration) longestDuration = duration;
        sessionDates.push(start);
        if (start < firstTrainingTimestamp) firstTrainingTimestamp = start;
        if (data.machine_sessions)
          totalExercises += data.machine_sessions.length;
      });
      const longestStreak = calculateLongestStreak(sessionDates);
      const weeksMap: Record<string, number> = {};
      sessionDates.forEach(ts => {
        const d = new Date(ts * 1000);
        const key = `${d.getFullYear()}-W${getWeekNumber(d)}`;
        weeksMap[key] = (weeksMap[key] || 0) + 1;
      });
      const trainingFrequencyPerWeek =
        Object.values(weeksMap).reduce((a, b) => a + b, 0) /
        (Object.keys(weeksMap).length || 1);

      const machineSessionsRef = collection(firestore, 'machine_sessions');
      const machineSnapshot = await getDocs(
        query(machineSessionsRef, where('user_id', '==', userId))
      );
      const usage: Record<string, number> = {};
      let highestWeight = 0,
        highestWeightMachine = '';
      machineSnapshot.docs.forEach(ds => {
        const d = ds.data();
        const mid = d.machine_ref.id;
        usage[mid] = (usage[mid] || 0) + 1;
        if (d.sets)
          d.sets.forEach((s: any) => {
            if (s.weight > highestWeight) {
              highestWeight = s.weight;
              highestWeightMachine = mid;
            }
          });
      });
      let favoriteMachineId = '',
        maxUsage = 0;
      Object.entries(usage).forEach(([mid, count]) => {
        if (count > maxUsage) {
          maxUsage = count;
          favoriteMachineId = mid;
        }
      });
      const getName = async (id: string) => {
        const snap = await getDoc(doc(firestore, 'machines', id));
        return snap.exists() ? snap.data()?.title : '';
      };
      const favoriteMachine = favoriteMachineId
        ? await getName(favoriteMachineId)
        : '';
      const highestWeightMachineName = highestWeightMachine
        ? await getName(highestWeightMachine)
        : '';

      setStats({
        workoutsCompleted: trainingSnapshot.size,
        totalTrainingTime: totalDuration,
        averageWorkout: trainingSnapshot.size
          ? Math.floor(totalDuration / trainingSnapshot.size)
          : 0,
        longestWorkout: longestDuration,
        favoriteMachine,
        highestWeight,
        highestWeightMachine: highestWeightMachineName,
        trainingFrequencyPerWeek,
        longestStreakDays: longestStreak,
        exercisesPerWorkout: trainingSnapshot.size
          ? totalExercises / trainingSnapshot.size
          : 0,
        firstTrainingDate: firstTrainingTimestamp
          ? formatDate(firstTrainingTimestamp)
          : '',
      });
    } catch (err) {
      console.error('Failed to fetch statistics', err);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), 0, 1);
    const pastDays = (date.getTime() - firstDay.getTime()) / 86400000;
    return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
  };

  if (loading)
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

  // Slide cards with creative effect and autoplay
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Score</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <Swiper
          grabCursor={true}
          effect="creative"
          creativeEffect={{
            prev: { shadow: true, translate: [0, 0, -400] },
            next: { translate: ['100%', 0, 0] },
          }}
          modules={[EffectCreative, Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          spaceBetween={20}
          slidesPerView={1}
          style={{ paddingBottom: '24px' }}
        >
          {/* Slide Items */}
          {[
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
              title: '🏅 Longest Workout',
              value: formatDurationWithSeconds(stats.longestWorkout),
            },
            { title: '🚴‍♂️ Favorite Machine', value: stats.favoriteMachine },
            {
              title: '💪 Highest Weight Lifted',
              value: `${stats.highestWeight} kg (${stats.highestWeightMachine})`,
            },
            {
              title: '📅 Training Frequency (per week)',
              value: stats.trainingFrequencyPerWeek.toFixed(2),
            },
            {
              title: '🔥 Longest Streak (days)',
              value: stats.longestStreakDays,
            },
            {
              title: '🏋️‍♂️ Exercises per Workout (avg)',
              value: stats.exercisesPerWorkout.toFixed(2),
            },
            {
              title: '📅 First Training Session',
              value: stats.firstTrainingDate,
            },
          ].map((item, i) => (
            <SwiperSlide key={i}>
              <IonCard style={{ margin: '16px', padding: '16px' }}>
                <IonCardHeader>
                  <IonCardTitle>{item.title}</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>{item.value}</IonCardContent>
              </IonCard>
            </SwiperSlide>
          ))}
        </Swiper>
        <IonButton expand="full" color="primary" routerLink="/my/statistics">
          Back to Statistics
        </IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Highscore;
