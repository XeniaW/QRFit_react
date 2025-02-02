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
import './Home.css';
import { usePageTitle } from '../../contexts/usePageTitle';
import { useEffect } from 'react';

const Home: React.FC = () => {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Home Page'); // Set title when component mounts
  }, []);
  return (
    <IonPage>
      <IonContent fullscreen>
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Welcome to QRFit!</IonTitle>
          </IonToolbar>
        </IonHeader>

        <IonRow>
          <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt={'MainImage'} />
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol>
            <IonButton expand="full" color="light" routerLink="/registration">
              Registration
            </IonButton>
          </IonCol>
          <IonCol>
            <IonButton expand="full" color="secondary" routerLink="/login">
              Login
            </IonButton>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Home;
