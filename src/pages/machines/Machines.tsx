import { IonRow,IonCol, IonContent,IonButton, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem } from '@ionic/react';

import './Machines.css';
import {firestore} from '../../firebase';
import { useEffect, useState } from 'react';
import { collection, getDocs} from 'firebase/firestore';


const Machines: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const machineRef = collection(firestore, "machines");

  // const actionPromises = [];
  useEffect(() => {
      const getMachines = async () => {
        const data = await getDocs(machineRef);
        setMachines(data.docs.map((doc)=> ({...doc.data(), id: doc.id})))
     };
     getMachines();
  }, []);

  return (
    <IonPage>     
        <IonHeader>
          <IonToolbar>
            <IonTitle size="large">Machines</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent fullscreen>  
          
            <IonList>
              {machines.map((machine) =>
              <IonItem button key={machine.id}
                    routerLink={`/my/machines/${machine.id}`}>
                      {machine.title}
                    </IonItem>)}
            </IonList>
             
         
        </IonContent>
    </IonPage>
  );
};

export default Machines;
