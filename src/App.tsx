import { IonApp, IonLoading, IonRouterOutlet, IonSplitPane, IonTab, setupIonicReact, } from '@ionic/react';
import { IonReactRouter  } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { AuthContext } from "./auth";
import Menu from './components/Menu';
import Page from './pages/Page';
import Registration from './pages/registration/Registration';
import Login from './pages/login/Login'
import Home  from './pages/home/Home';
import PWRecovery from './pages/pw-recovery/PWRecovery';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import { useEffect, useState } from 'react';
import {onAuthStateChanged} from "firebase/auth";
import { auth } from './firebase';

setupIonicReact();




const App: React.FC = () => {
  const [authState, setAuthState] = useState({loading:true, loggedIn:false});
  useEffect(() => {
    onAuthStateChanged(auth,(currentUser) => {
      setAuthState({loading:false, loggedIn:Boolean(currentUser)});
      console.log(currentUser)
    });
  }, []); // remembers the authentication state even if the app reloads

  console.log(`rendering App with authState`, authState);
  if (authState.loading) {
    return <IonLoading isOpen />
  }
  return (
    <IonApp>
      <AuthContext.Provider value ={{loggedIn: authState.loggedIn}}>
      <IonReactRouter>
        <IonSplitPane contentId="main">
          <IonRouterOutlet id="main">
            <Route exact path="/" component={Home} />
            <Route exact path="/login">
              <Login />   
              </Route>
            <Route exact path="/registration" component={Registration}  />
            <Route exact path="/pw-recovery" component={PWRecovery}  />
          </IonRouterOutlet>
        </IonSplitPane>
      </IonReactRouter>
      </AuthContext.Provider>
    </IonApp>
  );
};

export default App;