

import { firestore } from '../../firebase';
import { deleteDoc, doc } from 'firebase/firestore';

/**
 * Convert Firestore Timestamp to JavaScript Date
 * @param timestamp Firestore Timestamp with seconds and nanoseconds
 * @returns JavaScript Date or null if the timestamp is invalid
 */
export const convertFirestoreTimestampToDate = (timestamp: { seconds: number, nanoseconds: number }) => {
  return timestamp && timestamp.seconds
    ? new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000)
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
  return `${durationHours} hours ${durationMinutes} minutes`;
};

/**
 * Delete a training session from Firestore
 * @param id Firestore document ID of the training session to delete
 * @returns Promise that resolves once the deletion is complete
 */
export const deleteTrainingSession = async (id: string) => {
  try {
    await deleteDoc(doc(firestore, "training_sessions", id));
    console.log("Training session deleted successfully");
  } catch (error) {
    console.error("Error deleting document:", error);
    throw error; // Rethrow error to handle in the component
  }
};
