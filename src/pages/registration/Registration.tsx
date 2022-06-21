import { IonRow,IonCol, IonButtons,IonBackButton, IonContent,IonButton, IonHeader, IonPage, IonTitle, IonToolbar, IonInput } from '@ionic/react';
import { useParams } from 'react-router';
import {useState} from 'react';
import './Registration.css';


const Registration: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [cpassword, setCPassword] = useState('');
  
  function registerUser () {
    if (password == cpassword) {
      console.log("can reg");
    } else {
      console.log("cant reg")
    }
    console.log(username, password, cpassword);
  }

  return (
    <IonPage> 
      <IonContent fullscreen>       
        <IonHeader>
          <IonToolbar>
          <IonButtons slot="start">
        <IonBackButton defaultHref='/' />
        </IonButtons>
            <IonTitle size="large">Registration</IonTitle>
          </IonToolbar>
        </IonHeader>
 
          <IonRow>
            <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt={"MainImage"} />
            </IonCol>    
          </IonRow>
          <IonRow>
            <IonCol><IonInput placeholder="username" onIonChange={(e:any) => setUsername(e.target.value)} /></IonCol>
            <IonCol><IonInput type="password" placeholder="password" onIonChange={(e:any) => setPassword(e.target.value)} /></IonCol>
            <IonCol><IonInput type="password" placeholder="confirm password" onIonChange={(e:any) => setCPassword(e.target.value)} /></IonCol>
          </IonRow>
          <IonRow>
            <IonCol><IonButton expand="full" color="primary" onClick={registerUser}>Register</IonButton></IonCol>
          </IonRow>
          <IonRow>
            <IonCol><p>Already have an account?</p></IonCol>
            <IonCol><IonButton expand="full" color="secondary" routerLink="/login">Login</IonButton></IonCol>
          </IonRow>
        </IonContent>
    </IonPage>
  );
};

export default Registration;
