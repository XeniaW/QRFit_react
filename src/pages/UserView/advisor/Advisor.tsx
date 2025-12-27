import {
  IonRow,
  IonCol,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButton,
  IonIcon,
  IonCard,
  IonCardContent,
} from '@ionic/react';

import { personCircleOutline, listOutline, cubeOutline } from 'ionicons/icons';

import './Advisor.css';

const Advisor: React.FC = () => {
  return (
    <IonPage>
      <IonContent fullscreen>
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
                <strong>Muscle Advisor</strong>
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

        {/* QUICK ACTION CARDS */}
        <IonRow className="ion-padding">
          <IonCol size="6">
            <IonCard className="quick-card" routerLink="/my/machines" button>
              <IonCardContent className="quick-card__content">
                <div>
                  <div className="quick-card__title">List</div>
                </div>

                <IonButton
                  shape="round"
                  fill="solid"
                  color="primary"
                  className="quick-card__roundbtn"
                  aria-label="Machine List"
                >
                  <IonIcon icon={listOutline} slot="icon-only" />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="6">
            <IonCard className="quick-card" routerLink="/modell" button>
              <IonCardContent className="quick-card__content">
                <div>
                  <div className="quick-card__title">3D Model</div>
                </div>

                <IonButton
                  shape="round"
                  fill="solid"
                  color="primary"
                  className="quick-card__roundbtn"
                  aria-label="3D Model"
                >
                  <IonIcon icon={cubeOutline} slot="icon-only" />
                </IonButton>
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>
      </IonContent>
    </IonPage>
  );
};

export default Advisor;
