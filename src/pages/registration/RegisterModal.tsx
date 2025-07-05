import {
  IonRow,
  IonCol,
  IonInput,
  IonText,
  IonLoading,
  IonButton,
  IonCheckbox,
  IonLabel,
} from '@ionic/react';
import { Redirect } from 'react-router';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../auth';

const RegisterModal: React.FC = () => {
  const { loggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notRobot, setNotRobot] = useState(false);

  const [status, setStatus] = useState({ loading: false, error: false });
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (!notRobot) {
      setErrorMessage('Please confirm you are not a robot.');
      setStatus({ loading: false, error: true });
      return;
    }
    if (password !== confirm) {
      setErrorMessage('Passwords do not match.');
      setStatus({ loading: false, error: true });
      return;
    }

    try {
      setStatus({ loading: true, error: false });
      await createUserWithEmailAndPassword(auth, email, password);
      setStatus({ loading: false, error: false });
    } catch (error) {
      setStatus({ loading: false, error: true });
      setErrorMessage(
        error instanceof Error ? error.message : 'Register failed'
      );
    }
  };

  if (loggedIn) return <Redirect to="/my/training" />;

  return (
    <>
      <IonRow>
        <IonCol>
          <IonInput
            placeholder="Email"
            type="email"
            value={email}
            onIonChange={e => setEmail(e.detail.value!)}
          />
        </IonCol>
      </IonRow>

      <IonRow>
        <IonCol>
          <IonInput
            placeholder="Password"
            type="password"
            value={password}
            onIonChange={e => setPassword(e.detail.value!)}
          />
        </IonCol>
      </IonRow>

      <IonRow>
        <IonCol>
          <IonInput
            placeholder="Confirm Password"
            type="password"
            value={confirm}
            onIonChange={e => setConfirm(e.detail.value!)}
          />
        </IonCol>
      </IonRow>

      <IonRow>
        <IonCol className="ion-align-items-center ion-justify-content-start">
          <IonCheckbox
            checked={notRobot}
            onIonChange={e => setNotRobot(e.detail.checked)}
          />
          <IonLabel className="ion-padding-start">I am not a robot</IonLabel>
        </IonCol>
      </IonRow>

      {status.error && (
        <IonRow>
          <IonCol>
            <IonText color="danger">{errorMessage}</IonText>
          </IonCol>
        </IonRow>
      )}

      <IonRow>
        <IonCol>
          <IonButton expand="full" onClick={handleRegister}>
            Register
          </IonButton>
        </IonCol>
      </IonRow>

      <IonLoading isOpen={status.loading} />
    </>
  );
};

export default RegisterModal;
