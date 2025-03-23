import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyAwg_66u7gSWgJh6dDAIVssCpD8sPBSwb0",
  authDomain: "koala-observation.firebaseapp.com",
  projectId: "koala-observation",
  storageBucket: "koala-observation.firebaseapp.com",
  messagingSenderId: "655967433755",
  appId: "1:655967433755:web:ea02c3eb49fc89be63f4be",
  measurementId: "G-ERYX3NM73V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
