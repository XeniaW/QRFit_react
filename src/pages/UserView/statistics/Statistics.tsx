import {
  IonRow,
  IonCol,
  IonContent,
  IonButton,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router';
import './Statistics.css';
import { usePageTitle } from '../../../contexts/usePageTitle';
import { useEffect } from 'react';

const Statistics: React.FC = () => {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Statistics'); // Set title dynamically
  }, []);

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Advisor</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRow>
          <IonCol>
            <IonButton
              expand="full"
              color="light"
              routerLink="/my/statistics/highscore"
            >
              View your score
            </IonButton>
            <IonButton
              expand="full"
              color="secondary"
              routerLink="/my/machines"
            >
              Show machines
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Statistics;
