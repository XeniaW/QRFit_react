import { IonApp, IonLoading, setupIonicReact } from '@ionic/react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { AuthContext } from './auth';
import { IonReactRouter } from '@ionic/react-router';

import Registration from './pages/registration/Registration';
import Login from './pages/login/Login';
import Home from './pages/home/Home';
import AppTabs from './AppTabs';
import GlobalTimerHeader from './components/timer/GlobalTimerHeader'; // Import global timer header

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import { TimerProvider } from './contexts/TimerContext'; // Import Timer Provider

setupIonicReact();

const App: React.FC = () => {
  const [authState, setAuthState] = useState<{
    loading: boolean;
    loggedIn: boolean;
    userId: string | null;
    email: string | null;
  }>({
    loading: true,
    loggedIn: false,
    userId: null,
    email: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      if (currentUser) {
        setAuthState({
          loading: false,
          loggedIn: true,
          userId: currentUser.uid,
          email: currentUser.email || null,
        });
      } else {
        setAuthState({
          loading: false,
          loggedIn: false,
          userId: null,
          email: null,
        });
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  if (authState.loading) {
    return <IonLoading isOpen />;
  }

  return (
    <IonApp>
      <TimerProvider>
        {' '}
        {/* Wrap entire app in TimerProvider */}
        <GlobalTimerHeader /> {/* Display global timer in header */}
        <AuthContext.Provider
          value={{
            loggedIn: authState.loggedIn,
            userId: authState.userId,
            email: authState.email,
          }}
        >
          <IonReactRouter>
            <Switch>
              <Route exact path="/" component={Home} />
              <Route exact path="/login">
                <Login />
              </Route>
              <Route exact path="/registration">
                <Registration />
              </Route>
              <Route path="/my">
                <AppTabs />
              </Route>
              <Redirect exact path="/" to="/my/training" />
            </Switch>
          </IonReactRouter>
        </AuthContext.Provider>
      </TimerProvider>
    </IonApp>
  );
};

export default App;
