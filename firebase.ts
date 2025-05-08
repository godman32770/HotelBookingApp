// firebase.ts
import { initializeApp } from 'firebase/app';
//import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBZ0DgPXEowZh6V1gktOOjp1wZWK4eiruk",
  authDomain: "airline-app-eaca4.firebaseapp.com",
  databaseURL: "https://airline-app-eaca4-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "airline-app-eaca4",
  storageBucket: "airline-app-eaca4.firebasestorage.app",
  messagingSenderId: "1031280553266",
  appId: "1:1031280553266:web:eb6b3af9d97f7f71d67b2b",
  measurementId: "G-DMFED888HF"
};

const app = initializeApp(firebaseConfig);

//export const auth = getAuth(app);
export const db = getDatabase(app);
