// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBMmpbsiI-8HJ6voovk6YiWS8eoLSfm3EU",
  authDomain: "clear-paths-phl.firebaseapp.com",
  projectId: "clear-paths-phl",
  storageBucket: "clear-paths-phl.firebasestorage.app",
  messagingSenderId: "109790454993",
  appId: "1:109790454993:web:f363fa81273237cc1551f0",
  measurementId: "G-KM5RR1MHED",
  databaseURL: "clear-paths-phl-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);
const reportsRef = ref(db, 'reports');

export { app, analytics, db, ref, push, onValue, reportsRef };