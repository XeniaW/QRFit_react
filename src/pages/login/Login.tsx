import { IonRow,IonCol, IonContent,IonButton, IonButtons, IonBackButton, IonHeader, IonPage, IonTitle, IonToolbar, IonInput } from '@ionic/react';
import { useParams } from 'react-router';
import {useState} from 'react';
import './Login.css';


const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  function loginUser () {
    console.log(username, password);
  }

  return (
    <IonPage> 
      <IonContent fullscreen>       
        <IonHeader>
          <IonToolbar>
          <IonButtons slot="start">
          <IonBackButton defaultHref='/' />
          </IonButtons>
            <IonTitle size="large">Login</IonTitle>
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
          </IonRow>
          <IonRow>
          <IonCol><IonButton expand="full" color="primary" onClick={loginUser}>Login</IonButton></IonCol>
          <IonCol><IonButton expand="full" color="secondary" routerLink="/pw-recovery">Forgot Password?</IonButton></IonCol>
          </IonRow>
          <IonRow>
            <IonCol><p>New account?</p></IonCol>
            <IonCol><IonButton expand="full" color="secondary" routerLink="/registration">Registration</IonButton></IonCol>
          </IonRow>
        </IonContent>
    </IonPage>
  );
};

export default Login;
