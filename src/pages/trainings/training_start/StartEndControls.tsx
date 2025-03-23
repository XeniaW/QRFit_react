import React, { useState } from 'react';
import { IonButton, IonAlert } from '@ionic/react';

interface StartEndControlsProps {
  isRunning: boolean;
  showStartAlert: boolean;
  setShowStartAlert: React.Dispatch<React.SetStateAction<boolean>>;
  showEndAlert: boolean;
  setShowEndAlert: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartTraining: () => void;
  handleEndTraining: () => void;
  // NOTE: Added optional `routineName` param so the parent can save the routine
  confirmEndTraining: (
    shouldEnd: boolean,
    isCancel?: boolean,
    routineName?: string
  ) => void;
}

const StartEndControls: React.FC<StartEndControlsProps> = ({
  isRunning,
  showStartAlert,
  setShowStartAlert,
  showEndAlert,
  setShowEndAlert,
  handleStartTraining,
  handleEndTraining,
  confirmEndTraining,
}) => {
  // Second alert for naming the routine
  const [showRoutineNameAlert, setShowRoutineNameAlert] = useState(false);

  return (
    <>
      {!isRunning && (
        <IonButton onClick={() => setShowStartAlert(true)}>
          Start Training
        </IonButton>
      )}
      {isRunning && (
        <IonButton color="danger" expand="full" onClick={handleEndTraining}>
          End Training
        </IonButton>
      )}

      {/* Alert: Start Session */}
      <IonAlert
        isOpen={showStartAlert}
        onDidDismiss={() => setShowStartAlert(false)}
        header={'Are you ready to pump?'}
        buttons={[
          { text: 'No', role: 'cancel' },
          { text: 'Yes', handler: handleStartTraining },
        ]}
      />

      {/* Alert: End Session */}
      <IonAlert
        isOpen={showEndAlert}
        onDidDismiss={() => setShowEndAlert(false)}
        header={'What do you want to do?'}
        buttons={[
          {
            text: 'Continue Training',
            role: 'cancel',
            handler: () => confirmEndTraining(false, false),
          },
          {
            text: 'Save Training',
            handler: () => confirmEndTraining(true, false),
          },
          {
            text: 'Cancel Session',
            handler: () => confirmEndTraining(false, true),
          },
          {
            text: 'Save as Routine',
            handler: () => {
              // close the end-session alert, open the routine name alert
              setShowEndAlert(false);
              setShowRoutineNameAlert(true);
            },
          },
        ]}
      />

      {/* Alert: Name the Routine */}
      <IonAlert
        isOpen={showRoutineNameAlert}
        onDidDismiss={() => setShowRoutineNameAlert(false)}
        header="Name your routine"
        inputs={[
          {
            name: 'routineName',
            type: 'text',
            placeholder: 'e.g. My Leg Day',
          },
        ]}
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Save',
            handler: data => {
              // Pass the chosen name up to the parent so it can finalize & store the routine
              console.log('User typed routine name:', data.routineName);
              confirmEndTraining(true, false, data.routineName);
              setShowRoutineNameAlert(false);
            },
          },
        ]}
      />
    </>
  );
};

export default StartEndControls;
