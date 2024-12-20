import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getFirestore, addDoc, collection } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyBsX7PCZmqe8qGkkruuKInDyys6I8pF_nM",
  authDomain: "whale-watcher-23ad2.firebaseapp.com",
  projectId: "whale-watcher-23ad2",
  storageBucket: "whale-watcher-23ad2.firebasestorage.app",
  messagingSenderId: "221758210243",
  appId: "1:221758210243:web:8fd7721e2e9d73d515e276",
  measurementId: "G-29ZGL5TCWY"
 };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore();
const storage = getStorage(app);

// Handle the file upload process
async function uploadFileToStorage(file) {
  if (!file) return null;

  const storageRef = ref(storage, 'uploads/' + file.name); // Create a reference for the file
  try {
    // Upload the file to Firebase Storage
    await uploadBytes(storageRef, file);
    
    // Get the download URL after the file is uploaded
    const downloadURL = await getDownloadURL(storageRef);
    console.log('File available at:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

// Handle form submission
document.getElementById('submitBtn').addEventListener('click', async () => {
  const latitude = document.querySelector('[name="latitude"]').value;
  const longitude = document.querySelector('[name="longitude"]').value;
  const date = document.querySelector('[name="date"]').value;
  const time = document.querySelector('[name="time"]').value;
  const species = document.querySelector('[name="species"]').value;
  const description = document.querySelector('[name="description"]').value;

  const photoFile = document.getElementById('photoInput').files[0];
  const videoFile = document.getElementById('videoInput').files[0];
  const audioFile = document.getElementById('audioInput').files[0];

  // Upload the files (photo, video, audio) to Firebase Storage
  const photoURL = await uploadFileToStorage(photoFile);
  const videoURL = await uploadFileToStorage(videoFile);
  const audioURL = await uploadFileToStorage(audioFile);

  // Prepare data for Firestore
  const sightingData = {
    latitude: latitude,
    longitude: longitude,
    date: date,
    time: time,
    species: species,
    description: description,
    photo: photoURL, // URL to the uploaded photo
    video: videoURL, // URL to the uploaded video
    audio: audioURL, // URL to the uploaded audio
  };

  try {
    // Add sighting data to Firestore
    const docRef = await addDoc(collection(db, "sightings"), sightingData);
    console.log("Document written with ID: ", docRef.id);
    
    alert('Sighting submitted successfully!');
  } catch (e) {
    console.error("Error adding document: ", e);
    alert('Failed to submit sighting.');
  }
});  

async function submitSighting(lat, lng, species, description, date, time, files) {
  try {
      // Create the data to submit
      const sightingData = {
          latitude: lat,
          longitude: lng,
          species: species,
          description: description,
          date: date,
          time: time,
          photo: files.photo ? await uploadFileToStorage(files.photo) : null, // Optional file upload
          video: files.video ? await uploadFileToStorage(files.video) : null,
          audio: files.audio ? await uploadFileToStorage(files.audio) : null,
          timestamp: new Date(),
      };
  
      // Add the sighting to Firestore
      const docRef = await addDoc(collection(db, "sightings"), sightingData);
      console.log("Document written with ID: ", docRef.id);
      } catch (e) {
      console.error("Error adding document: ", e);
      alert('Failed to save the sighting. Please try again.');
      }
      
  }

  async function handleSightingSubmission(lat, lng, species, description, date, time, files) {
    try {
      // Submit the sighting data (reuse the submitSighting function)
      await submitSighting(lat, lng, species, description, date, time, files);
  
      // Now create a permanent marker and show it on the map
      createPermanentMarker(lat, lng, species, description, files);
      
      // Optionally show a success message or confirmation
      alert("Sighting submitted and marker added!");
  
    } catch (error) {
      console.error("Error submitting sighting:", error);
      alert("Failed to submit sighting. Please try again.");
    }
  }

  function createPermanentMarker(lat, lng, species, description, files) {
    // Create the custom whale marker element
    const markerElement = document.createElement('img');
    markerElement.src = './data/whale.png';  // Path to your whale PNG image
    markerElement.alt = 'Whale Marker';
    markerElement.style.width = '30px';      // Marker size
    markerElement.style.height = '30px';
    markerElement.style.cursor = 'pointer'; // Optional: Cursor style
  
    // Create the permanent marker
    const permanentMarker = new mapboxgl.Marker({ element: markerElement })
      .setLngLat([lng, lat])
      .addTo(map);  // Add the marker to the map
  
    // Create the pop-up for the marker
    const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
      .setMaxWidth('400px')
      .setHTML(`
        <div class="marker-popup">
          <h3>${species}</h3>
          <p>${description}</p>
          ${files.photo ? `<img src="${URL.createObjectURL(files.photo)}" alt="Whale Image" style="width: 100%; max-height: 150px; object-fit: cover;">` : ''}
          ${files.video ? `<video controls style="width: 100%; max-height: 150px;"><source src="${URL.createObjectURL(files.video)}" type="video/mp4"></video>` : ''}
          ${files.audio ? `<audio controls style="width: 100%;"><source src="${URL.createObjectURL(files.audio)}" type="audio/mpeg"></audio>` : ''}
        </div>
      `);
  
    // Show the pop-up when the user hovers over the marker
    markerElement.addEventListener('mouseenter', () => {
      popup.setLngLat([lng, lat]).addTo(map); // Show pop-up
    });
  
    // Remove the pop-up when the user stops hovering over the marker
    markerElement.addEventListener('mouseleave', () => {
      popup.remove(); // Remove pop-up
    });
  }  

export default db;
export { submitSighting, uploadFileToStorage, handleSightingSubmission };