import { IonRow,IonCol, IonContent,IonButton,IonAlert, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useState } from 'react';
import './Training.css';


const Training: React.FC = () => {
  

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
              <IonButton expand="full" color="light" routerLink="/my/trainingstart">
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

        </IonContent>
    </IonPage>
  );
};

export default Training;
