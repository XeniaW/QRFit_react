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
      {!isRunning ? (
        <IonButton onClick={() => setShowStartAlert(true)}>
          Start Training
        </IonButton>
      ) : (
        <IonButton color="danger" expand="full" onClick={handleEndTraining}>
          End Training
        </IonButton>
      )}

      {/* Alert: Start Session */}
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
          {
            text: 'Save as Routine',
            handler: () => {
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
          { name: 'routineName', type: 'text', placeholder: 'e.g. My Leg Day' },
        ]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Save',
            handler: data => {
              const name = data?.routineName?.trim() || '';
              console.log('routine saved with name ' + name);
              confirmEndTraining(true, false, name);
              setShowRoutineNameAlert(false);
            },
          },
        ]}
      />
    </>
  );
};

export default StartEndControls;
