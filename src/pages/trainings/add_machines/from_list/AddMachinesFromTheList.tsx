import {
  IonContent,
  IonList,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonImg,
  IonThumbnail,
} from '@ionic/react';
import { firestore } from '../../../../firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import './AddMachinesFromTheList.css';

interface AddMachinesFromTheListProps {
  onSelectMachine: (machine: any) => void;
}

const AddMachinesFromTheList: React.FC<AddMachinesFromTheListProps> = ({
  onSelectMachine,
}) => {
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<string>('');

  const machineRef = collection(firestore, 'machines');

  useEffect(() => {
    let isMounted = true;

    const getMachines = async () => {
      const data = await getDocs(machineRef);
      if (isMounted) {
        setMachines(data.docs.map(doc => ({ ...doc.data(), id: doc.id })));
      }
    };

    getMachines();

    return () => {
      isMounted = false;
    };
  }, [machineRef]);

  // Build a list of unique muscles
  const muscleSet = new Set<string>();
  machines.forEach(machine => {
    if (machine.exercises && machine.exercises.length) {
      machine.exercises.forEach((exercise: any) => {
        if (exercise.muscles && exercise.muscles.length) {
          exercise.muscles.forEach((muscle: string) => muscleSet.add(muscle));
        }
      });
    }
  });
  const muscleOptions = Array.from(muscleSet);

  // Filter machines by the selected muscle
  const filteredMachines = selectedMuscle
    ? machines.filter(machine =>
        machine.exercises?.some((exercise: any) =>
          exercise.muscles.includes(selectedMuscle)
        )
      )
    : machines;

  return (
    <IonContent>
      {/* Muscle Filter */}
      <IonItem>
        <IonLabel>Filter by Muscle</IonLabel>
        <IonSelect
          value={selectedMuscle}
          placeholder="Select a muscle"
          onIonChange={e => setSelectedMuscle(e.detail.value)}
        >
          <IonSelectOption value="">All</IonSelectOption>
          {muscleOptions.map(muscle => (
            <IonSelectOption key={muscle} value={muscle}>
              {muscle}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>

      <IonList>
        {filteredMachines.map(machine => {
          const imageUrl = machine.image?.[0]?.downloadURL;
          return (
            <IonItem
              button
              key={machine.id}
              onClick={() => onSelectMachine(machine)}
            >
              <IonThumbnail slot="start">
                <IonImg
                  src={imageUrl || 'assets/icon/icon.png'}
                  alt={machine.title}
                />
              </IonThumbnail>
              {machine.title}
            </IonItem>
          );
        })}
      </IonList>
    </IonContent>
  );
};

export default AddMachinesFromTheList;
