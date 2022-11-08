import { IonRow,IonCol, IonContent,IonButton, IonHeader,IonButtons,IonBackButton, IonPage, IonTitle, IonToolbar, IonList, IonItem } from '@ionic/react';

import './MachineItem.css';
import {firestore} from '../../../firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs} from 'firebase/firestore';
import { useRouteMatch } from 'react-router';


interface RouteParams {
  id:string;
 
}

const MachineItem: React.FC = () => {
  const match = useRouteMatch<RouteParams>();
  const {id} = match.params;
  const [machine, setMachines] = useState<any>([]);

  const machineRef = collection(firestore, "machines");

  useEffect(() => {
      const getMachines = async () => {
        const data = await getDocs(machineRef);
        data.docs.map((doc)=>  {
          const machine = {...doc.data(), id: doc.id, muscles: doc.data().musclemap} // mapping out data for usage
          setMachines(machine);
        });
     };
     getMachines();
    
  }, [id]);
  console.log(machine.muscles)
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
        {/* <IonItem button key={machine.muscles.muscle1}>
                      {machine.muscles.muscle1}
                    </IonItem>) */}
        </IonContent>
    </IonPage>
  );
};

export default MachineItem;
