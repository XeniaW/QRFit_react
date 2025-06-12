import React, { useEffect, useMemo, useState } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonIcon,
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { auth, firestore } from '../../../firebase';
import { CalendarLog, TrainingSessions } from '../../../datamodels';

import CycleDayReview from './CycleDayReview';
import CalendarLegend from './CalendarLegend';
import LogModal from './LogModal';
import SettingsModal from './SettingsModal';
import './CalendarWidget.css';

// Format a Date to YYYY-MM-DD (for storage)
const formatLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Parse a “YYYY-MM-DD” string into a local‐time Date at midnight
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Four‐phase logic
const getPhaseForDay = (
  day: number,
  cycleLength: number,
  periodLength: number
): 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | null => {
  const ovulationDay = cycleLength - 14;
  if (day >= 1 && day <= periodLength) return 'menstruation';
  if (day > periodLength && day < ovulationDay) return 'follicular';
  if (day === ovulationDay) return 'ovulation';
  if (day > ovulationDay && day <= cycleLength) return 'luteal';
  return null;
};

const CalendarWidget: React.FC = () => {
  // Data
  const [logs, setLogs] = useState<CalendarLog[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());

  // Log modal
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mood, setMood] = useState<'good' | 'neutral' | 'bad'>();
  const [note, setNote] = useState('');
  const [onPeriod, setOnPeriod] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // Settings modal
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(4);
  const [showSettings, setShowSettings] = useState(false);

  const userId = auth.currentUser?.uid;
  const msPerDay = 1000 * 60 * 60 * 24;

  // Fetch logs + workouts
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const logSnap = await getDocs(
        query(
          collection(firestore, 'calendar_logs'),
          where('user_id', '==', userId)
        )
      );
      setLogs(logSnap.docs.map(d => d.data() as CalendarLog));

      const sessionSnap = await getDocs(
        query(
          collection(firestore, 'training_sessions'),
          where('user_id', '==', userId)
        )
      );
      const dates = new Set<string>();
      sessionSnap.forEach(ds => {
        const data = ds.data() as TrainingSessions;
        if (data.start_date) {
          const { seconds, nanoseconds = 0 } = data.start_date as any;
          const dt = new Date(seconds * 1000 + nanoseconds / 1e6);
          dates.add(formatLocal(dt));
        }
      });
      setWorkoutDates(dates);
    })();
  }, [userId]);

  // Compute exact period days for each tick
  const periodDays = useMemo<Set<string>>(() => {
    const days = new Set<string>();
    logs
      .filter(l => l.on_period)
      .forEach(l => {
        const start = parseLocalDate(l.date).getTime();
        for (let i = 0; i < periodLength; i++) {
          days.add(formatLocal(new Date(start + i * msPerDay)));
        }
      });
    return days;
  }, [logs, periodLength]);

  // Helper: most recent period start on or before date
  const getRecentPeriodStartBefore = (date: Date): Date | null => {
    const valid = logs
      .filter(l => l.on_period)
      .map(l => parseLocalDate(l.date))
      .filter(d => d.getTime() <= date.getTime());
    if (!valid.length) return null;
    return new Date(Math.max(...valid.map(d => d.getTime())));
  };

  // CycleDayReview values
  const today = new Date();
  const lastStart = getRecentPeriodStartBefore(today) ?? today;
  const currentDay =
    Math.floor((today.getTime() - lastStart.getTime()) / msPerDay) + 1;
  const nextPeriodInDays = cycleLength - currentDay + 1;
  const lpStart = lastStart;
  const lpEnd = new Date(lpStart.getTime() + (periodLength - 1) * msPerDay);
  const lastPeriod = `${lpStart.toLocaleString('default', {
    month: 'short',
  })} ${lpStart.getDate()} – ${lpEnd.getDate()}`;
  const currentPhase =
    getPhaseForDay(currentDay, cycleLength, periodLength) ?? 'follicular';

  // Open log modal
  const openDay = (date: Date) => {
    setSelectedDate(date);
    const ds = formatLocal(date);
    const existing = logs.find(l => l.date === ds);
    if (existing) {
      setMood(existing.mood);
      setNote(existing.note || '');
      setOnPeriod(existing.on_period || false);
    } else {
      setMood(undefined);
      setNote('');
      setOnPeriod(false);
    }
    setShowLogModal(true);
  };

  // Save log
  const saveLog = async () => {
    if (!userId || !selectedDate) return;
    const ds = formatLocal(selectedDate);
    const newLog: CalendarLog = {
      user_id: userId,
      date: ds,
      ...(mood && { mood }),
      ...(note.trim() && { note: note.trim() }),
      ...(onPeriod && { on_period: true }),
    };
    await setDoc(doc(firestore, 'calendar_logs', `${userId}_${ds}`), newLog);
    // reload
    const snap = await getDocs(
      query(
        collection(firestore, 'calendar_logs'),
        where('user_id', '==', userId)
      )
    );
    setLogs(snap.docs.map(d => d.data() as CalendarLog));
    setShowLogModal(false);
  };

  // Tile CSS classes
  const getTileClass = (date: Date) => {
    const classes: string[] = [];
    const ds = formatLocal(date);

    if (periodDays.has(ds)) {
      classes.push('calendar-tile--menstruation');
    } else {
      const start = getRecentPeriodStartBefore(date);
      if (start) {
        const diff =
          Math.floor((date.getTime() - start.getTime()) / msPerDay) + 1;
        const phase = getPhaseForDay(diff, cycleLength, periodLength);
        if (phase === 'ovulation') {
          classes.push('calendar-tile--ovulation');
        }
      }
    }

    if (ds === formatLocal(new Date())) {
      classes.push('calendar-tile--today');
    }
    return classes;
  };

  // Tile content dots
  const renderTileContent = ({ date }: { date: Date }) => {
    const ds = formatLocal(date);
    const hasWorkout = workoutDates.has(ds);
    const hasLog = logs.some(l => l.date === ds);
    return (
      <div className="tile-dots">
        {hasWorkout && <span className="dot--workout" />}
        {hasLog && <span className="dot--note" />}
      </div>
    );
  };

  const existingLog = selectedDate
    ? logs.find(l => l.date === formatLocal(selectedDate))
    : undefined;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mood & Cycle Calendar</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setShowSettings(true)}>
              <IonIcon icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <CycleDayReview
          currentDay={currentDay}
          cycleLength={cycleLength}
          periodLength={periodLength}
          lastPeriod={lastPeriod}
          nextPeriodInDays={nextPeriodInDays}
          currentPhase={currentPhase}
          onLogToday={() => openDay(new Date())}
        />

        <Calendar
          onClickDay={openDay}
          tileClassName={({ date }) => getTileClass(date)}
          tileContent={renderTileContent}
        />

        <CalendarLegend />
      </IonContent>

      <LogModal
        isOpen={showLogModal}
        onDismiss={() => setShowLogModal(false)}
        dateStr={selectedDate ? formatLocal(selectedDate) : ''}
        mood={mood}
        setMood={setMood}
        note={note}
        setNote={setNote}
        onPeriod={onPeriod}
        setOnPeriod={setOnPeriod}
        saveLog={saveLog}
        existingLog={existingLog}
      />

      <SettingsModal
        isOpen={showSettings}
        onDismiss={() => setShowSettings(false)}
        cycleLength={cycleLength}
        periodLength={periodLength}
        setCycleLength={setCycleLength}
        setPeriodLength={setPeriodLength}
      />
    </IonPage>
  );
};

export default CalendarWidget;
