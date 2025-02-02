import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonAlert,
  IonAccordionGroup,
  IonAccordion,
  IonItem,
  IonIcon,
  IonLabel,
  IonButtons,
} from '@ionic/react';
import { trash, add, remove } from 'ionicons/icons';
import {
  formatTime,
  addSet,
  removeSet,
} from '../../../utils/TrainingSessionUtils';
import {
  startQRScan,
  handleAddMachineById,
} from '../../../services/QRScannerService';
import {
  startSession,
  endSession,
  addMachineSession,
  deleteMachineSession,
} from '../../../services/TrainingSessionService';
import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import { Machines, MachineSession } from '../../../datamodels';
import { doc } from 'firebase/firestore'; // Firestore doc utility
import TextModal from '../add_machines/modal/TextModal';
import { useAuth } from '../../../auth';
import { useTimer } from '../../../contexts/TimerContext';
import { firestore } from '../../../firebase';
import './TrainingStart.css';
import { usePageTitle } from '../../../contexts/usePageTitle';

const StartTrainingSession: React.FC = () => {
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle('Start Training'); // Set title dynamically
  }, []);
  const { timer, isRunning, startTimer, stopTimer, resetTimer } = useTimer();
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId')
  );
  const [machineSessions, setMachineSessions] = useState<MachineSession[]>(
    () => {
      const storedSessions = localStorage.getItem('machineSessions');
      if (!storedSessions) return [];
      const parsedSessions = JSON.parse(storedSessions);
      // Restore Firestore references
      return parsedSessions.map((session: any) => ({
        ...session,
        machine_ref: doc(firestore, 'machines', session.machine_ref.id), // Recreate DocumentReference
      }));
    }
  );
  const [showMachinesList, setShowMachinesList] = useState(false);
  const [showStartAlert, setShowStartAlert] = useState(false);
  const [showEndAlert, setShowEndAlert] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<
    number | null
  >(null);
  const [selectedMachine, setSelectedMachine] = useState<Machines | null>(null);
  const { userId } = useAuth();

  // Persist sessionId to localStorage
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  }, [sessionId]);

  // Persist machineSessions to localStorage
  useEffect(() => {
    const serializedSessions = machineSessions.map(session => ({
      ...session,
      machine_ref: { id: session.machine_ref.id }, // Only store the machine ID
    }));
    localStorage.setItem('machineSessions', JSON.stringify(serializedSessions));
  }, [machineSessions]);

  useEffect(() => {
    // Reset UI state on mount
    setShowMachinesList(false);
    setShowTextModal(false);
    setSelectedMachine(null);
  }, []);

  const handleStartTraining = () => {
    startSession(
      userId!,
      setSessionId,
      () => {},
      () => {}
    );
    startTimer();
    setShowStartAlert(false);
  };

  const handleEndTraining = () => {
    if (!sessionId) {
      console.error('Session ID is null. Cannot end session.');
      return;
    }
    setShowEndAlert(true);
  };

  const confirmEndTraining = (shouldEnd: boolean) => {
    if (shouldEnd) {
      if (!sessionId) {
        console.error('Session ID is null. Cannot end session.');
        return;
      }
      endSession(sessionId, () => {}, setMachineSessions);
      stopTimer();
      resetTimer();
      setSessionId(null); // Clear session ID
      localStorage.removeItem('sessionId'); // Clear persisted session ID
      localStorage.removeItem('machineSessions'); // Clear persisted machine sessions
    }
    setShowEndAlert(false);
  };

  const handleMachineSelection = async (machine: Machines) => {
    if (!sessionId) {
      console.error('Session ID is null. Cannot add machine.');
      return;
    }

    // Prevent duplicate machine sessions
    const machineAlreadyAdded = machineSessions.some(
      session => session.machine_ref.id === machine.id
    );
    if (machineAlreadyAdded) {
      console.warn(`Machine with ID ${machine.id} is already added.`);
      return;
    }

    try {
      setSelectedMachine(machine);
      setShowMachinesList(false);
      setShowTextModal(true); // Open modal for reps/weight input
    } catch (error) {
      console.error('Error selecting machine:', error);
    }
  };

  const handleTextModalConfirm = async (reps: number, weight: number) => {
    if (selectedMachine && sessionId) {
      try {
        await addMachineSession(
          userId!,
          sessionId,
          selectedMachine,
          reps,
          weight,
          machineSessions,
          setMachineSessions
        );
        setSelectedMachine(null);
      } catch (error) {
        console.error('Error adding machine session:', error);
      }
    }
    setShowTextModal(false);
  };

  const handleAddSetToSession = async (reps: number, weight: number) => {
    if (selectedSessionIndex !== null && sessionId) {
      const machineSessionId = machineSessions[selectedSessionIndex].id;

      try {
        const updatedSessions = await addSet(
          machineSessions,
          selectedSessionIndex,
          machineSessionId,
          reps,
          weight
        );
        setMachineSessions(updatedSessions);
      } catch (error) {
        console.error('Failed to add set:', error);
      }
    }

    setShowTextModal(false);
    setSelectedSessionIndex(null);
  };

  const handleRemoveSet = async (sessionIndex: number, setIndex: number) => {
    const machineSessionId = machineSessions[sessionIndex].id;

    try {
      const updatedSessions = await removeSet(
        machineSessions,
        sessionIndex,
        setIndex,
        machineSessionId
      );
      setMachineSessions(updatedSessions);
    } catch (error) {
      console.error('Failed to remove set:', error);
    }
  };

  const handleQRScan = async () => {
    setIsScanning(true);
    const machineId = await startQRScan();
    if (machineId) {
      const machine = await handleAddMachineById(machineId);
      if (machine) handleMachineSelection(machine);
    }
    setIsScanning(false);
  };

  const handleCancelQRScan = () => {
    setIsScanning(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {isRunning && (
            <IonButtons slot="end">
              <div style={{ fontWeight: 'bold' }}>{formatTime(timer)}</div>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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
        <IonAlert
          isOpen={showStartAlert}
          onDidDismiss={() => setShowStartAlert(false)}
          header={'Are you ready to pump?'}
          buttons={[
            { text: 'No', role: 'cancel' },
            { text: 'Yes', handler: handleStartTraining },
          ]}
        />
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

        {isRunning && (
          <>
            <IonButton onClick={() => setShowMachinesList(true)}>
              Add Machines from the List
            </IonButton>
            <IonButton onClick={handleQRScan}>Scan QR Code</IonButton>
          </>
        )}

        {showMachinesList && (
          <AddMachinesFromTheList onSelectMachine={handleMachineSelection} />
        )}

        {isScanning && (
          <div className="camera-overlay">
            <p>Scanning...</p>
            <IonButton
              className="cancel-button"
              color="light"
              onClick={handleCancelQRScan}
            >
              Cancel
            </IonButton>
          </div>
        )}

        <IonAccordionGroup>
          {machineSessions.map((session, sessionIndex) => (
            <IonAccordion key={session.id} value={session.id}>
              <IonItem slot="header" color="light">
                <IonLabel>
                  <strong>Machine:</strong> {session.machine_ref.id}
                </IonLabel>
                <IonIcon
                  icon={trash}
                  slot="end"
                  onClick={() =>
                    deleteMachineSession(
                      session.id,
                      sessionId!,
                      machineSessions,
                      setMachineSessions
                    )
                  }
                />
              </IonItem>
              <div className="ion-padding" slot="content">
                {session.sets.map((set, setIndex) => (
                  <IonItem key={set.set_number}>
                    <IonLabel>
                      Set {set.set_number}: {set.reps} reps, {set.weight} kg
                    </IonLabel>
                    <IonIcon
                      icon={remove}
                      slot="end"
                      onClick={() => handleRemoveSet(sessionIndex, setIndex)}
                    />
                  </IonItem>
                ))}
                <IonItem
                  button
                  onClick={() => {
                    setSelectedSessionIndex(sessionIndex);
                    setShowTextModal(true);
                  }}
                >
                  <IonLabel>Add New Set</IonLabel>
                  <IonIcon icon={add} slot="end" />
                </IonItem>
              </div>
            </IonAccordion>
          ))}
        </IonAccordionGroup>

        <TextModal
          isOpen={showTextModal}
          onConfirm={
            selectedSessionIndex !== null
              ? handleAddSetToSession
              : handleTextModalConfirm
          }
          onCancel={() => {
            setShowTextModal(false);
            setSelectedSessionIndex(null);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default StartTrainingSession;
