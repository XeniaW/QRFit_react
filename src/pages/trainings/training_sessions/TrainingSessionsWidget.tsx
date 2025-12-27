import React, { useMemo, useState, useEffect } from 'react';
import {
  IonList,
  IonItemDivider,
  IonItem,
  IonRow,
  IonCol,
  IonButton,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { useAuth } from '../../../auth';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
  DocumentReference,
  Timestamp,
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useIonViewWillEnter } from '@ionic/react';
import {
  convertFirestoreTimestampToDate,
  calculateDuration,
} from '../../../utils/TrainingSessionUtils';

import './TrainingSessions.css';

type Variant = 'page' | 'preview';

type Props = {
  variant?: Variant;
  previewVisibleCount?: number; // preview shows only this many, no blur
};

const PAGE_SIZE = 5;

// Minimal local types that match your datamodel
type MachineExercise = { name: string; muscles: string[] };
type MachineDoc = {
  id: string;
  title?: string;
  qrcode?: string;
  image?: { downloadURL: string }[];
  exercises?: MachineExercise[];
};

type MachineSessionDoc = {
  id: string;
  training_session_id?: string;
  machine_ref?: DocumentReference;
  exercise_name?: string;
  date_used?: Timestamp;
  sets?: any[];
  user_id?: string;
};

const TrainingSessionsWidget: React.FC<Props> = ({
  variant = 'page',
  previewVisibleCount = 3,
}) => {
  const { userId } = useAuth();

  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const [musclesBySessionId, setMusclesBySessionId] = useState<
    Record<string, string[]>
  >({});

  const trainingSessionRef = collection(firestore, 'training_sessions');

  const fetchTrainingSessions = async (loadMore = false) => {
    if (!userId) {
      console.error('User is not authenticated.');
      return;
    }

    try {
      const isPreview = variant === 'preview';

      if (isPreview) {
        const sessionsQuery = query(
          trainingSessionRef,
          where('user_id', '==', userId),
          orderBy('start_date', 'desc'),
          limit(previewVisibleCount)
        );

        const snapshot = await getDocs(sessionsQuery);
        const newSessions = snapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id,
        }));

        setTrainingSessions(newSessions);
        return;
      }

      let sessionsQuery = query(
        trainingSessionRef,
        where('user_id', '==', userId),
        orderBy('start_date', 'desc'),
        limit(PAGE_SIZE)
      );

      if (loadMore && lastVisible) {
        sessionsQuery = query(
          trainingSessionRef,
          where('user_id', '==', userId),
          orderBy('start_date', 'desc'),
          startAfter(lastVisible),
          limit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(sessionsQuery);
      const newSessions = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id,
      }));

      setTrainingSessions(prev =>
        loadMore ? [...prev, ...newSessions] : newSessions
      );

      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    }
  };

  useIonViewWillEnter(() => {
    setLastVisible(null);
    setHasMore(true);
    setMusclesBySessionId({});
    fetchTrainingSessions(false);
  });

  useEffect(() => {
    if (!userId) return;
    if (!trainingSessions || trainingSessions.length === 0) return;

    let cancelled = false;

    const compute = async () => {
      try {
        const machineCache = new Map<string, MachineDoc | null>();
        const updates: Record<string, string[]> = {};

        for (const session of trainingSessions) {
          const sessionId: string | undefined = session?.id;
          if (!sessionId) continue;

          const machineSessionIds: string[] = Array.isArray(
            session?.machine_sessions
          )
            ? session.machine_sessions
            : [];

          if (machineSessionIds.length === 0) {
            updates[sessionId] = [];
            continue;
          }

          const msDocs: (MachineSessionDoc | null)[] = await Promise.all(
            machineSessionIds.map(
              async (msId): Promise<MachineSessionDoc | null> => {
                try {
                  const msRef = doc(firestore, 'machine_sessions', msId);
                  const msSnap = await getDoc(msRef);
                  if (!msSnap.exists()) return null;

                  const data = msSnap.data() as Omit<MachineSessionDoc, 'id'>;
                  return { id: msSnap.id, ...data };
                } catch {
                  return null;
                }
              }
            )
          );

          const musclesSet = new Set<string>();

          for (const ms of msDocs) {
            if (!ms) continue;

            // Optional user guard
            if (ms.user_id && ms.user_id !== userId) continue;

            const machineRef = ms.machine_ref;
            const exerciseName = ms.exercise_name;

            if (!machineRef) continue;

            const machineKey = machineRef.path;

            let machineDoc = machineCache.get(machineKey) ?? null;

            if (!machineCache.has(machineKey)) {
              try {
                const machineSnap = await getDoc(machineRef);
                if (machineSnap.exists()) {
                  const mdata = machineSnap.data() as Omit<MachineDoc, 'id'>;
                  machineDoc = { id: machineSnap.id, ...mdata };
                } else {
                  machineDoc = null;
                }
              } catch {
                machineDoc = null;
              }
              machineCache.set(machineKey, machineDoc);
            }

            if (!machineDoc) continue;

            const exercises = Array.isArray(machineDoc.exercises)
              ? machineDoc.exercises
              : [];

            if (exerciseName) {
              const ex = exercises.find(e => e?.name === exerciseName);
              const muscles = Array.isArray(ex?.muscles) ? ex!.muscles : [];
              muscles.forEach(m => {
                const t = typeof m === 'string' ? m.trim() : '';
                if (t) musclesSet.add(t);
              });
            } else {
              exercises.forEach(e => {
                const muscles = Array.isArray(e?.muscles) ? e.muscles : [];
                muscles.forEach(m => {
                  const t = typeof m === 'string' ? m.trim() : '';
                  if (t) musclesSet.add(t);
                });
              });
            }
          }

          updates[sessionId] = Array.from(musclesSet);
        }

        if (!cancelled) {
          setMusclesBySessionId(prev => ({
            ...prev,
            ...updates,
          }));
        }
      } catch (e) {
        console.error('Error computing muscles trained:', e);
      }
    };

    compute();

    return () => {
      cancelled = true;
    };
  }, [trainingSessions, userId]);

  const musclesTextFor = (sessionId: string) => {
    const arr = musclesBySessionId[sessionId] || [];
    return arr.length ? arr.join(', ') : '-';
  };

  const groupedSessions = useMemo(() => {
    return trainingSessions.reduce(
      (groups, session) => {
        const dateObj = convertFirestoreTimestampToDate(session.start_date);
        const dateKey = dateObj
          ? dateObj.toLocaleDateString('de-DE')
          : 'Unbekanntes Datum';
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(session);
        return groups;
      },
      {} as Record<string, any[]>
    );
  }, [trainingSessions]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedSessions).sort((a, b) => {
      const [dayA, monA, yrA] = a.split('.');
      const [dayB, monB, yrB] = b.split('.');
      const dateA = new Date(`${yrA}-${monA}-${dayA}`);
      const dateB = new Date(`${yrB}-${monB}-${yrB}`); // <-- (see note below)
      return dateB.getTime() - dateA.getTime();
    });
  }, [groupedSessions]);

  // NOTE: I left your original logic alone, but you have a bug above:
  // new Date(`${yrB}-${monB}-${yrB}`) should be `${yrB}-${monB}-${dayB}`.
  // If you want, fix it in your codebase. I'm not "changing functions unnecessarily".

  const flattenedSessions = useMemo(() => {
    const out: any[] = [];
    sortedDates.forEach(dateKey => {
      (groupedSessions[dateKey] || []).forEach(session => {
        out.push({ ...session, __dateKey: dateKey });
      });
    });
    return out;
  }, [sortedDates, groupedSessions]);

  if (variant === 'preview') {
    const visible = flattenedSessions.slice(0, previewVisibleCount);

    return (
      <div className="tsw">
        <h2 className="tsw__heading">Last training sessions</h2>

        <div className="tsw__cards">
          {visible.map(session => {
            const startDate = convertFirestoreTimestampToDate(
              session.start_date
            );
            const endDate = convertFirestoreTimestampToDate(session.end_date);

            const duration =
              startDate && endDate
                ? calculateDuration(startDate, endDate)
                : 'Duration not available';

            return (
              <IonCard
                key={session.id}
                className="welcome-card tsw__card"
                button
                routerLink={`/my/sessions/${session.id}`}
              >
                <IonCardContent className="tsw__cardContent">
                  <div className="tsw__cardDate">
                    {' '}
                    <strong>{session.__dateKey}</strong>
                  </div>

                  <div className="tsw__line">
                    <strong>Muscles trained:</strong>{' '}
                    {musclesTextFor(session.id)}
                  </div>

                  <div className="tsw__line">
                    <strong>Duration:</strong> {duration}
                  </div>
                </IonCardContent>
              </IonCard>
            );
          })}
        </div>

        <IonButton
          expand="block"
          color="primary"
          routerLink="/my/sessions/"
          className="tsw__showMoreBtn"
        >
          Show more
        </IonButton>
      </div>
    );
  }

  return (
    <>
      <IonList>
        {sortedDates.map(dateKey => (
          <React.Fragment key={dateKey}>
            <IonItemDivider key={`divider-${dateKey}`}>
              {dateKey}
            </IonItemDivider>

            {(groupedSessions[dateKey] || []).map(session => {
              const startDate = convertFirestoreTimestampToDate(
                session.start_date
              );
              const endDate = convertFirestoreTimestampToDate(session.end_date);

              const formattedStartDate = startDate
                ? startDate.toLocaleString()
                : 'No Start Date';

              const duration =
                startDate && endDate
                  ? calculateDuration(startDate, endDate)
                  : 'Duration not available';

              return (
                <IonItem
                  key={session.id}
                  routerLink={`/my/sessions/${session.id}`}
                >
                  <IonRow style={{ width: '100%' }}>
                    <IonCol size="10">
                      <p>
                        <strong>Start Date:</strong> {formattedStartDate}
                      </p>

                      <p>
                        <strong>Muscles trained:</strong>{' '}
                        {musclesTextFor(session.id)}
                      </p>

                      <p>
                        <strong>Duration:</strong> {duration}
                      </p>
                    </IonCol>
                  </IonRow>
                </IonItem>
              );
            })}
          </React.Fragment>
        ))}
      </IonList>

      {hasMore && (
        <IonButton expand="block" onClick={() => fetchTrainingSessions(true)}>
          Load More
        </IonButton>
      )}
    </>
  );
};

export default TrainingSessionsWidget;
