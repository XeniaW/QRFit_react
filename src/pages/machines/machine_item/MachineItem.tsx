import {
  IonContent,
  IonHeader,
  IonButtons,
  IonBackButton,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
} from '@ionic/react';
import './MachineItem.css';
import { firestore } from '../../../firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useRouteMatch } from 'react-router';
import { Machines, Exercise } from '../../../datamodels';

interface RouteParams {
  id: string;
}

const MachineItem: React.FC = () => {
  const match = useRouteMatch<RouteParams>();
  const { id } = match.params;
  const [machine, setMachine] = useState<Machines | null>(null);

  useEffect(() => {
    const getMachine = async () => {
      const machineDocRef = doc(firestore, 'machines', id);
      const machineDoc = await getDoc(machineDocRef);
      if (machineDoc.exists()) {
        const machineData = {
          id: machineDoc.id,
          ...machineDoc.data(),
        } as Machines;

        setMachine(machineData);
      } else {
        console.log('No such document!');
      }
    };
    getMachine();
  }, [id]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle size="large">
            {machine?.title || 'Unnamed Machine'}
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {/* Safely map over exercises */}

        {(machine?.exercises ?? []).map((exercise, i) => (
          <IonCard key={i}>
            <IonCardHeader>
              <IonCardSubtitle>
                {(exercise.muscles ?? []).join(', ')}
              </IonCardSubtitle>
              <IonCardTitle>{exercise.name}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent></IonCardContent>
          </IonCard>
        ))}
      </IonContent>
    </IonPage>
  );
};

export default MachineItem;
