import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCeQ1a3USgvh55PgIWt4lqpS7r6SL-fNko",
    authDomain: "qrfit-react.firebaseapp.com",
    projectId: "qrfit-react",
    storageBucket: "qrfit-react.appspot.com",
    messagingSenderId: "861384147203",
    appId: "1:861384147203:web:00146218cd925365c56936",
    measurementId: "G-9BK37M406P"
  }; 

  const app = initializeApp(firebaseConfig);
  export const auth = getAuth(app);
  export default app;
