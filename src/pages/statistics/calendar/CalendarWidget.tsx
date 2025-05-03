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

const formatDate = (date: Date) => date.toISOString().split('T')[0]; // "YYYY-MM-DD"

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
    snapshot.forEach(doc => {
      const data = doc.data() as TrainingSessions;
      const startSeconds = data?.start_date?.seconds;
      if (startSeconds) {
        const dateStr = new Date(startSeconds * 1000)
          .toISOString()
          .split('T')[0];
        dates.add(dateStr);
      }
    });

    setWorkoutDates(dates);
  };

  const openDay = (date: Date) => {
    setSelectedDate(date);
    const existing = logs.find(log => log.date === formatDate(date));
    if (existing) {
      setMood(existing.mood);
      setNote(existing.note || '');
      setOnPeriod(existing.on_period || false);
    } else {
      setMood(undefined);
      setNote('');
      setOnPeriod(false);
    }
    setShowModal(true);
  };

  // ===== COMPUTE WHETHER THIS DATE ALREADY HAS A LOG =====
  const existingLog = selectedDate
    ? logs.find(log => log.date === formatDate(selectedDate))
    : undefined;

  const saveLog = async () => {
    // only bail if no user or no date
    if (!userId || !selectedDate) return;

    const dateStr = formatDate(selectedDate);
    const log: CalendarLog = {
      user_id: userId,
      date: dateStr,
      ...(mood && { mood }),
      ...(note.trim() && { note: note.trim() }),
      ...(onPeriod && { on_period: true }),
    };

    await setDoc(doc(firestore, 'calendar_logs', `${userId}_${dateStr}`), log);
    await fetchCalendarLogs();
    setShowModal(false);
  };

  const getTileClass = (date: Date) => {
    const dateStr = formatDate(date);
    const log = logs.find(log => log.date === dateStr);
    const hasNote = !!log?.note;
    const isOnPeriod = !!log?.on_period;

    if (hasNote && isOnPeriod) return 'calendar-tile--both';
    if (isOnPeriod) return 'calendar-tile--period';
    if (hasNote) return 'calendar-tile--note';
    return null;
  };

  const renderTile = ({ date }: { date: Date }) => {
    const dateStr = formatDate(date);
    const isWorkout = workoutDates.has(dateStr);

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
              Log for {selectedDate && formatDate(selectedDate)}
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
              // now enabled for existing logs even if everything is cleared
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
