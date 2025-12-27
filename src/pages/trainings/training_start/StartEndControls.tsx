import React from 'react';
import { IonButton, IonAlert } from '@ionic/react';

interface StartEndControlsProps {
  isRunning: boolean;
  showStartAlert: boolean;
  setShowStartAlert: (b: boolean) => void;
  showEndAlert: boolean;
  setShowEndAlert: (b: boolean) => void;
  handleStartTraining: () => void;
  handleEndTraining: () => void;
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
  const [showRoutineNameAlert, setShowRoutineNameAlert] = React.useState(false);

  return (
    <>
      {/* Start button removed. Only show End when running */}
      {isRunning && (
        <IonButton color="danger" expand="full" onClick={handleEndTraining}>
          End Training
        </IonButton>
      )}

      {/* Alert: Start Session (kept for compatibility, can still be triggered externally if you want) */}
      <IonAlert
        isOpen={showStartAlert}
        onDidDismiss={() => setShowStartAlert(false)}
        header="Are you ready to pump?"
        buttons={[
          { text: 'No', role: 'cancel' },
          { text: 'Yes', handler: handleStartTraining },
        ]}
      />

      {/* Alert: End Session */}
      <IonAlert
        isOpen={showEndAlert}
        onDidDismiss={() => setShowEndAlert(false)}
        header="What do you want to do?"
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
        ]}
      />
    </>
  );
};

export default StartEndControls;
