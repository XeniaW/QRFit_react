import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { firestore } from '../firebase';
import { MachineSession } from '../datamodels';

export async function saveRoutine(
  userId: string,
  routineName: string,
  machineSessions: MachineSession[]
): Promise<string> {
  const docRef = await addDoc(collection(firestore, 'routines'), {
    user_id: userId,
    name: routineName,
    created_at: Timestamp.now(),
    machineSessions: machineSessions.map(ms => ({
      machine_ref: ms.machine_ref.id,
      exercise_name: ms.exercise_name,
      sets: ms.sets,
    })),
  });
  return docRef.id;
}
