import { db, ref, push } from './firebase.js';
import { initMap } from './navigation.js';

const mapboxToken = 'pk.eyJ1Ijoic29sYW5vYSIsImEiOiJjbTR3ZWU4MzAwY3JkMmpwb252czJudDVjIn0.6GUU4rEhxQx-bsGw5d7zeQ'; 

const el = document.querySelector('.map');
console.log('Map container found:', el);
initMap(el, mapboxToken);

const reportButton = document.getElementById('report-button');
const formContainer = document.querySelector('.form-container');
const closeButton = document.getElementById('close-form-button');

reportButton.addEventListener('click', () => {
    formContainer.style.display = 'block';
    getUserLocation();
});

closeButton.addEventListener('click', () => {
    formContainer.style.display = 'none';
});

formContainer.addEventListener('submit', (event) => {
    event.preventDefault();

    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;

    const reportsRef = ref(db, 'reports');
    push(reportsRef, {
    location: location,
    description: description,
    category: category,
    timestamp: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
        console.log('Report added successfully!');
    })
    .catch((error) => {
        console.error('Error adding report:', error);
    });
});

function getUserLocation() {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
    } else {
    alert("Geolocation is not supported by this browser.");
    }
}

function showPosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    document.getElementById('location').value = `${latitude}, ${longitude}`;
}

function showError(error) {
    switch (error.code) {
    case error.PERMISSION_DENIED:
        alert("User denied the request for Geolocation.");
        break;
    case error.POSITION_UNAVAILABLE:
        alert("Location information is unavailable.");
        break;
    case error.TIMEOUT:
        alert("The request to get user location timed out.");
        break;
    case error.UNKNOWN_ERROR:
        alert("An unknown error occurred.");
        break;
    }
}