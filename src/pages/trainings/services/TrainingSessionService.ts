import { firestore } from '../../../firebase';
import { collection, addDoc, doc, updateDoc,deleteDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { Machines, MachineSession } from '../../../datamodels';


export const startSession = async (
  userId: string, // Pass userId as a parameter
  setSessionId: (id: string) => void,
  setSessionActive: (active: boolean) => void,
  setTimer: (time: number) => void
) => {
  if (!userId) {
    console.error("User is not authenticated.");
    return;
  }

  try {
    const session = {
      start_date: Timestamp.now(),
      end_date: null,
      machine_sessions: [],
      user_id: userId, // Associate session with the user
    };

    const docRef = await addDoc(collection(firestore, "training_sessions"), session);
    setSessionId(docRef.id);
    setSessionActive(true);
    setTimer(0);
    console.log(`Training session started for user ${userId} with ID ${docRef.id}`);
  } catch (error) {
    console.error("Error starting session:", error);
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
  userId: string, // Pass userId as a parameter
  sessionId: string,
  machine: Machines,
  reps: number,
  weight: number,
  machineSessions: MachineSession[],
  setMachineSessions: React.Dispatch<React.SetStateAction<MachineSession[]>>
) => {
  if (!userId) {
    console.error("User is not authenticated.");
    return;
  }

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
      user_id: userId, // Associate machine session with the user
    };

    try {
      const machineSessionRef = await addDoc(collection(firestore, 'machine_sessions'), machineSession);
      const sessionRef = doc(firestore, 'training_sessions', sessionId);
      await updateDoc(sessionRef, { machine_sessions: arrayUnion(machineSessionRef.id) });

      // Correct usage of setMachineSessions
      setMachineSessions((prev: MachineSession[]) => [...prev, { ...machineSession, id: machineSessionRef.id }]);
      console.log(`Machine session added for user ${machineSession.user_id} with ID ${machineSessionRef.id}`);
    } catch (error) {
      console.error('Error creating machine session:', error);
    }
  }
};


export const deleteMachineSession = async (
  uniqueId: string,
  sessionId: string | null,
  machineSessions: MachineSession[],
  setMachineSessions: React.Dispatch<React.SetStateAction<MachineSession[]>>
) => {
  // Update the local state
  setMachineSessions((prevMachines: MachineSession[]) =>
    prevMachines.filter((machine) => machine.id !== uniqueId)
  );

  if (sessionId) {
    try {
      // Update the training session document in Firestore
      const sessionRef = doc(firestore, "training_sessions", sessionId);
      const updatedMachineSessions = machineSessions
        .filter((machine) => machine.id !== uniqueId)
        .map((machine) => machine.id);

      await updateDoc(sessionRef, {
        machine_sessions: updatedMachineSessions,
      });

      // Delete the machine session document from Firestore
      const machineSessionRef = doc(firestore, "machine_sessions", uniqueId);
      await deleteDoc(machineSessionRef);

      console.log(`Machine session with ID ${uniqueId} deleted successfully.`);
    } catch (e) {
      console.error("Error removing machine session:", e);
    }
  }
};

