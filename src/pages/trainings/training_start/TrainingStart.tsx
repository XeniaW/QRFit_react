import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonIcon,
  IonAlert,
  IonAccordionGroup,
  IonAccordion,
  IonLabel,
} from '@ionic/react';
import { trash, add, remove } from 'ionicons/icons';
import { formatTime, addSet, removeSet } from '../utils/TrainingSessionUtils';
import { startQRScan, handleAddMachineById } from '../services/QRScannerService';
import {
  startSession,
  endSession,
  addMachineSession,
  deleteMachineSession,
} from '../services/TrainingSessionService';
import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import { Machines, MachineSession } from '../../../datamodels';
import TextModal from '../add_machines/modal/TextModal';
import './TrainingStart.css';
import { useAuth } from '../../../auth';

const StartTrainingSession: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [machineSessions, setMachineSessions] = useState<MachineSession[]>([]);
  const [showMachinesList, setShowMachinesList] = useState(false);
  const [showStartAlert, setShowStartAlert] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machines | null>(null);
  const { userId } = useAuth();

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive) {
      interval = setInterval(() => setTimer((prevTimer) => prevTimer + 1), 1000);
    }
    return () => interval && clearInterval(interval);
  }, [sessionActive]);

  const handleMachineSelection = async (machine: Machines) => {
    if (!sessionId) return;

    try {
      setSelectedMachine(machine);
      setShowMachinesList(false); // Hide machine list
      setShowTextModal(true); // Open text modal
    } catch (error) {
      console.error('Error selecting machine:', error);
    }
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

  const handleQRScan = async () => {
    setIsScanning(true);
    const machineId = await startQRScan();
    if (machineId) {
      const machine = await handleAddMachineById(machineId);
      if (machine) handleMachineSelection(machine);
    }
    setIsScanning(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{sessionActive ? `Session Time: ${formatTime(timer)}` : 'Training Session'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonButton
          color="danger"
          expand="full"
          onClick={() => endSession(sessionId, setSessionActive, setMachineSessions)}
          disabled={!sessionActive}
        >
          End Session
        </IonButton>
        <IonButton onClick={() => setShowStartAlert(true)} disabled={sessionActive}>
          Start Training
        </IonButton>
        <IonAlert
          isOpen={showStartAlert}
          onDidDismiss={() => setShowStartAlert(false)}
          header={'Are you ready to pump?'}
          buttons={[
            { text: 'No', role: 'cancel' },
            { text: 'Yes', handler: () => startSession(userId!, setSessionId, setSessionActive, setTimer) },
          ]}
        />

        {sessionActive && (
          <>
            <IonButton onClick={() => setShowMachinesList(true)}>Add Machines from the List</IonButton>
            <IonButton onClick={handleQRScan}>Scan QR Code</IonButton>
          </>
        )}

        {showMachinesList && <AddMachinesFromTheList onSelectMachine={handleMachineSelection} />}

        {isScanning && <div className="camera-overlay">Scanning...</div>}

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
                    deleteMachineSession(session.id, sessionId, machineSessions, setMachineSessions)
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
          onConfirm={selectedSessionIndex !== null ? handleAddSetToSession : handleTextModalConfirm}
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
