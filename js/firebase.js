// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAuQ3hYuo-P5M5Itj4RC6tqmK6SZkasxGo",
  authDomain: "engagement-project-dde4b.firebaseapp.com",
  projectId: "engagement-project-dde4b",
  storageBucket: "engagement-project-dde4b.firebasestorage.app",
  messagingSenderId: "912220348489",
  appId: "1:912220348489:web:c886c545699d5112119f98"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getDataFS(collectionID) {
  const collectionRef = collection(db, collectionID);
  const rawData = await getDocs(collectionRef);

  let data = [];

  rawData.forEach((doc) => {
    // console.log(doc.data());
    data.push(doc.data());
  });

  return data;
}
  
async function addDataFS(col1, col2) {
  const collectionRef = collection(db, 'test');

  await addDoc(collectionRef, {
      field1: col1,
      field2: col2,
  });
}
  
export { app, db, getDataFS, addDataFS };
