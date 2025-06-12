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
import { getDoc, doc } from 'firebase/firestore';

import './TrainingStart.css';
import { Machines } from '../../../datamodels';
import { useAuth } from '../../../auth';
import { useTimer } from '../../../contexts/TimerContext';

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
import { addSet, removeSet } from '../../../utils/TrainingSessionUtils';

import AddMachinesFromTheList from '../add_machines/from_list/AddMachinesFromTheList';
import ExerciseModal from '../add_machines/modal/ExerciseModal';
import TextModal from '../add_machines/modal/TextModal';

// Subcomponents
import StartEndControls from './StartEndControls';
import MachineSessionsAccordion from './MachineSessionsAccordion';
import QRCameraOverlay from './QRCameraOverlay';

import { useTrainingStore } from '../../../stores/useTrainingStore';

import {
  saveActiveWorkout,
  getActiveWorkout,
  clearActiveWorkout,
} from '../../../utils/activeWorkoutStorage';
import {
  requestNotificationPermission,
  showWorkoutNotification,
  clearWorkoutNotification,
} from '../../../services/BrowserNotificationService';

import { firestore } from '../../../firebase';

const StartTrainingSession: React.FC = () => {
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
    const serialized = machineSessions.map(s => ({
      ...s,
      machine_ref: { id: s.machine_ref.id },
    }));
    localStorage.setItem('machineSessions', JSON.stringify(serialized));
  }, [machineSessions]);

  // -- On mount: request notif perm, rehydrate timer & machineSessions --
  useEffect(() => {
    requestNotificationPermission();
    const active = getActiveWorkout();

    if (sessionId && active && !isRunning) {
      // 1) resume timer + notification
      startTimer();
      showWorkoutNotification(active.start);

      // 2) rehydrate any existing machineSessions from localStorage
      const stored = localStorage.getItem('machineSessions');
      if (stored) {
        try {
          const parsed: any[] = JSON.parse(stored);
          const reconstructed = parsed.map(s => {
            return {
              ...s,
              // rebuild a Firestore DocumentReference for each machine_ref
              machine_ref: doc(firestore, 'machines', s.machine_ref.id),
            };
          });
          setMachineSessions(reconstructed);
        } catch (err) {
          console.error('Failed to parse stored machineSessions:', err);
        }
      }
    }
  }, []);

  // ---------- Fetch Machine Names ----------
  useEffect(() => {
    const fetchNames = async () => {
      const newNames: { [key: string]: string } = {};
      for (const sess of machineSessions) {
        const id = sess.machine_ref.id;
        if (!machineNames[id]) {
          const docSnap = await getDoc(sess.machine_ref);
          if (docSnap.exists()) newNames[id] = docSnap.data().title;
        }
      }
      if (Object.keys(newNames).length) {
        setMachineNames(prev => ({ ...prev, ...newNames }));
      }
    };
    if (machineSessions.length) fetchNames();
  }, [machineSessions, machineNames]);

  // ---------- Start / End Logic ----------
  const handleStartTraining = () => {
    const now = Date.now();
    startSession(
      userId!,
      setSessionId,
      () => {},
      () => {}
    );
    startTimer();
    saveActiveWorkout(now);
    showWorkoutNotification(now);
    setShowStartAlert(false);
  };

  // Called by the IonAlert in StartEndControls
  const handleEndTraining = () => {
    if (!sessionId) return console.error('No session to end');
    setShowEndAlert(true);
  };

  // Simplified confirmEndTraining without Routine logic
  const confirmEndTraining = async (shouldEnd: boolean, isCancel = false) => {
    if (!sessionId) {
      setShowEndAlert(false);
      return console.error('Session ID is null.');
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
          clearActiveWorkout();
          clearWorkoutNotification();
        },
        err => console.error(err)
      );
    } else if (shouldEnd) {
      // finalize the session
      await endSession(
        sessionId,
        () => {},
        machineSessions,
        setMachineSessions
      );
      stopTimer();
      resetTimer();
      setSessionId(null);
      setMachineSessions([]);
      clearActiveWorkout();
      clearWorkoutNotification();
    }

    setShowEndAlert(false);
  };

  // ---------- Machine + QR Logic (unchanged) ----------
  const handleMachineSelection = async (machine: Machines) => {
    if (!sessionId) return;
    if (machine.exercises?.length === 1) {
      setSelectedMachine(machine);
      setSelectedExercise(machine.exercises[0].name);
      setShowTextModal(true);
    } else {
      // Otherwise, open the exercise modal
      setSelectedMachine(machine);
      setShowExerciseModal(true);
    }
    setShowMachinesList(false);
  };

  const handleExerciseSelection = (name: string) => {
    setSelectedExercise(name);
    setShowExerciseModal(false);
    setShowTextModal(true);
  };

  // ---------- Modals for Adding Sets ----------
  const handleTextModalConfirm = async (reps: number, weight: number) => {
    if (selectedMachine && sessionId) {
      await addMachineSession(
        userId!,
        sessionId,
        selectedMachine,
        selectedExercise!,
        reps,
        weight,
        machineSessions,
        setMachineSessions
      );
      setSelectedMachine(null);
    }
    setShowTextModal(false);
  };

  const handleAddSetToSession = async (reps: number, weight: number) => {
    if (selectedSessionIndex !== null && sessionId) {
      const msId = machineSessions[selectedSessionIndex].id;
      const updated = await addSet(
        machineSessions,
        selectedSessionIndex,
        msId,
        reps,
        weight
      );
      setMachineSessions(updated);
    }
    setShowTextModal(false);
    setSelectedSessionIndex(null);
  };

  const handleRemoveSet = async (si: number, wi: number) => {
    const msId = machineSessions[si].id;
    const updated = await removeSet(machineSessions, si, wi, msId);
    setMachineSessions(updated);
  };

  const handleQRScan = async () => {
    setIsScanning(true);
    const id = await startQRScan();
    if (id) {
      const m = await handleAddMachineById(id);
      if (m) handleMachineSelection(m);
    }
    setIsScanning(false);
  };

  // ---------- UI ----------
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar />
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
          handleCancelQRScan={() => setIsScanning(false)}
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
