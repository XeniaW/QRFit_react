// src/components/CalendarWidget.tsx
import {
  IonModal,
  IonButton,
  IonTextarea,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFooter,
  IonItem,
  IonLabel,
  IonPage,
  IonCheckbox,
} from '@ionic/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useEffect, useState } from 'react';
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

import './CalendarWidget.css';

// Always format dates in the local timezone as YYYY-MM-DD
const formatLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const CalendarWidget: React.FC = () => {
  const [logs, setLogs] = useState<CalendarLog[]>([]);
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [mood, setMood] = useState<'good' | 'neutral' | 'bad' | undefined>(
    undefined
  );
  const [note, setNote] = useState('');
  const [onPeriod, setOnPeriod] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    fetchCalendarLogs();
    fetchWorkoutDates();
  }, [userId]);

  const fetchCalendarLogs = async () => {
    const logsQuery = query(
      collection(firestore, 'calendar_logs'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(logsQuery);
    const data = snapshot.docs.map(doc => doc.data() as CalendarLog);
    setLogs(data);
  };

  const fetchWorkoutDates = async () => {
    const sessionsQuery = query(
      collection(firestore, 'training_sessions'),
      where('user_id', '==', userId)
    );
    const snapshot = await getDocs(sessionsQuery);

    const dates = new Set<string>();
    snapshot.forEach(docSnap => {
      const data = docSnap.data() as TrainingSessions;
      if (data.start_date) {
        const { seconds, nanoseconds = 0 } = data.start_date as {
          seconds: number;
          nanoseconds?: number;
        };
        const dateObj = new Date(seconds * 1000 + nanoseconds / 1e6);
        const localStr = formatLocal(dateObj);
        dates.add(localStr);
      }
    });

    setWorkoutDates(dates);
  };

  const openDay = (date: Date) => {
    setSelectedDate(date);
    const existingEntry = logs.find(entry => entry.date === formatLocal(date));
    if (existingEntry) {
      setMood(existingEntry.mood);
      setNote(existingEntry.note || '');
      setOnPeriod(existingEntry.on_period || false);
    } else {
      setMood(undefined);
      setNote('');
      setOnPeriod(false);
    }
    setShowModal(true);
  };

  const existingLog = selectedDate
    ? logs.find(entry => entry.date === formatLocal(selectedDate))
    : undefined;

  const saveLog = async () => {
    if (!userId || !selectedDate) return;

    const dateStr = formatLocal(selectedDate);
    const newLog: CalendarLog = {
      user_id: userId,
      date: dateStr,
      ...(mood && { mood }),
      ...(note.trim() && { note: note.trim() }),
      ...(onPeriod && { on_period: true }),
    };

    await setDoc(
      doc(firestore, 'calendar_logs', `${userId}_${dateStr}`),
      newLog
    );
    await fetchCalendarLogs();
    setShowModal(false);
  };

  const getTileClass = (date: Date) => {
    const dateStr = formatLocal(date);
    const log = logs.find(l => l.date === dateStr);
    const hasNote = !!log?.note;
    const isOnPeriod = !!log?.on_period;

    if (hasNote && isOnPeriod) return 'calendar-tile--both';
    if (isOnPeriod) return 'calendar-tile--period';
    if (hasNote) return 'calendar-tile--note';
    return null;
  };

  const renderTile = ({ date }: { date: Date }) => {
    const localStr = formatLocal(date);
    const isWorkout = workoutDates.has(localStr);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {isWorkout && (
          <div
            style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'green',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Mood Calendar</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <Calendar
          onClickDay={openDay}
          tileClassName={({ date }) => getTileClass(date)}
          tileContent={renderTile}
        />
      </IonContent>

      <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              Log for {selectedDate && formatLocal(selectedDate)}
            </IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel>Mood</IonLabel>
          </IonItem>
          <IonItem>
            <IonButton
              expand="block"
              fill={mood === 'good' ? 'solid' : 'outline'}
              onClick={() => setMood('good')}
            >
              😊 Good
            </IonButton>
            <IonButton
              expand="block"
              fill={mood === 'neutral' ? 'solid' : 'outline'}
              onClick={() => setMood('neutral')}
            >
              😐 Neutral
            </IonButton>
            <IonButton
              expand="block"
              fill={mood === 'bad' ? 'solid' : 'outline'}
              onClick={() => setMood('bad')}
            >
              ☹️ Bad
            </IonButton>
          </IonItem>

          <IonItem>
            <IonLabel position="stacked">Note (optional)</IonLabel>
            <IonTextarea
              value={note}
              onIonChange={e => setNote(e.detail.value!)}
              rows={4}
            />
          </IonItem>

          <IonItem>
            <IonLabel>Currently on period</IonLabel>
            <IonCheckbox
              checked={onPeriod}
              onIonChange={e => setOnPeriod(e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonContent>

        <IonFooter>
          <IonToolbar>
            <IonButton
              expand="block"
              color="medium"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </IonButton>
            <IonButton
              expand="block"
              onClick={saveLog}
              disabled={!mood && !note.trim() && !onPeriod && !existingLog}
            >
              Save Log
            </IonButton>
          </IonToolbar>
        </IonFooter>
      </IonModal>
    </IonPage>
  );
};

export default CalendarWidget;
