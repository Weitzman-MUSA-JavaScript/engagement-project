// Import the functions you need from the SDKs you need
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js';
import { getFirestore, collection, query, where, addDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyCKlDER4TqrzQHdbXRDStC906GorFBq_bE',
  authDomain: 'personal-website-2f4e6.firebaseapp.com',
  projectId: 'personal-website-2f4e6',
  storageBucket: 'personal-website-2f4e6.firebasestorage.app',
  messagingSenderId: '265752195974',
  appId: '1:265752195974:web:d974b9321c1e4fb6aab207',
  measurementId: 'G-P8JEBF4JQP',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Define a fuunction to download comments for certain project from firebase
async function getProjectComments(projectId) {
  const commentsCollection = collection(db, 'project_comments');
  const commentsQuery = query(commentsCollection, where('projectId', '==', projectId));
  const querySnapshot = await getDocs(commentsQuery);

  const comments = querySnapshot.docs.map((doc) => {
    const data = doc.data();
    const time = data.time?.toDate();
    const formattedTime = time ? `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}` : null;

    return {
      id: doc.id,
      ...data,
      time: formattedTime,
      originalTime: time, // Keep the original time stamp for sorting
    };
  });

  // Sort comments by original time stamp in descending order
  comments.sort((a, b) => (b.originalTime - a.originalTime));

  // Remove originalTime from the final result
  return comments.map(({ originalTime, ...rest }) => rest);
}

// Define a function to add a comment for certain project to firebase
async function addProjectComment(projectId, name, content) {
  const commentsCollection = collection(db, 'project_comments');
  await addDoc(commentsCollection, {
    projectId,
    name,
    content,
    time: new Date(),
  });
}

export { app, analytics, db, getProjectComments, addProjectComment};
