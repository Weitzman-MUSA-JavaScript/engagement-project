import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';
import { getFirestore, collection, doc, setDoc, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAPujgD3xoa9zRjqve5nat6m4Q5Aa6MjDM',
  authDomain: 'penn-football-benchmarking.firebaseapp.com',
  projectId: 'penn-football-benchmarking',
  storageBucket: 'penn-football-benchmarking.firebasestorage.app',
  messagingSenderId: '144027601930',
  appId: '1:144027601930:web:a4ea4a588776b2341d63f3',
  measurementId: 'G-834Q3624G1',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

window.db = db;
window.collection = collection;
window.addDoc = addDoc;
window.getDocs = getDocs;

async function getAthleteReports() {
  const reportsColl = collection(db, 'athlete-reports');
  const reports = await getDocs(reportsColl);
  console.log(reports);
  return reports;
}

async function addAthleteReport() {
  await setDoc(doc(db, 'athlete-reports', 'athlete1'), {
    Name: 'Anna Duan',
    Class: 2022,
    Weight: 165,
    Height: 60,
    Timestamp: new Date(),
  });
}
export { app, analytics, db, getAthleteReports, addAthleteReport };
