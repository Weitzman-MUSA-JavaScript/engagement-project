// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCKlDER4TqrzQHdbXRDStC906GorFBq_bE',
  authDomain: 'personal-website-2f4e6.firebaseapp.com',
  projectId: 'personal-website-2f4e6',
  storageBucket: 'personal-website-2f4e6.firebasestorage.app',
  messagingSenderId: '265752195974',
  appId: '1:265752195974:web:d974b9321c1e4fb6aab207',
  measurementId: 'G-P8JEBF4JQP',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db };
