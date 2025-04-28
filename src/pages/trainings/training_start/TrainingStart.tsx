import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonButtons,
  IonModal,
  IonTitle,
} from '@ionic/react';
import { getDoc } from 'firebase/firestore';

import './TrainingStart.css';
import { Machines } from '../../../datamodels';
import { useAuth } from '../../../auth';
import { useTimer } from '../../../contexts/TimerContext';
import { usePageTitle } from '../../../contexts/usePageTitle';

import {
  startSession,
  endSession,
  addMachineSession,
  deleteMachineSession,
  cancelSession,
} from '../../../services/TrainingSessionService';
import {
  startQRScan,
  handleAddMachineById,
} from '../../../services/QRScannerService';
import { saveRoutine } from '../../../services/RoutineService';
import { addSet, removeSet } from '../../../utils/TrainingSessionUtils';

import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import ExerciseModal from '../add_machines/modal/ExerciseModal';
import TextModal from '../add_machines/modal/TextModal';

// ---------- Subcomponents ----------
import StartEndControls from './StartEndControls';
import MachineSessionsAccordion from './MachineSessionsAccordion';
import QRCameraOverlay from './QRCameraOverlay';

import { useTrainingStore } from '../../../stores/useTrainingStore';

const StartTrainingSession: React.FC = () => {
  // -- Page Title --
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle('Start Training');
  }, [setTitle]);

  // -- Timer --
  const { isRunning, startTimer, stopTimer, resetTimer } = useTimer();

  // -- Auth --
  const { userId } = useAuth();

  // -- States --
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId')
  );
  const machineSessions = useTrainingStore(s => s.machineSessions);
  const setMachineSessions = useTrainingStore(s => s.setMachineSessions);

  const [showMachinesList, setShowMachinesList] = useState(false);
  const [showStartAlert, setShowStartAlert] = useState(false);
  const [showEndAlert, setShowEndAlert] = useState(false);
  const [machineNames, setMachineNames] = useState<{ [key: string]: string }>(
    {}
  );
  const [isScanning, setIsScanning] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState<
    number | null
  >(null);
  const [selectedMachine, setSelectedMachine] = useState<Machines | null>(null);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // -- Persist sessionId to localStorage --
  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
    } else {
      localStorage.removeItem('sessionId');
    }
  }, [sessionId]);

  // -- Persist machineSessions to localStorage --
  useEffect(() => {
    const serializedSessions = machineSessions.map(session => ({
      ...session,
      machine_ref: { id: session.machine_ref.id }, // only store the machine ID
    }));
    localStorage.setItem('machineSessions', JSON.stringify(serializedSessions));
  }, [machineSessions]);

  // -- Reset UI state on mount --
  useEffect(() => {
    setShowMachinesList(false);
    setShowTextModal(false);
    setSelectedMachine(null);
  }, []);

  // ---------- Fetch Machine Names when machineSessions change ----------
  useEffect(() => {
    const fetchMachineNames = async () => {
      const newMachineNames: { [key: string]: string } = {};
      for (const session of machineSessions) {
        const machineId = session.machine_ref.id;
        if (!machineNames[machineId]) {
          try {
            const machineDoc = await getDoc(session.machine_ref);
            if (machineDoc.exists()) {
              newMachineNames[machineId] = machineDoc.data().title;
            }
          } catch (error) {
            console.error('Error fetching machine name:', error);
          }
        }
      }
      if (Object.keys(newMachineNames).length > 0) {
        setMachineNames(prev => ({ ...prev, ...newMachineNames }));
      }
    };

    if (machineSessions.length > 0) {
      fetchMachineNames();
    }
  }, [machineSessions, machineNames]);

  // ---------- Start / End Training Logic ----------
  const handleStartTraining = () => {
    startSession(
      userId!,
      setSessionId,
      () => {},
      () => {}
    );
    startTimer();
    setShowStartAlert(false);
  };

  // This is called by the IonAlert in StartEndControls
  const handleEndTraining = () => {
    if (!sessionId) {
      console.error('Session ID is null. Cannot end session.');
      return;
    }
    setShowEndAlert(true);
  };

  // Updated confirmEndTraining to accept routineName
  const confirmEndTraining = (
    shouldEnd: boolean,
    isCancel = false,
    routineName?: string
  ) => {
    if (!sessionId) {
      console.error('Session ID is null. Cannot end or cancel session.');
      setShowEndAlert(false);
      return;
    }

    if (isCancel) {
      // user selected "Cancel Session"
      cancelSession(
        sessionId,
        () => {
          stopTimer();
          resetTimer();
          setSessionId(null);
          setMachineSessions([]);
          localStorage.removeItem('sessionId');
          localStorage.removeItem('machineSessions');
          console.log(`Session ${sessionId} canceled.`);
        },
        err => console.error('Cancel session error:', err)
      );
    } else if (shouldEnd) {
      // If the user typed a routine name, save it first
      if (routineName && routineName.trim().length > 0) {
        saveRoutine(userId!, routineName, machineSessions)
          .then(() => {
            console.log(`Routine '${routineName}' saved!`);
          })
          .catch(err => console.error('Error saving routine:', err));
      }
      // Then finalize the session
      endSession(sessionId, () => {}, setMachineSessions);
      stopTimer();
      resetTimer();
      setSessionId(null);
      setMachineSessions([]);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('machineSessions');
    }

    setShowEndAlert(false);
  };

  // ---------- Machine Selection ----------
  const handleMachineSelection = async (machine: Machines) => {
    if (!sessionId) {
      console.error('Session ID is null. Cannot add machine.');
      return;
    }
    try {
      // If machine.exercises.length === 1, skip exercise modal
      if (machine.exercises && machine.exercises.length === 1) {
        setSelectedMachine(machine);
        setSelectedExercise(machine.exercises[0].name);
        setShowExerciseModal(false);
        setShowTextModal(true);
      } else {
        // Otherwise, open the exercise modal
        setSelectedMachine(machine);
        setShowExerciseModal(true);
      }
      setShowMachinesList(false);
    } catch (error) {
      console.error('Error selecting machine:', error);
    }
  };

  const handleExerciseSelection = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setShowExerciseModal(false);
    setShowTextModal(true);
  };

  // ---------- Modals for Adding Sets ----------
  const handleTextModalConfirm = async (reps: number, weight: number) => {
    if (selectedMachine && sessionId) {
      try {
        await addMachineSession(
          userId!,
          sessionId,
          selectedMachine,
          selectedExercise as string,
          reps,
          weight,
          machineSessions,
          setMachineSessions
        );
        setSelectedMachine(null);
      } catch (error) {
        console.error('Error adding machine session:', error);
      }
    }
    setShowTextModal(false);
  };

  const handleAddSetToSession = async (reps: number, weight: number) => {
    if (selectedSessionIndex !== null && sessionId) {
      const machineSessionId = machineSessions[selectedSessionIndex].id;
      try {
        const updatedSessions = await addSet(
          machineSessions,
          selectedSessionIndex,
          machineSessionId,
          reps,
          weight
        );
        setMachineSessions(updatedSessions);
      } catch (error) {
        console.error('Failed to add set:', error);
      }
    }
    setShowTextModal(false);
    setSelectedSessionIndex(null);
  };

  const handleRemoveSet = async (sessionIndex: number, setIndex: number) => {
    const machineSessionId = machineSessions[sessionIndex].id;
    try {
      const updatedSessions = await removeSet(
        machineSessions,
        sessionIndex,
        setIndex,
        machineSessionId
      );
      setMachineSessions(updatedSessions);
    } catch (error) {
      console.error('Failed to remove set:', error);
    }
  };

  // ---------- QR Scanning ----------
  const handleQRScan = async () => {
    setIsScanning(true);
    const machineId = await startQRScan();
    if (machineId) {
      const machine = await handleAddMachineById(machineId);
      if (machine) handleMachineSelection(machine);
    }
    setIsScanning(false);
  };

  const handleCancelQRScan = () => {
    setIsScanning(false);
  };

  // ---------- UI ----------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar></IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* Start/End Controls + Alerts */}
        <StartEndControls
          isRunning={isRunning}
          showStartAlert={showStartAlert}
          setShowStartAlert={setShowStartAlert}
          showEndAlert={showEndAlert}
          setShowEndAlert={setShowEndAlert}
          handleStartTraining={handleStartTraining}
          handleEndTraining={handleEndTraining}
          confirmEndTraining={confirmEndTraining}
        />

        {/* Add Machines / QR Buttons */}
        {isRunning && (
          <>
            <IonButton onClick={() => setShowMachinesList(true)}>
              Add Machines from the List
            </IonButton>
            <IonButton onClick={handleQRScan}>Scan QR Code</IonButton>
          </>
        )}

        {/* Machines List in a Modal */}
        <IonModal
          isOpen={showMachinesList}
          onDidDismiss={() => setShowMachinesList(false)}
        >
          <IonHeader>
            <IonToolbar>
              <IonTitle>Select Machine</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowMachinesList(false)}>
                  Close
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <AddMachinesFromTheList onSelectMachine={handleMachineSelection} />
          </IonContent>
        </IonModal>

        {/* QR Camera Overlay */}
        <QRCameraOverlay
          isScanning={isScanning}
          handleCancelQRScan={handleCancelQRScan}
        />

        {/* Machine Sessions Accordion */}
        <MachineSessionsAccordion
          machineSessions={machineSessions}
          machineNames={machineNames}
          sessionId={sessionId!}
          handleRemoveSet={handleRemoveSet}
          setSelectedSessionIndex={setSelectedSessionIndex}
          setShowTextModal={setShowTextModal}
          deleteMachineSession={deleteMachineSession}
          setMachineSessions={setMachineSessions}
        />

        {/* Exercise Modal */}
        <ExerciseModal
          isOpen={showExerciseModal}
          exercises={selectedMachine?.exercises || []}
          onConfirm={handleExerciseSelection}
          onCancel={() => setShowExerciseModal(false)}
        />

        {/* Reps/Weight Modal */}
        <TextModal
          isOpen={showTextModal}
          onConfirm={
            selectedSessionIndex !== null
              ? handleAddSetToSession
              : handleTextModalConfirm
          }
          onCancel={() => {
            setShowTextModal(false);
            setSelectedSessionIndex(null);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default StartTrainingSession;
