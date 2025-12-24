// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

const firebaseConfig = {
  apiKey: "AIzaSyC5xj_4S1dTuUT_nxNznnx7yA1ebllh-vw",
  authDomain: "base-management-system-jun.firebaseapp.com",
  projectId: "base-management-system-jun",
  storageBucket: "base-management-system-jun.firebasestorage.app",
  messagingSenderId: "362513632673",
  appId: "1:362513632673:web:fae45d9f33c9eb97c9cfe0",
  measurementId: "G-Q8EQ3BS3T2",
};

// Initialize Firebase  
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export { app, analytics, db, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc };