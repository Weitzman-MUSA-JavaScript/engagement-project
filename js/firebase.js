import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';
import { getFirestore, collection, doc, setDoc, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

// Firebase setup
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

// Add an athlete to Firestore
async function addAthleteReport(data) {
  if (!data || data.Name == 'Athlete Name' || !data.Status || !data.Position || data.Number == '#') {
    Toastify({
      text: 'Save failed: Missing required information (Name, Status, Position).',
      duration: 5000,
      gravity: 'top',
      position: 'center',
      backgroundColor: 'salmon',
    }).showToast();
    return;
  }

  const athleteID = `${data.Name}-${data.Status}-${data.Position}`
    .replace(/\s+/g, '')
    .toLowerCase();

  try {
    await setDoc(doc(db, 'athlete-reports', athleteID), {
      'Timestamp': new Date(),
      'Name': data.Name,
      'Position': data.Position,
      'Status': data.Status,
      'Number': data.Number,
      'Notes': data.Notes,
      'Weight': data.Weight,
      'Height': data.Height,
      'Wingspan': data.Wingspan,
      'Bench': data.Bench,
      'Squat': data.Squat,
      '225lb Bench': data['225lb Bench'],
      'Vertical Jump': data['Vertical Jump'],
      'Broad Jump': data['Broad Jump'],
      'Hang Clean': data['Hang Clean'],
      'Power Clean': data['Power Clean'],
      '10Y Sprint': data['10Y Sprint'],
      'Flying 10': data['Flying 10'],
      'Pro Agility': data['Pro Agility'],
      'L Drill': data['L Drill'],
      '60Y Shuttle': data['60Y Shuttle'],
    });
    Toastify({
      text: `Athlete report for ${data.Name} saved successfully.`,
      duration: 5000,
      gravity: 'top',
      position: 'center',
      backgroundColor: '#4CAF50',
    }).showToast();
  } catch (error) {
    Toastify({
      text: `Save failed: ${error.message}`,
      duration: 5000,
      gravity: 'top',
      position: 'center',
      backgroundColor: 'salmon',
    }).showToast();
  }
}

// Access athlete reports from firestore
async function getAthleteReports() {
  const querySnapshot = await getDocs(collection(db, 'athlete-reports'));
  const reports = [];
  querySnapshot.forEach((doc) => {
    reports.push(doc.data());
  });
  return reports;
}

export { app, analytics, db, addAthleteReport, getAthleteReports };
