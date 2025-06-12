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
import { Redirect } from 'react-router';

import './Settings.css';

import { auth } from '../../../firebase';

const Settings: React.FC = () => {
  const RedirectToHome = () => {
    auth.signOut();
    <Redirect to="/sign-in" />;
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Settings</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRow>
          <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt={'MainImage'} />
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton
              expand="full"
              color="medium"
              onClick={() => RedirectToHome()}
            >
              Logout
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
