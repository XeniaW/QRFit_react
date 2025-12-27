import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonButton,
} from '@ionic/react';
import {
  barbellOutline,
  calendarOutline,
  personCircleOutline,
} from 'ionicons/icons';

import { HighscoreContent } from '../../statistics/highscore/Highscore';

import './Statistics.css';

const Statistics: React.FC = () => {
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
              <strong>Statistics</strong>
            </div>

            <IonButton
              shape="round"
              fill="clear"
              aria-label="Account"
              routerLink="/my/settings"
            >
              <IonIcon icon={personCircleOutline} slot="icon-only" />
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Embedded Highscore directly in the page */}
        <HighscoreContent />

        {/* Two quick-cards below */}
        <IonGrid style={{ padding: 16, paddingTop: 0 }}>
          <IonRow>
            <IonCol size="6">
              <IonCard className="quick-card" routerLink="/my/machines" button>
                <IonCardContent className="quick-card__content">
                  <div>
                    <div className="quick-card__title">Machines</div>
                  </div>
                  <IonButton
                    shape="round"
                    fill="solid"
                    color="primary"
                    className="quick-card__roundbtn"
                    aria-label="Machines"
                  >
                    <IonIcon icon={barbellOutline} slot="icon-only" />
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="6">
              <IonCard className="quick-card" routerLink="/my/calendar" button>
                <IonCardContent className="quick-card__content">
                  <div>
                    <div className="quick-card__title">Calendar</div>
                  </div>
                  <IonButton
                    shape="round"
                    fill="solid"
                    color="primary"
                    className="quick-card__roundbtn"
                    aria-label="Calendar"
                  >
                    <IonIcon icon={calendarOutline} slot="icon-only" />
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default Statistics;
