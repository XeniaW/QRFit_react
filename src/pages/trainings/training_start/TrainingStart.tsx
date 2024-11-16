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
import { startSession, endSession, addMachineSession, deleteMachineSession } from '../services/TrainingSessionService';
import PickerModal from '../add_machines/picker/PickerModal';
import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import { Machines, MachineSession } from '../../../datamodels';
import './TrainingStart.css';

const StartTrainingSession: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [machineSessions, setMachineSessions] = useState<MachineSession[]>([]);
  const [showMachinesList, setShowMachinesList] = useState(false); // Controls visibility of the machine list
  const [showStartAlert, setShowStartAlert] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [pickerType, setPickerType] = useState<'reps' | 'weight' | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<Machines | null>(null);
  const [pendingSession, setPendingSession] = useState<{ reps: number | null; weight: number | null }>({ reps: null, weight: null });

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
    setSelectedMachine(machine); // Set the selected machine
    setPickerType('reps'); // Trigger the PickerModal for reps
    setShowMachinesList(false); // Disable the machine list as soon as a machine is selected
  };

  const handlePickerConfirm = async (value: number) => {
    if (pickerType === 'reps') {
      setPendingSession((prev) => ({ ...prev, reps: value }));
      setPickerType('weight');
    } else if (pickerType === 'weight' && selectedMachine) {
      const updatedSession = { ...pendingSession, weight: value };
      await addMachineSession(sessionId, selectedMachine, updatedSession.reps!, updatedSession.weight!, machineSessions, setMachineSessions);
      setPickerType(null);
      setPendingSession({ reps: null, weight: null });
      setSelectedMachine(null); // Clear the selected machine
    }
  };

  const handleQRScan = async () => {
    setIsScanning(true);
    const machineId = await startQRScan();
    if (machineId) {
      const machine = await handleAddMachineById(machineId);
      if (machine) handleMachineSelection(machine); // Reuse machine selection logic
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

        {showMachinesList && (
          <AddMachinesFromTheList
            onSelectMachine={handleMachineSelection}
          />
        )}

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

        <PickerModal
          isOpen={pickerType !== null}
          pickerType={pickerType!}
          onConfirm={handlePickerConfirm}
          onCancel={() => {
            setPickerType(null);
            setShowMachinesList(false); // Disable the machine list if PickerModal is canceled
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default StartTrainingSession;
