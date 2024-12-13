import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc, Timestamp, GeoPoint } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js';
import { campusMap, addLocationMarker } from './campus-map.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAPqwVqauKqTKFisAr7lF0ttvL6R8Gpizw',
  authDomain: 'javascript-engagement-project.firebaseapp.com',
  projectId: 'javascript-engagement-project',
  storageBucket: 'javascript-engagement-project.firebasestorage.app',
  messagingSenderId: '790939124899',
  appId: '1:790939124899:web:71a74343a74db1abebeb16',
  measurementId: 'G-B92S9DJ19P',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

export const darkBlueIcon = L.icon({
  iconUrl: 'images/darkbluepin.png',
  iconSize: [30, null],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

const markerGroups = {
  'discounted': [],
  'free-hot-food': [],
  'free-packaged-food': [],
  'vegetarian': [],
  'vegan': [],
};

export {app, analytics, db};

// Storing form inputs
export function initializeFoodForm() {
  console.log('Initializing food form...');
  const form = document.getElementById('food-entry-form');
  const toggleFormBtn = document.getElementById('toggle-form-btn');
  const selectMapLocationBtn = document.getElementById('select-map-location');
  const useCurrentLocationBtn = document.getElementById('use-current-location');
  const submitButton = form.querySelector('button[type="submit"]');

  if (!form || !toggleFormBtn || !selectMapLocationBtn || !useCurrentLocationBtn) {
    console.error('Form or buttons not found');
    return;
  }

  toggleFormBtn.addEventListener('click', () => {
    form.classList.toggle('hidden');
  });

  selectMapLocationBtn.addEventListener('click', () => {
    const mapClickHandler = (e) => {
      const { lat, lng } = e.latlng;
      addLocationMarker(lat, lng);
      document.getElementById('location-coordinates').value = `${lat}, ${lng}`;
      campusMap.off('click', mapClickHandler);
    };

    campusMap.on('click', mapClickHandler);
    alert('Click on the map to select a location');
  });

  useCurrentLocationBtn.addEventListener('click', () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          addLocationMarker(lat, lng);
          document.getElementById('location-coordinates').value = `${lat}, ${lng}`;
        },
        () => alert('Unable to retrieve your location'),
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';

    const locationValue = document.getElementById('location-coordinates').value;
    console.log('Location value:', locationValue);
    const location = locationValue.split(',').map((coord) => parseFloat(coord.trim()));
    console.log('Parsed location array:', location);
    if (isNaN(location[0]) || isNaN(location[1])) {
      console.error('Invalid coordinates:', location);
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
      return;
    }
    const locationDescription = document.getElementById('location-description').value;
    const foodDescription = document.getElementById('food-description').value;
    const photo = document.getElementById('food-photo').files[0];
    const foodOptions = Array.from(document.querySelectorAll('input[name="food-category"]:checked'))
      .filter((option) => ['discounted', 'free-hot-food', 'free-packaged-food'].includes(option.value))
      .map((option) => option.value);

    const dietaryOptions = Array.from(document.querySelectorAll('input[name="food-category"]:checked'))
      .filter((option) => ['vegetarian', 'vegan'].includes(option.value))
      .map((option) => option.value);

    console.log('Form inputs:', { location, locationDescription, foodDescription, photo, foodOptions, dietaryOptions });

    if (location.length === 2 && foodDescription && photo) {
      const reader = new FileReader();
      reader.onload = async function(event) {
        const photoBase64 = event.target.result;

        try {
          const docRef = await addDoc(collection(db, 'foodLocations'), {
            location: new GeoPoint(location[0], location[1]),
            locationDescription,
            foodDescription,
            photo: photoBase64,
            foodOptions,
            dietaryOptions,
            timestamp: Timestamp.fromDate(new Date()),
          });
          console.log('Document written with ID: ', docRef.id);
          await loadMarkers();
          alert('Location added successfully!');
        } catch (error) {
          console.error('Error adding document:', error);
          alert('Failed to add location. Try again.');
        } finally {
          submitButton.disabled = false;
          submitButton.textContent = 'Submit';
        }
      };
      reader.readAsDataURL(photo);
    } else {
      alert('Please fill out all fields correctly.');
      submitButton.disabled = false;
      submitButton.textContent = 'Submit';
    }
  });
}

// Close button for form
export function initializeCloseButton() {
  const closeButton = document.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    const form = document.getElementById('food-entry-form');
    if (form) {
      form.classList.add('hidden');
    } else {
      console.error('Form element not found!');
    }
  });
}

// Load markers showing food pop-ups
export async function loadMarkers() {
  async function generatePopupContent(docSnapshot, data) {
    const commentsSnapshot = await getDocs(collection(db, `foodLocations/${docSnapshot.id}/comments`));
    const comments = [];
    commentsSnapshot.forEach((commentDoc) => {
      comments.push({
        id: commentDoc.id,
        ...commentDoc.data(),
      });
    });

    function formatOption(option) {
      return option.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    const timestamp = data.timestamp ? data.timestamp.toDate() : new Date();
    const formattedDate = timestamp.toLocaleString();

    const expirationTime = new Date(timestamp);

    if (data.foodOptions.includes('free-hot-food')) {
      expirationTime.setHours(expirationTime.getHours() + 2000); // Adjust to 2 hours for free-hot-food, left at 2000 for demonstration purposes
    } else if (data.foodOptions.includes('discounted') || data.foodOptions.includes('free-packaged-food')) {
      expirationTime.setHours(expirationTime.getHours() + 4000); // Adjust to 4 hours for discounted or free-packaged-food, left at 4000 for demonstration purposes
    }

    const currentTime = new Date();
    const isExpired = currentTime > expirationTime;

    if (isExpired) {
      return null;
    }

    return `
      <div>
        <div style="text-align: right; font-style: italic; margin-bottom: 10px;">
          <p>${formattedDate}</p>
        </div>
        <h4 class="popup-header">Location Description:</h4>
        <p class="popup-paragraph">${data.locationDescription}</p>
        <h4 class="popup-header">Food Description:</h4>
        <p class="popup-paragraph">${data.foodDescription}</p>
        <h4 class="popup-header">Food Photo:</h4>
        <img src="${data.photo}" alt="Food Image" class="popup-image">
        <h4>Food Options:</h4>
        <ul class="popup-list">
          ${data.foodOptions.map((option) => `<li>${formatOption(option)}</li>`).join('')}
        </ul>
        <h4 class="popup-header">Dietary Options:</h4>
        <ul class="popup-list">
          ${data.dietaryOptions.map((option) => `<li>${formatOption(option)}</li>`).join('')}
        </ul>
        <div class="comments-section">
          ${comments.map((comment) => `
            <div class="comment">
              <p>${comment.text}</p>
              <small>${new Date(comment.timestamp.toDate()).toLocaleString()}</small>
            </div>
          `).join('')}
        </div>
        <div class="comment-form">
          <textarea id="comment-${docSnapshot.id}" placeholder="Add a comment about the status of food left"></textarea>
          <button class="add-comment-btn" data-doc-id="${docSnapshot.id}">Add Comment</button>
        </div>
      </div>
    `;
  }

  // Add comments to food marker pop-ups
  async function addComment(docId, marker) {
    const commentText = document.getElementById(`comment-${docId}`).value;
    if (!commentText.trim()) {
      alert('Please enter a comment');
      return;
    }

    try {
      await addDoc(collection(db, `foodLocations/${docId}/comments`), {
        text: commentText,
        timestamp: Timestamp.fromDate(new Date()),
      });

      document.getElementById(`comment-${docId}`).value = '';

      const docRef = doc(db, 'foodLocations', docId);
      const docSnapshot = await getDoc(docRef);
      const data = docSnapshot.data();

      const newPopupContent = await generatePopupContent(docSnapshot, data);
      marker.setPopupContent(newPopupContent);
      marker.openPopup();
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  }

  try {
    const snapshot = await getDocs(collection(db, 'foodLocations'));
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();

      if (data.location && data.location.latitude !== undefined && data.location.longitude !== undefined) {
        const popupContent = await generatePopupContent(docSnapshot, data);

        if (popupContent === null) {
          continue;
        }

        const marker = L.marker([data.location.latitude, data.location.longitude], {
          icon: darkBlueIcon,
          foodOptions: data.foodOptions,
          dietaryOptions: data.dietaryOptions,
        });

        marker.bindPopup(popupContent);

        marker.on('popupopen', () => {
          const addCommentBtn = document.querySelector(`[data-doc-id="${docSnapshot.id}"]`);
          if (addCommentBtn) {
            addCommentBtn.addEventListener('click', async () => {
              await addComment(docSnapshot.id, marker);
            });
          }
        });

        data.foodOptions.forEach((option) => {
          if (markerGroups[option]) {
            markerGroups[option].push(marker);
          }
        });
        data.dietaryOptions.forEach((option) => {
          if (markerGroups[option]) {
            markerGroups[option].push(marker);
          }
        });

        marker.addTo(campusMap);
      }
    }
  } catch (error) {
    console.error('Error loading markers:', error);
  }
}

// Filter based on food options and dietary options checkboxes
export function initializeFilters() {
  const checkboxes = document.querySelectorAll('.filter-container input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', filterMarkers);
  });
  filterMarkers();
}

function filterMarkers() {
  const foodCheckboxes = document.querySelectorAll('.filter-container input[type="checkbox"]:not(.vegan-checkbox):not(.vegetarian-checkbox)');
  const dietaryCheckboxes = document.querySelectorAll('.filter-container input.vegan-checkbox, .filter-container input.vegetarian-checkbox');

  const selectedFoodOptions = Array.from(foodCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.id.replace('-checkbox', ''));

  const selectedDietaryOptions = Array.from(dietaryCheckboxes)
    .filter((cb) => cb.checked)
    .map((cb) => cb.id.replace('-checkbox', ''));

  Object.values(markerGroups).flat().forEach((marker) => {
    const markerFoodOptions = marker.options.foodOptions || [];
    const markerDietaryOptions = marker.options.dietaryOptions || [];

    const matchesFood = selectedFoodOptions.length === 0 ||
      markerFoodOptions.some((option) =>
        selectedFoodOptions.some((selected) => option.includes(selected)),
      );

    const matchesDietary = selectedDietaryOptions.length === 0 ||
      selectedDietaryOptions.every((option) => markerDietaryOptions.includes(option));

    const isVisible = matchesFood && matchesDietary;
    if (isVisible) {
      campusMap.addLayer(marker);
    } else {
      campusMap.removeLayer(marker);
    }
  });
}
