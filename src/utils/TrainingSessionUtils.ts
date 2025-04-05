import { firestore } from '../firebase';
import { deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param timestamp Firestore Timestamp with seconds and nanoseconds
 * @returns JavaScript Date or null if the timestamp is invalid
 */
export const convertFirestoreTimestampToDate = (timestamp: {
  seconds: number;
}) => {
  return timestamp && timestamp.seconds
    ? new Date(timestamp.seconds * 1000)
    : null;
};

/**
 * Calculate the duration between start and end dates in hours and minutes
 * @param startDate JavaScript Date for the start time
 * @param endDate JavaScript Date for the end time
 * @returns String representing duration in hours and minutes
 */
export const calculateDuration = (startDate: Date, endDate: Date) => {
  const durationMs = endDate.getTime() - startDate.getTime();

  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor(
    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
  );
  const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  // Pad hours, minutes, and seconds with leading zeros if they are less than 10
  const hours = String(durationHours).padStart(2, '0');
  const minutes = String(durationMinutes).padStart(2, '0');
  const seconds = String(durationSeconds).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

/**
 * Delete a training session from Firestore
 * @param id Firestore document ID of the training session to delete
 * @returns Promise that resolves once the deletion is complete
 */
/**
 * Delete a training session and its corresponding machine sessions from Firestore
 * @param id Firestore document ID of the training session to delete
 * @returns Promise that resolves once the deletion is complete
 */
export const deleteTrainingSession = async (id: string, userId: string) => {
  try {
    // Step 1: Fetch the training session document
    const sessionRef = doc(firestore, 'training_sessions', id);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error(`Training session with ID ${id} does not exist.`);
    }

    const sessionData = sessionDoc.data();
    if (sessionData.user_id !== userId) {
      console.error('Unauthorized deletion attempt');
      return;
    }
    if (
      !sessionData?.machine_sessions ||
      !Array.isArray(sessionData.machine_sessions)
    ) {
      throw new Error(
        'Invalid training session data or no machine_sessions found.'
      );
    }

    const machineSessionIds: string[] = sessionData.machine_sessions;

    // Step 2: Delete each machine session
    const deleteMachineSessionPromises = machineSessionIds.map(
      async machineSessionId => {
        const machineSessionRef = doc(
          firestore,
          'machine_sessions',
          machineSessionId
        );
        await deleteDoc(machineSessionRef);
        console.log(`Deleted machine session with ID: ${machineSessionId}`);
      }
    );

    await Promise.all(deleteMachineSessionPromises);

    // Step 3: Delete the training session document
    await deleteDoc(sessionRef);
    console.log(
      `Training session with ID ${id} deleted successfully along with its machine sessions for user ${userId}.`
    );
  } catch (error) {
    console.error(
      'Error deleting training session and its machine sessions:',
      error
    );
    throw error; // Rethrow the error to handle in the component
  }
};

/**
 * Adds a new set to the specified session in the machineSessions array
 * and updates the Firestore database.
 * @param {Array} machineSessions - The array of machine sessions.
 * @param {Number} sessionIndex - The index of the session to add the set to.
 * @param {String} machineSessionId - The Firestore document ID for the machine session.
 * @returns {Array} Updated machineSessions with the new set added.
 */
export const addSet = async (
  machineSessions,
  sessionIndex,
  machineSessionId,
  reps = 0,
  weight = 0
) => {
  const updatedSessions = [...machineSessions];
  const newSet = {
    set_number: updatedSessions[sessionIndex].sets.length + 1,
    reps,
    weight,
  };

  updatedSessions[sessionIndex].sets.push(newSet);

  // Update Firestore with the new set
  const sessionRef = doc(firestore, 'machine_sessions', machineSessionId);
  try {
    await updateDoc(sessionRef, {
      sets: updatedSessions[sessionIndex].sets,
    });
  } catch (error) {
    console.error('Error updating sets in Firestore:', error);
    throw error;
  }

  return updatedSessions;
};

/**
 * Removes a set from the specified session in the machineSessions array
 * and updates Firestore.
 * @param {Array} machineSessions - The array of machine sessions.
 * @param {Number} sessionIndex - The index of the session to remove the set from.
 * @param {Number} setIndex - The index of the set to remove.
 * @param {String} machineSessionId - The Firestore document ID for the machine session.
 * @returns {Array} Updated machineSessions with the set removed.
 */
export const removeSet = async (
  machineSessions,
  sessionIndex,
  setIndex,
  machineSessionId
) => {
  const updatedSessions = [...machineSessions];
  const session = updatedSessions[sessionIndex];

  // Remove the set from the array
  session.sets.splice(setIndex, 1);

  // Reassign set numbers to maintain proper order
  session.sets.forEach((set, index) => {
    set.set_number = index + 1;
  });

  // Update Firestore with the updated sets
  const sessionRef = doc(firestore, 'machine_sessions', machineSessionId);
  try {
    await updateDoc(sessionRef, {
      sets: session.sets,
    });
  } catch (error) {
    console.error('Error updating sets in Firestore:', error);
    throw error;
  }

  return updatedSessions;
};
