import { IonBackButton, IonButtons, IonButton, IonContent, IonHeader, IonMenuButton, IonRow, IonCol, IonInput, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useParams } from 'react-router';
import './PWRecovery.css';

const PWRecovery: React.FC = () => {

 

  return (
    <IonPage> 
    <IonContent fullscreen>       
      <IonHeader>
        <IonToolbar>
        <IonButtons slot="start">
        <IonBackButton defaultHref="/" />
        </IonButtons>
          <IonTitle size="large">Password Recovery</IonTitle>
        </IonToolbar>
      </IonHeader>
        <IonRow>
          <IonCol className="ion-padding-top">
          <img src="/assets/sil.png" alt={"MainImage"} />
          </IonCol>    
        </IonRow>
        <IonRow>
            <IonCol><p>Enter your Email</p></IonCol>
        </IonRow>
        <IonRow>    
          <IonCol><IonInput placeholder="email"  /></IonCol> 
        </IonRow>
        <IonRow><IonCol><IonButton expand="full" color="secondary" routerLink="/login">Send</IonButton></IonCol></IonRow>
      </IonContent>
  </IonPage>
  );
};

export default PWRecovery;
