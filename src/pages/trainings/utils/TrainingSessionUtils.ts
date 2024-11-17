import { firestore } from '../../../firebase';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param timestamp Firestore Timestamp with seconds and nanoseconds
 * @returns JavaScript Date or null if the timestamp is invalid
 */
export const convertFirestoreTimestampToDate = (timestamp: { seconds: number }) => {
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
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
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
    const sessionRef = doc(firestore, "training_sessions", id);
    const sessionDoc = await getDoc(sessionRef);

    if (!sessionDoc.exists()) {
      throw new Error(`Training session with ID ${id} does not exist.`);
    }

    const sessionData = sessionDoc.data();
    if (sessionData.user_id !== userId) {
      console.error("Unauthorized deletion attempt");
      return;
    }
    if (!sessionData?.machine_sessions || !Array.isArray(sessionData.machine_sessions)) {
      throw new Error("Invalid training session data or no machine_sessions found.");
    }

    const machineSessionIds: string[] = sessionData.machine_sessions;

    // Step 2: Delete each machine session
    const deleteMachineSessionPromises = machineSessionIds.map(async (machineSessionId) => {
      const machineSessionRef = doc(firestore, "machine_sessions", machineSessionId);
      await deleteDoc(machineSessionRef);
      console.log(`Deleted machine session with ID: ${machineSessionId}`);
    });

    await Promise.all(deleteMachineSessionPromises);

    // Step 3: Delete the training session document
    await deleteDoc(sessionRef);
    console.log(`Training session with ID ${id} deleted successfully along with its machine sessions for user ${userId}.`);
  } catch (error) {
    console.error("Error deleting training session and its machine sessions:", error);
    throw error; // Rethrow the error to handle in the component
  }
};

/**
 * Utility function to format time in HH:MM:SS format.
 * @param seconds - Total seconds to format.
 * @returns Formatted time string.
 */
export const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};