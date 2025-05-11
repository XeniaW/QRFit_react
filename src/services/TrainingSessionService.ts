import { firestore } from '../firebase';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  Timestamp,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Machines, MachineSession } from '../datamodels';
import { getAuth } from 'firebase/auth';

export const startSession = async (
  userId: string,
  setSessionId: (id: string) => void,
  setSessionActive: (active: boolean) => void,
  setTimer: (time: number) => void
) => {
  if (!userId) {
    console.error('User is not authenticated. Cannot start session.');
    return;
  }

  try {
    const session = {
      start_date: Timestamp.now(),
      end_date: null,
      machine_sessions: [],
      user_id: userId,
    };

    const docRef = await addDoc(
      collection(firestore, 'training_sessions'),
      session
    );
    setSessionId(docRef.id);
    setSessionActive(true);
    setTimer(0);
    console.log(
      `Training session started for user ${userId} with ID ${docRef.id}`
    );
  } catch (error) {
    console.error('Error starting session:', error);
  }
};

export const endSession = async (
  sessionId: string | null,
  setSessionActive: (active: boolean) => void,
  setMachineSessions: React.Dispatch<React.SetStateAction<MachineSession[]>>
) => {
  if (!sessionId) {
    console.error('Session ID is null. Cannot end session.');
    return;
  }

  try {
    const end_date = Timestamp.now();
    const sessionRef = doc(firestore, 'training_sessions', sessionId);
    await updateDoc(sessionRef, { end_date });
    setSessionActive(false);
    setMachineSessions([]);
    console.log(`Training session with ID ${sessionId} ended.`);
  } catch (error) {
    console.error('Error ending training session:', error);
  }
};

export const addMachineSession = async (
  userId: string,
  sessionId: string,
  machine: Machines,
  exerciseName: string,
  reps: number,
  weight: number,
  machineSessions: MachineSession[],
  setMachineSessions: React.Dispatch<React.SetStateAction<MachineSession[]>>
) => {
  if (!userId) {
    console.error('User is not authenticated. Cannot add machine session.');
    return;
  }

  if (!sessionId) {
    console.error('Session ID is null. Cannot add machine session.');
    return;
  }

  const existingSessionIndex = machineSessions.findIndex(
    session =>
      session.machine_ref.id === machine.id &&
      session.exercise_name === exerciseName
  );

  const newSet = {
    set_number:
      existingSessionIndex !== -1
        ? machineSessions[existingSessionIndex].sets.length + 1
        : 1,
    reps,
    weight,
  };

  if (existingSessionIndex !== -1) {
    // If machine session already exists, update the sets
    const existingSession = machineSessions[existingSessionIndex];
    const updatedSets = [...existingSession.sets, newSet];

    try {
      const sessionRef = doc(firestore, 'machine_sessions', existingSession.id);
      await updateDoc(sessionRef, { sets: updatedSets });

      setMachineSessions(prev => {
        const updatedSessions = [...prev];
        updatedSessions[existingSessionIndex] = {
          ...existingSession,
          sets: updatedSets,
        };
        return updatedSessions;
      });

      console.log(`Updated machine session with ID ${existingSession.id}`);
    } catch (error) {
      console.error('Error updating machine session:', error);
    }
  } else {
    // If machine session does not exist, create a new one
    const machineSession = {
      training_session_id: sessionId,
      machine_ref: doc(firestore, 'machines', machine.id),
      exercise_name: exerciseName,
      date_used: Timestamp.now(),
      sets: [newSet],
      user_id: userId,
    };

    try {
      const machineSessionRef = await addDoc(
        collection(firestore, 'machine_sessions'),
        machineSession
      );
      const sessionRef = doc(firestore, 'training_sessions', sessionId);
      await updateDoc(sessionRef, {
        machine_sessions: arrayUnion(machineSessionRef.id),
      });

      setMachineSessions(prev => [
        ...prev,
        { ...machineSession, id: machineSessionRef.id },
      ]);

      console.log(`Created machine session with ID ${machineSessionRef.id}`);
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
  if (!uniqueId) {
    console.error('Machine session ID is null. Cannot delete machine session.');
    return;
  }

  if (!sessionId) {
    console.error('Session ID is null. Cannot delete machine session.');
    return;
  }

  try {
    // Remove from local state
    setMachineSessions(prevMachines =>
      prevMachines.filter(machine => machine.id !== uniqueId)
    );

    // Update the training session document in Firestore
    const sessionRef = doc(firestore, 'training_sessions', sessionId);
    const updatedMachineSessions = machineSessions
      .filter(machine => machine.id !== uniqueId)
      .map(machine => machine.id);

    await updateDoc(sessionRef, { machine_sessions: updatedMachineSessions });

    // Delete the machine session document from Firestore
    const machineSessionRef = doc(firestore, 'machine_sessions', uniqueId);
    await deleteDoc(machineSessionRef);

    console.log(`Machine session with ID ${uniqueId} deleted successfully.`);
  } catch (error) {
    console.error('Error removing machine session:', error);
  }
};

/**
 * CANCELS (deletes) the training session doc from 'training_sessions'
 * plus any associated machine_sessions where training_session_id == sessionId.
 */
export const cancelSession = async (
  sessionId: string,
  onSuccess: () => void,
  onError?: (err: any) => void
) => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }
    const uid = currentUser.uid;
    // Create a batch for multiple deletions at once
    const batch = writeBatch(firestore);

    // 1. Delete the training session doc from 'training_sessions'
    const sessionRef = doc(firestore, 'training_sessions', sessionId);
    batch.delete(sessionRef);

    // 2. Delete all machine sessions with matching training_session_id
    const machineSessionsRef = collection(firestore, 'machine_sessions');
    const q = query(
      machineSessionsRef,
      where('training_session_id', '==', sessionId),
      where('user_id', '==', uid)
    );
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(machineDoc => {
      batch.delete(machineDoc.ref);
    });

    // Commit the batch
    await batch.commit();

    onSuccess();
    console.log(
      `Cancelled training session (and any machine sessions) for ID ${sessionId}.`
    );
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      console.error('Error canceling session:', error);
    }
  }
};
