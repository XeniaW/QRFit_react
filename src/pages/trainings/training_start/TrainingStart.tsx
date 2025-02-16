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
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';

import './TrainingStart.css';
import { Machines, MachineSession } from '../../../datamodels';
import { useAuth } from '../../../auth';
import { useTimer } from '../../../contexts/TimerContext';
import { usePageTitle } from '../../../contexts/usePageTitle';

import {
  startSession,
  endSession,
  addMachineSession,
  deleteMachineSession,
} from '../../../services/TrainingSessionService';
import {
  startQRScan,
  handleAddMachineById,
} from '../../../services/QRScannerService';
import {
  addSet,
  removeSet,
  formatTime,
} from '../../../utils/TrainingSessionUtils';

import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import ExerciseModal from '../add_machines/modal/ExerciseModal';
import TextModal from '../add_machines/modal/TextModal';

// ---------- Subcomponents ----------
import StartEndControls from './StartEndControls';
import MachineSessionsAccordion from './MachineSessionsAccordion';
import QRCameraOverlay from './QRCameraOverlay';

const StartTrainingSession: React.FC = () => {
  // -- Page Title --
  const { setTitle } = usePageTitle();
  useEffect(() => {
    setTitle('Start Training');
  }, [setTitle]);

  // -- Timer --
  const { timer, isRunning, startTimer, stopTimer, resetTimer } = useTimer();

  // -- Auth --
  const { userId } = useAuth();

  // -- States --
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem('sessionId')
  );
  const [machineSessions, setMachineSessions] = useState<MachineSession[]>(
    () => {
      const storedSessions = localStorage.getItem('machineSessions');
      if (!storedSessions) return [];
      const parsedSessions = JSON.parse(storedSessions);
      // Restore Firestore references
      return parsedSessions.map((session: any) => ({
        ...session,
        machine_ref: doc(firestore, 'machines', session.machine_ref.id),
      }));
    }
  );

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

  const handleEndTraining = () => {
    if (!sessionId) {
      console.error('Session ID is null. Cannot end session.');
      return;
    }
    setShowEndAlert(true);
  };

  const confirmEndTraining = (shouldEnd: boolean) => {
    if (shouldEnd) {
      if (!sessionId) {
        console.error('Session ID is null. Cannot end session.');
        return;
      }
      endSession(sessionId, () => {}, setMachineSessions);
      stopTimer();
      resetTimer();
      setSessionId(null);
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

      // Remove the old 'prevent duplicates' logic so we can add multiple times
      setShowMachinesList(false);
    } catch (error) {
      console.error('Error selecting machine:', error);
    }
  };

  const handleExerciseSelection = (exerciseName: string) => {
    setSelectedExercise(exerciseName);
    setShowExerciseModal(false); // close exercise modal
    setShowTextModal(true); // open reps/weight modal
  };

  // ---------- Fetch Machine Names ----------
  useEffect(() => {
    const fetchMachineNames = async () => {
      const newMachineNames: { [key: string]: string } = {};
      for (const session of machineSessions) {
        if (!machineNames[session.machine_ref.id]) {
          try {
            const machineDoc = await getDoc(session.machine_ref);
            if (machineDoc.exists()) {
              newMachineNames[session.machine_ref.id] = machineDoc.data().title;
            }
          } catch (error) {
            console.error('Error fetching machine name:', error);
          }
        }
      }
      setMachineNames(prev => ({ ...prev, ...newMachineNames }));
    };

    if (machineSessions.length > 0) {
      fetchMachineNames();
    }
  }, [machineSessions, machineNames]);

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
        <IonToolbar>
          {isRunning && (
            <IonButtons slot="end">
              <div style={{ fontWeight: 'bold' }}>{formatTime(timer)}</div>
            </IonButtons>
          )}
        </IonToolbar>
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
          sessionId={sessionId}
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
