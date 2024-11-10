import { DocumentReference } from "firebase/firestore";

export interface Machines {
    id: string,
    title: string,
    muscles: String[],
}

export interface TrainingSessions {
    id: string;
    start_date: { seconds: number; nanoseconds: number }; // Include nanoseconds with a default of 0 if missing
    end_date: { seconds: number; nanoseconds: number };
    machines: DocumentReference[];   // Array of references to machines
  }