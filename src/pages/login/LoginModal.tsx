import {
  IonRow,
  IonCol,
  IonInput,
  IonText,
  IonLoading,
  IonButton,
} from '@ionic/react';
import { Redirect } from 'react-router';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../auth';
import { useHistory } from 'react-router';

const LoginModal: React.FC = () => {
  const { loggedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, error: false });
  const [errorMessage, setErrorMessage] = useState('');
  const history = useHistory();

  const handleLogin = async () => {
    try {
      setStatus({ loading: true, error: false });
      await signInWithEmailAndPassword(auth, email, password);
      setStatus({ loading: false, error: false });
    } catch (error) {
      setStatus({ loading: false, error: true });
      setErrorMessage(error instanceof Error ? error.message : 'Login failed');
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
          <IonText
            color="medium"
            style={{ cursor: 'pointer' }}
            onClick={() => history.push('/pw-recovery')}
          >
            Forgot password?
          </IonText>
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
          <IonButton expand="full" onClick={handleLogin}>
            Login
          </IonButton>
        </IonCol>
      </IonRow>

      <IonLoading isOpen={status.loading} />
    </>
  );
};

export default LoginModal;
