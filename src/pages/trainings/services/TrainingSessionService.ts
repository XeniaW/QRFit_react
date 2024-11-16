import { firestore } from '../../../firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Machines, MachineSession } from '../../../datamodels';

export const startSession = async (setSessionId: any, setSessionActive: any, setTimer: any) => {
  try {
    const start_date = Timestamp.now();
    const trainingSession = { start_date, end_date: null, machine_sessions: [] };
    const docRef = await addDoc(collection(firestore, 'training_sessions'), trainingSession);
    setSessionId(docRef.id);
    setSessionActive(true);
    setTimer(0);
  } catch (e) {
    console.error('Error starting training session: ', e);
  }
};

export const endSession = async (sessionId: string | null, setSessionActive: any, setMachineSessions: any) => {
  if (sessionId) {
    try {
      const end_date = Timestamp.now();
      const sessionRef = doc(firestore, 'training_sessions', sessionId);
      await updateDoc(sessionRef, { end_date });
      setSessionActive(false);
      setMachineSessions([]);
    } catch (e) {
      console.error('Error ending training session: ', e);
    }
  }
};

export const addMachineSession = async (
  sessionId: string | null,
  machine: Machines,
  reps: number,
  weight: number,
  machineSessions: MachineSession[],
  setMachineSessions: any
) => {
  if (!sessionId) return;
  const existingSessionIndex = machineSessions.findIndex((session) => session.machine_ref.id === machine.id);

  const newSet = { set_number: existingSessionIndex !== -1 ? machineSessions[existingSessionIndex].sets.length + 1 : 1, reps, weight };

  if (existingSessionIndex !== -1) {
    const existingSession = machineSessions[existingSessionIndex];
    const updatedSets = [...existingSession.sets, newSet];

    try {
      const sessionRef = doc(firestore, 'machine_sessions', existingSession.id);
      await updateDoc(sessionRef, { sets: updatedSets });

      setMachineSessions((prev: MachineSession[]) => {
        const updatedSessions = [...prev];
        updatedSessions[existingSessionIndex] = { ...existingSession, sets: updatedSets };
        return updatedSessions;
      });
    } catch (error) {
      console.error('Error updating machine session:', error);
    }
  } else {
    const machineSession = {
      training_session_id: sessionId,
      machine_ref: doc(firestore, 'machines', machine.id),
      date_used: Timestamp.now(),
      sets: [newSet],
    };

    try {
      const machineSessionRef = await addDoc(collection(firestore, 'machine_sessions'), machineSession);
      const sessionRef = doc(firestore, 'training_sessions', sessionId);
      await updateDoc(sessionRef, { machine_sessions: arrayUnion(machineSessionRef.id) });
      setMachineSessions((prev: MachineSession[]) => [...prev, { ...machineSession, id: machineSessionRef.id }]);
    } catch (error) {
      console.error('Error creating machine session:', error);
    }
  }
};

export const deleteMachineSession = async (
  uniqueId: string,
  sessionId: string | null,
  machineSessions: MachineSession[],
  setMachineSessions: any
) => {
  setMachineSessions((prevMachines: MachineSession[]) => prevMachines.filter((machine) => machine.id !== uniqueId));
  if (sessionId) {
    try {
      const sessionRef = doc(firestore, 'training_sessions', sessionId);
      await updateDoc(sessionRef, {
        machine_sessions: machineSessions.filter((machine) => machine.id !== uniqueId).map((machine) => machine.id),
      });
    } catch (e) {
      console.error('Error removing machine from session:', e);
    }
  }
};
