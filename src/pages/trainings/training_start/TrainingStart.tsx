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
} from '@ionic/react';
import { trash } from 'ionicons/icons';
import { formatTime } from '../utils/TrainingSessionUtils';
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

const StartTrainingSession: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [machineSessions, setMachineSessions] = useState<MachineSession[]>([]);
  const [showMachinesList, setShowMachinesList] = useState(false);
  const [showStartAlert, setShowStartAlert] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false); // Track modal visibility
  const [selectedMachine, setSelectedMachine] = useState<Machines | null>(null);

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
    setSelectedMachine(machine);
    setShowMachinesList(false); // Hide machine list
    setShowTextModal(true); // Open text modal
  };

  const handleTextModalConfirm = async (reps: number, weight: number) => {
    if (selectedMachine && sessionId) {
      await addMachineSession(sessionId, selectedMachine, reps, weight, machineSessions, setMachineSessions);
      setSelectedMachine(null);
    }
    setShowTextModal(false); // Close modal
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
        <IonButton color="danger" expand="full" onClick={() => endSession(sessionId, setSessionActive, setMachineSessions)} disabled={!sessionActive}>
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
            { text: 'Yes', handler: () => startSession(setSessionId, setSessionActive, setTimer) },
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

        <IonList>
          {machineSessions.map((session) => (
            <IonItem key={session.id}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <div>
                  <strong>Machine:</strong> {session.machine_ref.id}
                </div>
                {session.sets.map((set) => (
                  <p key={set.set_number}>
                    Set {set.set_number}: {set.reps} reps, {set.weight} kg
                  </p>
                ))}
              </div>
              <IonIcon
                icon={trash}
                slot="end"
                onClick={() => deleteMachineSession(session.id, sessionId, machineSessions, setMachineSessions)}
              />
            </IonItem>
          ))}
        </IonList>

        <TextModal
          isOpen={showTextModal}
          onConfirm={handleTextModalConfirm}
          onCancel={() => setShowTextModal(false)}
        />
      </IonContent>
    </IonPage>
  );
};

export default StartTrainingSession;
