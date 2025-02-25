import {
  IonContent,
  IonHeader,
  IonButtons,
  IonBackButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonLabel,
} from '@ionic/react';

import './MachineList.css';
import { firestore } from '../../firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';

const MachineList: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);

  const machineRef = collection(firestore, 'machines');

  useEffect(() => {
    const getMachines = async () => {
      const data = await getDocs(machineRef);
      setMachines(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };
    getMachines();
  }, [machineRef]);

  // Collect all unique muscles from the fetched machines
  const muscleSet = new Set<string>();
  machines.forEach(machine => {
    if (Array.isArray(machine.exercises)) {
      machine.exercises.forEach((exercise: any) => {
        if (Array.isArray(exercise.muscles)) {
          exercise.muscles.forEach(muscle => muscleSet.add(muscle));
        }
      });
    }
  });
  const muscleOptions = Array.from(muscleSet);

  const filteredMachines =
    selectedMuscles.length === 0
      ? machines
      : machines.filter(machine =>
          machine.exercises?.some((exercise: any) =>
            // Check if the exercise's muscles array
            // includes at least one muscle from the user's selection
            selectedMuscles.some(m => exercise.muscles.includes(m))
          )
        );

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle size="large">Machines</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Multi-Select Muscle Filter */}
        <IonItem>
          <IonLabel>Filter by Muscle</IonLabel>
          <IonSelect
            multiple={true}
            value={selectedMuscles}
            placeholder="Select muscle(s)"
            onIonChange={e => {
              // e.detail.value is an array of selected muscle strings
              setSelectedMuscles(e.detail.value);
            }}
          >
            {muscleOptions.map(muscle => (
              <IonSelectOption key={muscle} value={muscle}>
                {muscle}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {/* Filtered Machines */}
        <IonList>
          {filteredMachines.map(machine => (
            <IonItem
              button
              key={machine.id}
              routerLink={`/my/machines/${machine.id}`}
            >
              {machine.title}
            </IonItem>
          ))}
        </IonList>
      </IonContent>
    </IonPage>
  );
};

export default MachineList;
