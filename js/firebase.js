import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCGAb8BNZ-ptefd91h_mHWNU4QpCJ89STE',
  authDomain: 'engagement-project-fdc08.firebaseapp.com',
  projectId: 'engagement-project-fdc08',
  storageBucket: 'engagement-project-fdc08.firebasestorage.app',
  messagingSenderId: '260811020318',
  appId: '1:260811020318:web:4ef3e01ada4da48f34360f',
  measurementId: 'G-BZHSP6RRQ5',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

async function getFloodReports() {
  const reportsColl = collection(db, 'floodReports');
  const reports = await getDocs(reportsColl);
  return reports;
}

async function addFloodReport(parcelType, lat, lon, value, damage, housing, insurance) {
  const reportsColl = collection(db, 'floodReports');
  await addDoc(reportsColl, {
    Cat: parcelType,
    Lat: lat,
    Lon: lon,
    Time: new Date(),
    Value: value,
    Damage: damage,
    Housing: housing,
    Insurance: insurance,
  });
}

export { app, analytics, db, getFloodReports, addFloodReport };
