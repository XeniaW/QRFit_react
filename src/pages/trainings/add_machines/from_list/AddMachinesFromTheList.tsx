import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem } from '@ionic/react';
import { firestore } from '../../../../firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import './AddMachinesFromTheList.css';

interface AddMachinesFromTheListProps {
  onSelectMachine: (machine: any) => void;
}

const AddMachinesFromTheList: React.FC<AddMachinesFromTheListProps> = ({ onSelectMachine }) => {
  const [machines, setMachines] = useState<any[]>([]);
  const machineRef = collection(firestore, "machines");

  useEffect(() => {
    const getMachines = async () => {
      const data = await getDocs(machineRef);
      setMachines(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };
    getMachines();
  }, []);

  return (
    <IonContent fullscreen>
      <IonList>
        {machines.map((machine) =>
          <IonItem button key={machine.id} onClick={() => onSelectMachine(machine)}>
            {machine.title}
          </IonItem>
        )}
      </IonList>
    </IonContent>
  );
};

export default AddMachinesFromTheList;