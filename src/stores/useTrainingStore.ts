import create from 'zustand';
import { MachineSession } from '../datamodels';

// Store for managing training session state
export interface TrainingState {
  sessionId: string | null;
  machineSessions: MachineSession[];
  isRunning: boolean;
  showStartAlert: boolean;
  showEndAlert: boolean;
  showRoutineNameAlert: boolean;
  showMachinesList: boolean;
  showExerciseModal: boolean;
  showTextModal: boolean;

  initSession: (id: string) => void;
  endLocalSession: () => void;
  cancelLocalSession: () => void;
  setMachineSessions: (
    updater: MachineSession[] | ((prev: MachineSession[]) => MachineSession[])
  ) => void;

  setShowStartAlert: (b: boolean) => void;
  setShowEndAlert: (b: boolean) => void;
  setShowRoutineNameAlert: (b: boolean) => void;
  setShowMachinesList: (b: boolean) => void;
  setShowExerciseModal: (b: boolean) => void;
  setShowTextModal: (b: boolean) => void;
}

export const useTrainingStore = create<TrainingState>(set => ({
  sessionId: null,
  machineSessions: [],
  isRunning: false,
  showStartAlert: false,
  showEndAlert: false,
  showRoutineNameAlert: false,
  showMachinesList: false,
  showExerciseModal: false,
  showTextModal: false,

  initSession: id => set({ sessionId: id, isRunning: true }),
  endLocalSession: () => set({ isRunning: false }),
  cancelLocalSession: () =>
    set({ sessionId: null, isRunning: false, machineSessions: [] }),
  setMachineSessions: ms =>
    set(state => ({
      machineSessions:
        typeof ms === 'function' ? (ms as Function)(state.machineSessions) : ms,
    })),

  setShowStartAlert: b => set({ showStartAlert: b }),
  setShowEndAlert: b => set({ showEndAlert: b }),
  setShowRoutineNameAlert: b => set({ showRoutineNameAlert: b }),
  setShowMachinesList: b => set({ showMachinesList: b }),
  setShowExerciseModal: b => set({ showExerciseModal: b }),
  setShowTextModal: b => set({ showTextModal: b }),
}));
