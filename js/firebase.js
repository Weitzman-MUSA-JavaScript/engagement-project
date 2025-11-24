import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCDlBdfp2HtFduNqnTgcZAk0PtxbW00e0s",
    authDomain: "land-acquisition-dashboard.firebaseapp.com",
    projectId: "land-acquisition-dashboard",
    storageBucket: "land-acquisition-dashboard.appspot.com", // Fixed bucket URL
    messagingSenderId: "1056195188133",
    appId: "1:1056195188133:web:10f67011c9cf9c2e4ec44c",
    measurementId: "G-1WT1SMSGBR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Export Firebase instances
export { app, analytics, db };