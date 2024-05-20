import React, { useState, useEffect } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonIcon } from '@ionic/react';
import { firestore } from '../../../firebase'; // Ensure correct import path
import { collection, addDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import AddMachinesFromTheList from '../add_machines/AddMachinesFromTheList'; // Ensure correct import path
import { v4 as uuidv4 } from 'uuid';
import { trash } from 'ionicons/icons';

const StartTrainingSession: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [machines, setMachines] = useState<any[]>([]);
  const [showMachinesList, setShowMachinesList] = useState(false);

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
      console.log("Training session started with ID: ", docRef.id);
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
        console.log("Training session ended with ID: ", sessionId);
        setSessionActive(false);
        setMachines([]); // Clear machines when session ends
      } catch (e) {
        console.error("Error ending training session: ", e);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          <IonButton onClick={startTrainingSession}>Start Training</IonButton>
        ) : (
          <>
            <IonButton color="danger" onClick={endTrainingSession}>End Session</IonButton>
            <IonButton onClick={() => setShowMachinesList(!showMachinesList)}>Add Machines from the List</IonButton>
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
