import { IonApp, IonLabel, IonLoading, IonRouterOutlet, IonSplitPane, IonTabBar,IonTabs, IonTabButton, setupIonicReact, } from '@ionic/react';
import { IonReactRouter  } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { AuthContext } from "./auth";

import Registration from './pages/registration/Registration';
import Login from './pages/login/Login'
import Home  from './pages/home/Home';
import PWRecovery from './pages/pw-recovery/PWRecovery';
import Training from './pages/UserView/training/Training';
import Statistics from './pages/UserView/statistics/Statistics';
import Settings from './pages/UserView/settings/Settings';
import Advisor from './pages/UserView/advisor/Advisor';
import Machines from './pages/machines/Machines';

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
      // console.log(currentUser)
      // if (authState.loggedIn == false) {
      //   console.log("not logged");
      // }
    });
  }, []); // remembers the authentication state even if the app reloads




  // console.log(`rendering App with authState`, authState);
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
            <Route exact path="/my/training" component={Training}  />
            <Route exact path="/my/statistics" component={Statistics}  />
            <Route exact path="/my/settings" component={Settings}  />
            <Route exact path="/my/advisor" component={Advisor}  />
            <Route exact path="/my/machines" component={Machines}  />
          </IonRouterOutlet>
        </IonSplitPane>
        { authState.loggedIn  == true &&      
             <IonTabBar slot="bottom">
                <IonTabButton tab="training" href="/my/training" >
               <IonLabel>Training</IonLabel>
               </IonTabButton>
               <IonTabButton tab="statistics" href="/my/statistics" >
               <IonLabel>Statistics</IonLabel>
               </IonTabButton>
               <IonTabButton tab="advisor" href="/my/advisor" >
               <IonLabel>Advisor</IonLabel>
               </IonTabButton>
               <IonTabButton tab="settings" href="/my/settings" >
               <IonLabel>Settings</IonLabel>
               </IonTabButton>
             </IonTabBar>
            }
          
      </IonReactRouter>
      </AuthContext.Provider>
    </IonApp>
  );
};

export default App;
