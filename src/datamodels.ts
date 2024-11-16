import { DocumentReference, Timestamp } from "firebase/firestore";

export interface Machines {
    id: string,
    title: string,
    muscles: String[],
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
    date_used: Timestamp; // Timestamp of when the machine was used
    sets: SetDetail[]; // Array of sets for this machine session
  }

export interface TrainingSessions {
    id: string;
    start_date: { seconds: number; nanoseconds: number }; // Include nanoseconds with a default of 0 if missing
    end_date: { seconds: number; nanoseconds: number };
    machine_sessions: string[];   // Array of references to machines
  }