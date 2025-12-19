import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBiURA6K6EVwmPJOlr9aaeS-fkWH19UxT0',
  authDomain: 'inside-the-walls.firebaseapp.com',
  projectId: 'inside-the-walls',
  storageBucket: 'inside-the-walls.firebasestorage.app',
  messagingSenderId: '998856093732',
  appId: '1:998856093732:web:2992c83a3d2205f738a8b1',
  measurementId: 'G-43ZCSV1HRN',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
