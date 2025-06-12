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

import './Advisor.css';
import { useEffect } from 'react';

const Advisor: React.FC = () => {
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
            <IonButton expand="full" color="light" routerLink="/my/machines">
              View List
            </IonButton>
            <IonButton expand="full" color="secondary" routerLink="/modell">
              View 3D Modell
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Advisor;
