import React, { useState, useMemo } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonTitle,
  IonContent,
  IonList,
  IonItemDivider,
  IonItem,
  IonRow,
  IonCol,
  IonButton,
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
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useIonViewWillEnter } from '@ionic/react';
import {
  convertFirestoreTimestampToDate,
  calculateDuration,
} from '../../../utils/TrainingSessionUtils';

const PAGE_SIZE = 5;

const TrainingSessions: React.FC = () => {
  const { userId } = useAuth();
  const [trainingSessions, setTrainingSessions] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const trainingSessionRef = collection(firestore, 'training_sessions');

  const fetchTrainingSessions = async (loadMore = false) => {
    if (!userId) {
      console.error('User is not authenticated.');
      return;
    }

    try {
      // Build base query: filter by user, sort by start_date desc, limit to PAGE_SIZE
      let sessionsQuery = query(
        trainingSessionRef,
        where('user_id', '==', userId),
        orderBy('start_date', 'desc'),
        limit(PAGE_SIZE)
      );

      // If loading more pages, startAfter the last document we fetched
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
      const newSessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      // Append or replace sessions
      setTrainingSessions(prev =>
        loadMore ? [...prev, ...newSessions] : newSessions
      );
      // Track the last doc for pagination
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      // If we got fewer than a full page, no more pages left
      if (snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching training sessions:', error);
    }
  };

  // Initial load every time view appears
  useIonViewWillEnter(() => {
    fetchTrainingSessions(false);
  });

  // Group sessions by date string "DD.MM.YYYY"
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

  // Sort the date‐keys descending (newest first)
  const sortedDates = useMemo(() => {
    return Object.keys(groupedSessions).sort((a, b) => {
      const [dayA, monA, yrA] = a.split('.');
      const [dayB, monB, yrB] = b.split('.');
      const dateA = new Date(`${yrA}-${monA}-${dayA}`);
      const dateB = new Date(`${yrB}-${monB}-${dayB}`);
      return dateB.getTime() - dateA.getTime();
    });
  }, [groupedSessions]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle size="large">Training Sessions</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonList>
          {sortedDates.map(dateKey => (
            <React.Fragment key={dateKey}>
              <IonItemDivider key={`divider-${dateKey}`}>
                {dateKey}
              </IonItemDivider>

              {groupedSessions[dateKey].map(session => {
                const startDate = convertFirestoreTimestampToDate(
                  session.start_date
                );
                const endDate = convertFirestoreTimestampToDate(
                  session.end_date
                );
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
      </IonContent>
    </IonPage>
  );
};

export default TrainingSessions;
