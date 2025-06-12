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

import './Statistics.css';

const Statistics: React.FC = () => {
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

            <IonButton
              expand="full"
              color="secondary"
              routerLink="/my/calendar"
            >
              Calendar
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Statistics;
