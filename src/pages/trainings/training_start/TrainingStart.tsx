import React, { useState, useEffect } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonIcon, IonModal, IonAlert } from '@ionic/react';
import { firestore } from '../../../firebase';
import { collection, addDoc, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import { v4 as uuidv4 } from 'uuid';
import { trash } from 'ionicons/icons';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { formatTime } from '../TrainingSessionUtils';

const StartTrainingSession: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [machines, setMachines] = useState<any[]>([]);
  const [showMachinesList, setShowMachinesList] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showStartAlert, setShowStartAlert] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (sessionActive) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [sessionActive]);

  const startTrainingSession = async () => {
    try {
      const start_date = Timestamp.now();
      const trainingSession = {
        start_date,
        end_date: null,
        machines: [],
      };
      const docRef = await addDoc(collection(firestore, 'training_sessions'), trainingSession);
      setSessionId(docRef.id);
      setSessionActive(true);
      setTimer(0);
    } catch (e) {
      console.error("Error starting training session: ", e);
    }
  };

  const endTrainingSession = async () => {
    if (sessionId) {
      try {
        const end_date = Timestamp.now();
        const sessionRef = doc(firestore, 'training_sessions', sessionId);
        await updateDoc(sessionRef, { end_date });
        setSessionActive(false);
        setMachines([]);
      } catch (e) {
        console.error("Error ending training session: ", e);
      }
    }
  };

  const handleSelectMachine = async (machine: any) => {
    if (sessionId) {
      const uniqueMachine = { ...machine, uniqueId: uuidv4() };
      setMachines(prevMachines => [...prevMachines, uniqueMachine]);

      try {
        const sessionRef = doc(firestore, 'training_sessions', sessionId);
        await updateDoc(sessionRef, {
          machines: machines.map(m => doc(firestore, 'machines', m.id)).concat(doc(firestore, 'machines', machine.id))
        });
      } catch (e) {
        console.error("Error adding machine to session: ", e);
      }

      setShowMachinesList(false);
    }
  };

  const handleQRScan = async () => {
    try {
      setShowQRScanner(true);
      await BarcodeScanner.checkPermission({ force: true });
      BarcodeScanner.hideBackground();

      const result = await BarcodeScanner.startScan(); // Scan QR code
      if (result.hasContent) {
        const machineId = result.content;
        handleAddMachineById(machineId); // Fetch and add machine
      }
      setShowQRScanner(false);
    } catch (e) {
      console.error("QR Scan failed: ", e);
      setShowQRScanner(false);
    }
  };

  const handleAddMachineById = async (machineId: string) => {
    if (sessionId) {
      try {
        const machineRef = doc(firestore, 'machines', machineId);
        const machineSnap = await getDoc(machineRef);
        if (machineSnap.exists()) {
          const machine = { id: machineId, ...machineSnap.data() };
          handleSelectMachine(machine);
        } else {
          console.error("No such machine!");
        }
      } catch (e) {
        console.error("Error fetching machine:", e);
      }
    }
  };

  const handleDeleteMachine = async (uniqueId: string, machineId: string) => {
    setMachines(prevMachines => prevMachines.filter(machine => machine.uniqueId !== uniqueId));
    if (sessionId) {
      try {
        const sessionRef = doc(firestore, 'training_sessions', sessionId);
        await updateDoc(sessionRef, {
          machines: machines.filter(machine => machine.uniqueId !== uniqueId).map(machine => doc(firestore, 'machines', machine.id))
        });
      } catch (e) {
        console.error("Error removing machine from session: ", e);
      }
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>
            {sessionActive ? `Session Time: ${formatTime(timer)}` : 'Training Session'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {!sessionActive ? (
          <>
            <IonButton onClick={() => setShowStartAlert(true)}>Start Training</IonButton>
            <IonAlert
              isOpen={showStartAlert}
              onDidDismiss={() => setShowStartAlert(false)}
              header={'Are you ready to pump?'}
              buttons={[
                { text: 'No', role: 'cancel' },
                { text: 'Yes', handler: () => startTrainingSession() }
              ]}
            />
          </>
        ) : (
          <>
            <IonButton color="danger" onClick={endTrainingSession}>End Session</IonButton>
            <IonButton onClick={() => setShowMachinesList(!showMachinesList)}>Add Machines from the List</IonButton>
            <IonButton onClick={handleQRScan}>Scan QR Code</IonButton>
          </>
        )}
        {showMachinesList && <AddMachinesFromTheList onSelectMachine={handleSelectMachine} />}
        <IonList>
          {machines.map(machine => (
            <IonItem key={machine.uniqueId}>
              {machine.title}
              <IonIcon icon={trash} slot="end" onClick={() => handleDeleteMachine(machine.uniqueId, machine.id)} />
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default StartTrainingSession;
