import { IonRow,IonCol, IonContent,IonButton, IonButtons, IonBackButton, IonHeader, IonPage, IonTitle, IonToolbar, IonInput, IonText, IonLoading } from '@ionic/react';
import { Redirect, useParams } from 'react-router';
import {useState} from 'react';
import './Login.css';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from '../../firebase';
import {useAuth} from '../../auth';
import { cpuUsage } from 'process';




const Login: React.FC = () => {
  const {loggedIn} = useAuth();
  const [LoginEmail, setLoginEmail] = useState<any|null>("");
  const [LoginPassword, setLoginPassword] = useState<any|null>("");

  const [status, setStatus] = useState({loading: false, error: false});

  const [errorMessage, setErrorMessage] = useState("");



  const handleLogin = async () => {
    try {
      setStatus({loading:true, error: false});
      const credential = await signInWithEmailAndPassword(auth,LoginEmail, LoginPassword);
      setStatus({loading:false, error: false});
      console.log('credentials:', credential);

    } catch (error) {
      if (error instanceof Error) {
        setStatus({loading:false, error: true});
        setErrorMessage(error.message);
        console.log(error.message);
      } else {
        console.log('Unexpected error', error);
      }
      
    }
  }

if (loggedIn) {
  console.log(loggedIn);
  return <Redirect to="/my/entries" />
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
            <IonCol><IonInput type="email" 
                      placeholder="email" 
                      value ={LoginEmail}
                      onIonChange={(event)=>setLoginEmail(event.detail.value)}
            />
            </IonCol>
            <IonCol><IonInput type="password" 
                              placeholder="password" 
                              value ={LoginPassword} 
                              onIonChange={(event)=>setLoginPassword(event.detail.value)}
            /></IonCol>
          </IonRow>
          <IonRow>
          <IonCol>
            {status.error && 
             <IonText color="danger">{errorMessage}</IonText>
            }
            </IonCol>
          </IonRow>
          <IonRow>
          <IonCol><IonButton expand="full" color="primary" onClick={handleLogin}>Login</IonButton></IonCol>
          <IonCol><IonButton expand="full" color="secondary" routerLink="/pw-recovery">Forgot Password?</IonButton></IonCol>
          </IonRow>
          <IonRow>
            <IonCol><p>New account?</p></IonCol>
            <IonCol><IonButton expand="full" color="secondary" routerLink="/registration">Registration</IonButton></IonCol>
          </IonRow>
          <IonLoading isOpen={status.loading}></IonLoading>
        </IonContent>
    </IonPage>
  );
};

export default Login;
