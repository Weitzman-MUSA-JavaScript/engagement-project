// firebase.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyDFkkX5OcKFbxAsliQGmWBlLFe6fABBSvM",
  authDomain: "tekong-project.firebaseapp.com",
  projectId: "tekong-project",
  storageBucket: "tekong-project.firebasestorage.app",
  messagingSenderId: "732158714164",
  appId: "1:732158714164:web:3abc7d443ed6c20f5b8561"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function handleConfirmUpload() {
    // Get user input from the modal form
    const userMapTitle = document.getElementById("mapTitle").value;
    const userDescription = document.getElementById("mapDescription").value;
    const userAuthor = document.getElementById("mapAuthor").value;

    // Validate user input
    if (!userMapTitle || !userDescription || !userAuthor) {
        alert("Please fill in all fields: Title, Description, and Author.");
        return;
    }

    // Prepare the map data to upload to Firebase
    const mapData = {
        title: userMapTitle,
        description: userDescription,
        author: userAuthor,
        colors: {} // Object to store polygon colors
    };

    // Fetch polygon colors from localStorage and add to mapData
    for (let i = 1; i <= 50; i++) {
        const polygonKey = `A${i}`;
        mapData.colors[polygonKey] = localStorage.getItem(`colour${polygonKey}`) || "#f4f2ec"; // Default color
    }

    try {
        // Upload map data to Firestore
        const docRef = await addDoc(collection(db, "maps"), mapData);

        // Close the modal after upload
        $("#uploadModal .btn-close").click()

        alert(`Map uploaded successfully! Check back at the gallery page to view your map & other maps. Upload ID: ${docRef.id}`);
        // alert(`Map uploaded successfully! Unique ID: ${docRef.id}`);

    } catch (error) {
        console.error("Error uploading map: ", error);
        alert("Failed to upload the map. Please try again.");
    }
}

// Add event listener to the "Confirm upload" button inside the modal
document.getElementById("confirm-upload-btn").addEventListener("click", handleConfirmUpload);

// Get maps
async function getAllMaps() {
    const mapsCollection = collection(db, "maps");
    const mapsData = {}; 

    try {
        const querySnapshot = await getDocs(mapsCollection);
        
        querySnapshot.forEach((docSnap) => {
            if (docSnap.exists()) {
                const docId = docSnap.id; // Document ID
                const docData = docSnap.data(); // Document data
                
                // Store document ID and data in the mapsData object
                mapsData[docId] = docData;

                // console.log("Document ID:", docId);
                // console.log("Document data:", docData);
            } else {
                console.log("No such document!");
            }
        });

        return mapsData;
    } catch (error) {
        console.error("Error getting documents: ", error);
        return {}; // Return an empty object in case of error
    }
}

export { db , getAllMaps };