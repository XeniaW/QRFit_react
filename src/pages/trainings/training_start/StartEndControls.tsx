import React from 'react';
import { IonButton, IonAlert } from '@ionic/react';

interface StartEndControlsProps {
  isRunning: boolean;
  showStartAlert: boolean;
  setShowStartAlert: React.Dispatch<React.SetStateAction<boolean>>;
  showEndAlert: boolean;
  setShowEndAlert: React.Dispatch<React.SetStateAction<boolean>>;
  handleStartTraining: () => void;
  handleEndTraining: () => void;
  confirmEndTraining: (shouldEnd: boolean) => void;
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
        header={'Are you proud of yourself?'}
        buttons={[
          {
            text: 'No',
            role: 'cancel',
            handler: () => confirmEndTraining(false),
          },
          { text: 'Yes', handler: () => confirmEndTraining(true) },
        ]}
      />
    </>
  );
};

export default StartEndControls;
