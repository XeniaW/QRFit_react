import { IonRow,IonCol, IonContent,IonButton, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useParams } from 'react-router';
import './Statistics.css';


const Statistics: React.FC = () => {

  

  return (
    <IonPage> 
      <IonContent fullscreen>       
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Statistics</IonTitle>
          </IonToolbar>
        </IonHeader>
 
          <IonRow>
            <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt={"MainImage"} />
            </IonCol>    
          </IonRow>
          <IonRow>
            <IonCol><IonButton expand="full" color="light" routerLink="/registration">Registration</IonButton></IonCol>
            <IonCol><IonButton expand="full" color="secondary" routerLink="/login">Login</IonButton></IonCol>
          </IonRow>
        </IonContent>
    </IonPage>
  );
};

export default Statistics;
