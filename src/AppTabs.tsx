import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  barbell as barbellIcon,
  settings as settingsIcon,
  statsChart as statsChartIcon,
  body as bodyIcon,
} from 'ionicons/icons';
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import { useAuth } from './auth';
import Training from './pages/UserView/training/Training';
import Statistics from './pages/UserView/statistics/Statistics';
import Settings from './pages/UserView/settings/Settings';
import Advisor from './pages/UserView/advisor/Advisor';
import MachineList from './pages/machines/MachineList';
import MachineItem from './pages/machines/machine_item/MachineItem';
import StartTrainingSession from './pages/trainings/training_start/TrainingStart';
import TrainingSessions from './pages/trainings/training_sessions/TrainingSessions';
import TrainingSessionDetails from './pages/trainings/training_session/TrainingSessionDetails';
import RoutineList from './pages/routines/routine_list/RoutinesList';
import RoutineDetails from './pages/routines/routine_details/RoutineDetails';
import Highscore from './pages/statistics/highscore/Highscore';
import CalendarWidget from './pages/statistics/calendar/CalendarWidget';

const AppTabs: React.FC = () => {
  const { loggedIn } = useAuth();
  if (!loggedIn) {
    return <Redirect to="/" />;
  }
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/my/training">
          <Training />
        </Route>
        <Route exact path="/my/trainingstart">
          <StartTrainingSession />
        </Route>
        <Route exact path="/my/statistics">
          <Statistics />
        </Route>
        <Route exact path="/my/statistics/highscore">
          <Highscore />
        </Route>
        <Route exact path="/my/calendar">
          <CalendarWidget />
        </Route>
        <Route exact path="/my/machines/">
          <MachineList />
        </Route>
        <Route exact path="/my/machines/:id">
          <MachineItem />
        </Route>
        <Route exact path="/my/sessions/">
          <TrainingSessions />
        </Route>
        <Route exact path="/my/sessions/:id">
          <TrainingSessionDetails />
        </Route>
        <Route exact path="/my/routines/">
          <RoutineList />
        </Route>
        <Route exact path="/my/routines/:id">
          <RoutineDetails />
        </Route>
        <Route exact path="/my/settings">
          <Settings />
        </Route>
        <Route exact path="/my/advisor">
          <Advisor />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="training" href="/my/training">
          <IonIcon icon={barbellIcon} />
          <IonLabel>Training</IonLabel>
        </IonTabButton>
        <IonTabButton tab="statistics" href="/my/statistics">
          <IonIcon icon={statsChartIcon} />
          <IonLabel>Statistics</IonLabel>
        </IonTabButton>
        <IonTabButton tab="advisor" href="/my/advisor">
          <IonIcon icon={bodyIcon} />
          <IonLabel>Advisor</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/my/settings">
          <IonIcon icon={settingsIcon} />
          <IonLabel>Settings</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

export default AppTabs;
