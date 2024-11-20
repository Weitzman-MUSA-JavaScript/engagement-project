 // Import the functions you need from the SDKs you need
 import {getFirestore, collection, addDoc, getDocs} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js"
 import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
 import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
 // TODO: Add SDKs for Firebase products that you want to use
 // https://firebase.google.com/docs/web/setup#available-libraries

 // Your web app's Firebase configuration
 // For Firebase JS SDK v7.20.0 and later, measurementId is optional
 const firebaseConfig = {
   apiKey: "AIzaSyCoV7E7ZfyllzlBTK1xRX9XSRgIANdYEEY",
   authDomain: "opiniate-524f0.firebaseapp.com",
   projectId: "opiniate-524f0",
   storageBucket: "opiniate-524f0.firebasestorage.app",
   messagingSenderId: "778619690828",
   appId: "1:778619690828:web:6080175dd7e2600451b9e9",
   measurementId: "G-2661G82D94"
 };
 firebase.firestore().settings({ experimentalForceLongPolling: true });
 // Initialize Firebase
 const app = initializeApp(firebaseConfig);
 const analytics = getAnalytics(app);
 const db= getFirestore(app,'opiniate-524f0 ')
 window.db= db;
 window.collection= collection;
 window.addDoc = addDoc;
 window.getDocs = getDocs;

 // has to be asynchronous function because it calls await subsequently
async function getReports() { 
 const reportsColl = collection (db, 'opinion_records');
 const reports = await getDocs (reportsColl)
 const reportsArray = reports.docs.map(doc => ({
   id: doc.id,
   ...doc.data()
 }));
 
 console.info("Reports in JSON format:", JSON.stringify(reportsArray));
 
 return reportsArray; // This returns an array of JSON objects
}

function convertToGeoJSON(data) {
 return {
     type: "FeatureCollection",
     features: data.map((item) => ({
         type: "Feature",
         geometry: {
             type: "Point",
             coordinates: [item.lng, item.lat] // Note: GeoJSON uses [lng, lat]
         },
         properties: {
             id: item.id,
             sentiment: item.sentiment,
             comment_EN: item.comment_EN
         }
     }))
 };
}

async function uploadReports(featureCollection) {
 const collectionRef = collection(db, "opinion_records");

 try {
     // Loop through each feature in the collection and add it to Firestore
     for (const feature of featureCollection.features) {
         await addDoc(collectionRef, feature);
     }
     console.log("Feature collection uploaded successfully!");
     alert("Feature collection uploaded successfully!");
 } catch (error) {
     console.error("Error uploading feature collection:", error);
     alert("Error uploading feature collection.");
 }
}
 export {app, analytics,db, getReports, uploadReports, convertToGeoJSON};
