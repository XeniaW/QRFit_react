import { IonContent,IonHeader,IonButtons,IonBackButton, IonPage, IonTitle, IonToolbar, IonList, IonItem } from '@ionic/react';

import './MachineItem.css';

import {firestore} from '../../../firebase';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { useRouteMatch } from 'react-router';
import {Machines} from '../../../datamodels';

interface RouteParams {
  id:string;
}

const MachineItem: React.FC = () => {
  const match = useRouteMatch<RouteParams>();
  const {id} = match.params;
  const [machine, setMachine] = useState<Machines>();

  useEffect(() => {
    const getMachine = async () => {
      const machineDocRef = doc(firestore, "machines", id);
      const machineDoc = await getDoc(machineDocRef);
      if (machineDoc.exists()) {
        const machineData = { id: machineDoc.id, ...machineDoc.data() } as Machines;
        setMachine(machineData);
      } else {
        console.log("No such document!");
      }
    };
    getMachine();
  }, [id]);

  

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref='/' />
          </IonButtons>
          <IonTitle size="large">{machine?.title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {machine?.muscles && (
          <IonList>
            {machine.muscles.map((muscle, i) => (
              <IonItem key={i}>
                {muscle}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};


export default MachineItem;
