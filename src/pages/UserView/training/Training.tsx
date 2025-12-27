import {
  IonRow,
  IonCol,
  IonContent,
  IonButton,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonText,
  IonIcon,
  IonAlert,
} from '@ionic/react';
import React, { useState } from 'react';
import { add, clipboardOutline, personCircleOutline } from 'ionicons/icons';
import { useAuth } from '../../../auth';
import TrainingSessionsWidget from '../../trainings/training_sessions/TrainingSessionsWidget';
import { useHistory } from 'react-router-dom';

import './Training.css';

const Training: React.FC = () => {
  const { email } = useAuth();
  const history = useHistory();

  const [showStartPrompt, setShowStartPrompt] = useState(false);

  const name =
    (email && email.includes('@') ? email.split('@')[0] : '') || 'Guest';

  const handleNewWorkoutClick = () => {
    setShowStartPrompt(true);
  };

  const handleConfirmStart = () => {
    setShowStartPrompt(false);
    history.push('/my/trainingstart?autostart=1');
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '0 12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/assets/pl_icon/icon_nf_matt.png"
                alt="Pawer Lifting"
                style={{ height: 50, width: 'auto', display: 'block' }}
              />
              <IonTitle size="small" style={{ padding: 0 }}>
                Hi, <b>{name}</b>! Ready for a workout?
              </IonTitle>
            </div>

            <IonButton
              shape="round"
              fill="clear"
              aria-label="Account"
              routerLink="/my/account"
            >
              <IonIcon icon={personCircleOutline} slot="icon-only" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="training-content">
        <IonRow className="ion-padding">
          <IonCol size="12">
            <IonCard className="welcome-card">
              <IonCardContent className="welcome-card__content">
                <div className="welcome-card__left">
                  <img
                    src="/assets/pl_icon/icon_f_matt.png"
                    alt="PL"
                    className="welcome-card__logo"
                  />
                </div>

                <div className="welcome-card__text">
                  <IonText>
                    <div className="welcome-card__subtitle">Welcome back,</div>
                    <div className="welcome-card__title">{name}</div>
                    <div className="welcome-card__desc">
                      Support local animal shelters!
                    </div>
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="ion-padding" style={{ paddingTop: 0 }}>
          <IonCol size="6">
            <IonCard
              className="quick-card"
              button
              onClick={handleNewWorkoutClick}
            >
              <IonCardContent className="quick-card__content">
                <div className="quick-card__text">
                  <div className="quick-card__title">New workout</div>
                </div>

                <IonButton
                  shape="round"
                  fill="solid"
                  color="primary"
                  className="quick-card__roundbtn"
                  aria-label="New workout"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNewWorkoutClick();
                  }}
                >
                  <IonIcon icon={add} slot="icon-only" />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="6">
            <IonCard className="quick-card" button routerLink="/my/routines">
              <IonCardContent className="quick-card__content">
                <div className="quick-card__text">
                  <div className="quick-card__title">Routines</div>
                </div>

                <IonButton
                  shape="round"
                  fill="solid"
                  color="primary"
                  className="quick-card__roundbtn"
                  aria-label="Routines"
                >
                  <IonIcon icon={clipboardOutline} slot="icon-only" />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="ion-padding" style={{ paddingTop: 0 }}>
          <IonCol size="12">
            <IonCard className="advisor-card">
              <IonCardContent className="advisor-card__content">
                <div className="advisor-card__text">
                  <div className="advisor-card__title">Muscle Advisor</div>
                  <div className="advisor-card__desc">
                    Get a workout suggestion based on your goal.
                  </div>
                </div>

                <IonButton
                  shape="round"
                  fill="solid"
                  color="light"
                  routerLink="/my/advisor"
                >
                  Try now
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow className="ion-padding" style={{ paddingTop: 0 }}>
          <IonCol size="12">
            <TrainingSessionsWidget variant="preview" />
          </IonCol>
        </IonRow>

        {/* Start prompt */}
        <IonAlert
          isOpen={showStartPrompt}
          onDidDismiss={() => setShowStartPrompt(false)}
          header="Are you ready to pump?"
          buttons={[
            { text: 'No', role: 'cancel' },
            { text: 'Yes', handler: handleConfirmStart },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Training;
