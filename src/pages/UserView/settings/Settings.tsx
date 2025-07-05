import {
  IonRow,
  IonCol,
  IonContent,
  IonButton,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import './Settings.css';

import { auth } from '../../../firebase';

const Settings: React.FC = () => {
  const router = useIonRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/', 'root'); // Redirect to home or login
  };

  const updateApp = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        reg.update(); // Request latest version from Firebase Hosting
      }

      setTimeout(() => {
        window.location.reload(); // Force reload from network
      }, 500);
    } else {
      window.location.reload();
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle size="large">Settings</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        <IonRow>
          <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt={'MainImage'} />
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol>
            <IonButton expand="full" color="medium" onClick={handleLogout}>
              Logout
            </IonButton>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol>
            <IonButton expand="full" color="primary" onClick={updateApp}>
              Reload Latest Version
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
