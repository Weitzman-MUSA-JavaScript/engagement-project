import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  GeoPoint,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyAlk2-ADwWjdRp1iq1P7OHCqpUJ9L4VuIM',
  authDomain: 'hangzhou-inundation-reporting.firebaseapp.com',
  projectId: 'hangzhou-inundation-reporting',
  storageBucket: 'hangzhou-inundation-reporting.appspot.com',
  messagingSenderId: '516945465262',
  appId: '1:516945465262:web:175360d448878be51ec23f',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reportsCollection = collection(db, 'floodReports');

// Save a single flood report
export async function saveFloodReport(report) {
  try {
    const docRef = await addDoc(reportsCollection, {
      location: new GeoPoint(report.location.lat, report.location.lng),
      date: report.date,
      time: report.time,
      depth: report.depth,
      situation: report.situation,
      description: report.description,
      timestamp: serverTimestamp(),
    });
    console.log('Report saved with ID:', docRef.id);
  } catch (error) {
    console.error('Error saving report:', error);
  }
}

// Load all flood reports
export async function loadFloodReports() {
  try {
    const q = query(reportsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    const reports = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const report = {
        id: doc.id,
        location: { lat: data.location.latitude, lng: data.location.longitude },
        date: data.date,
        time: data.time,
        depth: data.depth,
        situation: data.situation,
        description: data.description,
        timestamp: data.timestamp?.toDate() || new Date(),
      };

      reports.push(report);
    });

    console.log('Flood reports loaded:', reports.length);
    return reports;
  } catch (error) {
    console.error('Error loading flood reports:', error);
    return [];
  }
}

// Upload demo reports
export async function uploadDemoReports(demoReports) {
  for (const report of demoReports) {
    await saveFloodReport(report);
  }
  console.log('All demo reports uploaded.');
}
