import { DocumentReference, Timestamp } from 'firebase/firestore';

export interface Machines {
  id: string;
  title: string;
  qrcode: string;
  image?: string; // Optional image field
  exercises: Exercise[]; // Array of exercises
}

export interface Exercise {
  name: string;
  muscles: string[]; // Array of muscles targeted
}

export interface SetDetail {
  set_number: number;
  reps: number;
  weight: number;
}

export interface MachineSession {
  id: string; // ID of the machine session document
  training_session_id: string; // ID of the parent training session
  machine_ref: DocumentReference; // Reference to the machine
  exercise_name?: string; // Name of the selected exercise
  date_used: Timestamp; // Timestamp of when the machine was used
  sets: SetDetail[]; // Array of sets for this machine session
  user_id: string; // ID of the user who owns this session
}

export interface TrainingSessions {
  id: string;
  start_date: { seconds: number; nanoseconds: number }; // Include nanoseconds with a default of 0 if missing
  end_date: { seconds: number; nanoseconds: number };
  machine_sessions: string[]; // Array of references to machines
  user_id: string; // ID of the user who owns this session
}

export interface Routine {
  id?: string;
  user_id: string;
  name: string;
  created_at?: Timestamp;
  machineSessions: {
    machine_ref: string;
    exercise_name?: string;
    sets: SetDetail[];
  }[];
}
