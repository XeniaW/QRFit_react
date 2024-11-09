import { IonRow,IonCol, IonContent,IonButton,IonAlert, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useState } from 'react';
import { useHistory } from 'react-router';
import './Training.css';


const Training: React.FC = () => {
  const [showAlert, setShowAlert] = useState(false);
  const history = useHistory();
  
  const handleStartTraining = () => {
    setShowAlert(true);
  };

  const handleConfirmStartTraining = () => {
    setShowAlert(false);
    history.push('/my/trainingstart');
  };

  return (
    <IonPage> 
      <IonContent fullscreen>       
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Training</IonTitle>
          </IonToolbar>
        </IonHeader>
 
          <IonRow>
            <IonCol className="ion-padding-top">
            <img src="/assets/sil.png" alt={"MainImage"} />
            </IonCol>    
          </IonRow>
          <IonRow>
            <IonCol> 
              <IonButton expand="full" color="light" onClick={handleStartTraining}>
              Start Training
              </IonButton>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol><IonButton expand="full" color="light" routerLink="/my/sessions">View All Trainings</IonButton></IonCol>
          </IonRow>
          <IonRow>
            <IonCol><IonButton expand="full" color="light" routerLink="/my/machines">Browse Machines</IonButton></IonCol>
          </IonRow>
          <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header={'Start Training'}
          message={'Are you sure you want to start a new training session?'}
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
              cssClass: 'secondary',
              handler: () => {
                setShowAlert(false);
              }
            },
            {
              text: 'Yes',
              handler: handleConfirmStartTraining
            }
          ]}
        />

        </IonContent>
    </IonPage>
  );
};

export default Training;
