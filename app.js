let map;
let directionsService;
let directionsRenderer;
let stopCount = 0;
let startMarker;
let destinationMarker;
let selecting = '';  // Indicates whether we're selecting 'start' or 'destination'
let geocoder;        // Initialize Geocoder for reverse geocoding

// Initialize Google Maps and Places Autocomplete
function initMap() {
  try {
    // Initialize the map
    map = new google.maps.Map(document.getElementById('map'), {
      center: { lat: 39.9526, lng: -75.1652 }, // Paris coordinates
      zoom: 13,
      mapId: '481396a3f2e286b5' // Optional: Apply a specific Map ID if available
    });

    // Initialize direction services
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Initialize the Geocoder
    geocoder = new google.maps.Geocoder();

    // Enable autocomplete for start and destination fields
    const autocompleteStart = new google.maps.places.Autocomplete(document.getElementById('start'));
    const autocompleteDestination = new google.maps.places.Autocomplete(document.getElementById('destination'));

    // Add click event listener to the map for picking locations
    map.addListener('click', (event) => {
      if (selecting === 'start') {
        setStartLocation(event.latLng);
      } else if (selecting === 'destination') {
        setDestinationLocation(event.latLng);
      }
    });

    // Fetch dynamic recommendations when the start location changes
    autocompleteStart.addListener('place_changed', fetchRecommendations);

  } catch (error) {
    console.error('Error initializing map:', error);
  }
}

// Reverse geocode to get the place name for start location
function setStartLocation(location) {
  if (startMarker) {
    startMarker.setMap(null);
  }

  startMarker = new google.maps.Marker({
    position: location,
    map: map,
    title: 'Start Location'
  });

  geocoder.geocode({ location: location }, function (results, status) {
    if (status === 'OK' && results[0]) {
      document.getElementById('start').value = results[0].formatted_address;
    } else {
      console.error('Geocoder failed due to: ' + status);
      document.getElementById('start').value = location.lat() + ', ' + location.lng();
    }
  });

  selecting = '';
}

// Reverse geocode to get the place name for destination location
function setDestinationLocation(location) {
  if (destinationMarker) {
    destinationMarker.setMap(null);
  }

  destinationMarker = new google.maps.Marker({
    position: location,
    map: map,
    title: 'Destination Location'
  });

  geocoder.geocode({ location: location }, function (results, status) {
    if (status === 'OK' && results[0]) {
      document.getElementById('destination').value = results[0].formatted_address;
    } else {
      console.error('Geocoder failed due to: ' + status);
      document.getElementById('destination').value = location.lat() + ', ' + location.lng();
    }
  });

  selecting = '';
}
document.getElementById("addStop").addEventListener("click", () => {
  const stopsContainer = document.getElementById("extraStopsContainer");

  const stopItem = document.createElement("div");
  stopItem.classList.add("location-section");

  // Create stop input
  const stopInput = document.createElement("input");
  stopInput.type = "text";
  stopInput.classList.add("search-bar");
  stopInput.placeholder = "Enter Stop Location";

   // Initialize Google Places Autocomplete for the new input
   const autocomplete = new google.maps.places.Autocomplete(stopInput);
   autocomplete.addListener("place_changed", () => {
     const place = autocomplete.getPlace();
     console.log("Selected Stop:", place.formatted_address);
   });
   document.getElementById("searchNearby").addEventListener("click", () => {
    const type = document.querySelector('input[name="placeType"]:checked').value;
    const minRating = document.getElementById("minRating").value;
    const keyword = document.getElementById("keyword").value;
  
    fetchRecommendations(type, keyword, minRating);
  });
  
  function fetchRecommendations(type, keyword, minRating) {
    const service = new google.maps.places.PlacesService(map);
    const location = map.getCenter();
  
    const request = {
      location: location,
      radius: 5000,
      type: type,
      keyword: keyword,
    };
  
    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        const filteredResults = results.filter((place) => place.rating >= minRating);
        displayRecommendations(filteredResults);
      } else {
        console.error("Places API error:", status);
      }
    });
  }
  
  function displayRecommendations(places) {
    const recommendationsContainer = document.getElementById("recommendations");
    recommendationsContainer.innerHTML = "";
  
    places.forEach((place) => {
      const placeContainer = document.createElement("div");
      placeContainer.classList.add("place-container");
  
      const name = document.createElement("h5");
      name.textContent = place.name;
  
      const rating = document.createElement("p");
      rating.textContent = `Rating: ${place.rating || "N/A"}`;
  
      const address = document.createElement("p");
      address.textContent = place.vicinity || "Address not available";
  
      const openButton = document.createElement("button");
      openButton.textContent = "Open in Google Maps";
      openButton.classList.add("uber-btn");
      openButton.addEventListener("click", () => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${place.place_id}`, "_blank");
      });
  
      const addButton = document.createElement("button");
      addButton.textContent = "Add as Stop";
      addButton.classList.add("uber-btn");
      addButton.addEventListener("click", () => addPlaceAsStop(place));
  
      placeContainer.appendChild(name);
      placeContainer.appendChild(rating);
      placeContainer.appendChild(address);
      placeContainer.appendChild(openButton);
      placeContainer.appendChild(addButton);
  
      recommendationsContainer.appendChild(placeContainer);
    });
  }
  

  // Create duration selector
  const durationSelect = document.createElement("select");
  durationSelect.classList.add("duration-selector");
  for (let i = 1; i <= 24; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${i} hr${i > 1 ? "s" : ""}`;
    durationSelect.appendChild(option);
  }

  // Create delete button
  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.classList.add("uber-btn");
  deleteButton.style.backgroundColor = "#dc3545";
  deleteButton.addEventListener("click", () => {
    stopItem.remove();
  });

  // Append elements to stop item
  stopItem.appendChild(stopInput);
  stopItem.appendChild(durationSelect);
  stopItem.appendChild(deleteButton);

  // Append stop item to stops container
  stopsContainer.appendChild(stopItem);
});
document.getElementById("swapLocations").addEventListener("click", () => {
  // Swap location inputs
  const startInput = document.getElementById("start");
  const destinationInput = document.getElementById("destination");
  const tempLocation = startInput.value;
  startInput.value = destinationInput.value;
  destinationInput.value = tempLocation;

  // Swap duration selectors
  const startDuration = document.getElementById("startDuration");
  const destinationDuration = document.getElementById("destinationDuration");
  const tempDuration = startDuration.value;
  startDuration.value = destinationDuration.value;
  destinationDuration.value = tempDuration;
});



// Function to calculate route with stops and duration
function handleFareEstimation() {
  const startLocation = document.getElementById('start').value;
  const destination = document.getElementById('destination').value;
  const startDuration = parseInt(document.getElementById('startDuration').value);
  const destinationDuration = parseInt(document.getElementById('destinationDuration').value);

  let waypoints = [];
  let totalStopDuration = startDuration + destinationDuration;

  const recommendedStops = document.querySelectorAll('#recommendedStops input[type="checkbox"]:checked');
  const extraStops = document.querySelectorAll('.extra-stop-container');

  recommendedStops.forEach(stop => {
    waypoints.push({ location: stop.value, stopover: true });
  });

  extraStops.forEach(stopContainer => {
    const stopInput = stopContainer.querySelector('input').value;
    const stopDuration = parseInt(stopContainer.querySelector('select').value);

    if (stopInput) {
      waypoints.push({ location: stopInput, stopover: true });
      totalStopDuration += stopDuration;
    }
  });

  if (startLocation && destination) {
    const request = {
      origin: startLocation,
      destination: destination,
      waypoints: waypoints,
      travelMode: 'DRIVING',
    };

    directionsService.route(request, function (result, status) {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);

        let totalDistance = 0;
        let totalDrivingTime = 0;
        result.routes[0].legs.forEach(leg => {
          totalDistance += leg.distance.value;
          totalDrivingTime += leg.duration.value;
        });

        const drivingHours = Math.floor(totalDrivingTime / 3600);
        const drivingMinutes = Math.floor((totalDrivingTime % 3600) / 60);

        const totalTripHours = drivingHours + totalStopDuration;
        document.getElementById('fareOutput').innerText = `Total Distance: ${(totalDistance / 1000).toFixed(2)} km \nTotal Driving Time: ${drivingHours} hrs ${drivingMinutes} mins \nTotal Trip Duration (with stops): ${totalTripHours} hrs ${drivingMinutes} mins`;
      } else {
        alert('Could not calculate route: ' + status);
      }
    });
  } else {
    alert('Please enter both starting location and destination.');
  }
}

// Display restaurant results
function displayRestaurantResults(businesses) {
  const restaurantsContainer = document.getElementById('extraStopsContainer');
  restaurantsContainer.innerHTML = ''; // Clear previous results

  businesses.forEach((business) => {
    const businessContainer = document.createElement('div');
    businessContainer.classList.add('restaurant-container');

    const restaurantName = document.createElement('h5');
    restaurantName.innerText = business.name;

    const rating = document.createElement('p');
    rating.innerText = `Rating: ${business.rating} (${business.review_count} reviews)`;

    const address = document.createElement('p');
    address.innerText = business.location.address1;

    const button = document.createElement('button');
    button.classList.add('uber-btn');
    button.innerText = 'Add as Stop';
    button.addEventListener('click', () => {
      addRestaurantAsStop(business);
    });

    businessContainer.appendChild(restaurantName);
    businessContainer.appendChild(rating);
    businessContainer.appendChild(address);
    businessContainer.appendChild(button);

    restaurantsContainer.appendChild(businessContainer);
  });
}

// Add restaurant as stop
function addRestaurantAsStop(business) {
  const extraStopsContainer = document.getElementById('extraStopsContainer');
  const stopContainer = document.createElement('div');
  stopContainer.classList.add('extra-stop-container');

  const stopInput = document.createElement('input');
  stopInput.setAttribute('type', 'text');
  stopInput.value = business.name;
  stopInput.classList.add('inputs');

  const durationSelect = document.createElement('select');
  durationSelect.classList.add('duration-selector');
  for (let i = 1; i <= 24; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `${i} hr${i > 1 ? 's' : ''}`;
    durationSelect.appendChild(option);
  }

  const deleteButton = document.createElement('button');
  deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
  deleteButton.classList.add('delete-stop');
  deleteButton.addEventListener('click', function () {
    stopContainer.remove();
  });

  stopContainer.appendChild(stopInput);
  stopContainer.appendChild(durationSelect);
  stopContainer.appendChild(deleteButton);
  extraStopsContainer.appendChild(stopContainer);
}

// Event listener for fetching restaurants
document.getElementById('searchRestaurant').addEventListener('click', fetchRestaurants);
function addPlaceAsStop(place) {
  const itineraryTableBody = document.getElementById("itineraryTableBody");
  const totalDurationEl = document.getElementById("totalDuration");

  const row = document.createElement("tr");
  row.classList.add("itinerary-row");

  // Increment row index
  const indexCell = document.createElement("td");
  indexCell.textContent = itineraryTableBody.children.length + 1;

  // Location name
  const locationCell = document.createElement("td");
  locationCell.textContent = place.name;

  // Duration input
  const durationCell = document.createElement("td");
  const durationInput = document.createElement("input");
  durationInput.type = "number";
  durationInput.value = 1;
  durationInput.min = 0.5;
  durationInput.step = 0.5;
  durationInput.addEventListener("change", updateTotalDuration);
  durationCell.appendChild(durationInput);

  // Notes section
  const notesCell = document.createElement("td");
  const notesInput = document.createElement("textarea");
  notesInput.placeholder = "Add notes...";
  notesCell.appendChild(notesInput);

  // Actions
  const actionsCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Remove";
  deleteButton.classList.add("uber-btn");
  deleteButton.style.backgroundColor = "#dc3545";
  deleteButton.addEventListener("click", () => {
    row.remove();
    updateTotalDuration();
    updateGoogleMapsLink();
  });
  actionsCell.appendChild(deleteButton);

  // Append cells to row
  row.appendChild(indexCell);
  row.appendChild(locationCell);
  row.appendChild(durationCell);
  row.appendChild(notesCell);
  row.appendChild(actionsCell);

  // Append row to table
  itineraryTableBody.appendChild(row);

  // Update total duration and Google Maps link
  updateTotalDuration();
  updateGoogleMapsLink();
}
// Global Itinerary Array
let itinerary = []; // Stores all stops in the itinerary

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  const calculateItineraryButton = document.getElementById("calculateItinerary");
  if (calculateItineraryButton) {
    calculateItineraryButton.addEventListener("click", () => {
      updateItineraryTable();
      updateTotalDuration();
      updateGoogleMapsLink();
    });
  }
});

// Function to Add a Place as a Stop
function addPlaceAsStop(place) {
  const stopData = {
    type: "stop", // Default type for additional stops
    location: place.name,
    duration: 1, // Default duration in hours
    notes: "", // Empty notes by default
  };

  const itineraryTableBody = document.getElementById("itineraryTableBody");
  if (!itineraryTableBody) {
    console.error("Itinerary table body not found. Check your HTML structure.");
  }

  itinerary.push(stopData); // Add stop to the itinerary
  console.log("Itinerary updated:", itinerary); // Debug
  updateItineraryTable(); // Update the table
}

// Update the Itinerary Table
function updateItineraryTable() {
  const itineraryTableBody = document.getElementById("itineraryTableBody");
  itineraryTableBody.innerHTML = ""; // Clear the existing table

  if (itinerary.length === 0) {
    itineraryTableBody.innerHTML = "<tr><td colspan='5'>No stops added yet.</td></tr>";
    return;
  }

  itinerary.forEach((stop, index) => {
    const row = document.createElement("tr");

    // Stop Index
    const indexCell = document.createElement("td");
    indexCell.textContent = index + 1;

    // Location
    const locationCell = document.createElement("td");
    locationCell.textContent = stop.location;

    // Duration
    const durationCell = document.createElement("td");
    const durationInput = document.createElement("input");
    durationInput.type = "number";
    durationInput.value = stop.duration;
    durationInput.min = 0.5;
    durationInput.step = 0.5;
    durationInput.addEventListener("change", (e) => {
      stop.duration = parseFloat(e.target.value);
      updateTotalDuration();
    });
    durationCell.appendChild(durationInput);

    // Notes
    const notesCell = document.createElement("td");
    const notesInput = document.createElement("textarea");
    notesInput.value = stop.notes;
    notesInput.placeholder = "Add notes...";
    notesInput.addEventListener("input", (e) => {
      stop.notes = e.target.value;
    });
    notesCell.appendChild(notesInput);

    // Actions
    const actionsCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Remove";
    deleteButton.classList.add("uber-btn");
    deleteButton.style.backgroundColor = "#dc3545";
    deleteButton.addEventListener("click", () => {
      itinerary.splice(index, 1); // Remove stop from the array
      updateItineraryTable(); // Refresh the table
    });
    actionsCell.appendChild(deleteButton);

    // Append cells to row
    row.appendChild(indexCell);
    row.appendChild(locationCell);
    row.appendChild(durationCell);
    row.appendChild(notesCell);
    row.appendChild(actionsCell);

    // Append row to table body
    itineraryTableBody.appendChild(row);
  });
}

// Update Total Trip Duration
function updateTotalDuration() {
  const totalDurationEl = document.getElementById("totalDuration");
  const totalDuration = itinerary.reduce((sum, stop) => sum + stop.duration, 0);
  totalDurationEl.textContent = `${totalDuration.toFixed(1)} hrs`;
}

// Update Google Maps Link
function updateGoogleMapsLink() {
  const googleMapsLink = document.getElementById("googleMapsLink");
  if (itinerary.length > 0) {
    const query = itinerary.map((stop) => stop.location).join(" to ");
    googleMapsLink.href = `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(query)}`;
    googleMapsLink.disabled = false;
  } else {
    googleMapsLink.disabled = true;
  }
}

// Set Start Location
function setStartLocation(location) {
  const address = document.getElementById("start").value;
  const existingIndex = itinerary.findIndex((stop) => stop.type === "start");

  if (existingIndex >= 0) {
    itinerary[existingIndex].location = address;
  } else {
    itinerary.unshift({
      type: "start",
      location: address,
      duration: 0,
      notes: "",
    });
  }

  updateItineraryTable();
}

// Set Destination Location
function setDestinationLocation(location) {
  const address = document.getElementById("destination").value;
  const existingIndex = itinerary.findIndex((stop) => stop.type === "destination");

  if (existingIndex >= 0) {
    itinerary[existingIndex].location = address;
  } else {
    itinerary.push({
      type: "destination",
      location: address,
      duration: 0,
      notes: "",
    });
  }

  updateItineraryTable();
}
document.getElementById("calculateItinerary").addEventListener("click", () => {
  updateItineraryTable();
  updateTotalDuration();
});
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

// Initialize Firestore
const db = getFirestore(app);

// Initialize Authentication
const auth = getAuth(app);

// Example: Add a document to Firestore
async function saveItinerary(itinerary) {
  try {
    const docRef = await addDoc(collection(db, "itineraries"), itinerary);
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Example: User Authentication
function userSignUp(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      console.log("User signed up:", userCredential.user);
    })
    .catch((error) => {
      console.error("Error signing up:", error.message);
    });
}
document.getElementById("saveItinerary").addEventListener("click", () => {
  const userId = auth.currentUser?.uid; // Ensure the user is logged in
  if (!userId) {
    alert("Please log in to save your itinerary.");
    return;
  }

  const itinerary = {
    userId: userId,
    tripDetails: itineraryArray, // Replace with your actual itinerary array
    timestamp: new Date(),
  };

  saveItinerary(itinerary); // Call the Firestore save function
});
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "your_email@gmail.com",
    pass: "your_email_password",
  },
});

exports.sendItinerary = functions.https.onCall(async (data, context) => {
  const { email, itinerary } = data;

  const mailOptions = {
    from: "your_email@gmail.com",
    to: email,
    subject: "Your Trip Itinerary",
    text: `Here's your itinerary:\n${JSON.stringify(itinerary, null, 2)}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-functions.js";

const functions = getFunctions(app);
const sendItinerary = httpsCallable(functions, "sendItinerary");

document.getElementById("shareItinerary").addEventListener("click", () => {
  const email = prompt("Enter the email to share the itinerary:");
  if (!email) return;

  sendItinerary({ email: email, itinerary: itineraryArray })
    .then((result) => {
      console.log("Email sent:", result.data);
    })
    .catch((error) => {
      console.error("Error sending email:", error.message);
    });
});



function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(() => {
      const authInstance = gapi.auth2.getAuthInstance();
      document.getElementById("authorizeButton").onclick = () => {
        authInstance.signIn().then(() => {
          console.log("User signed in");
        });
      };
      document.getElementById("signOutButton").onclick = () => {
        authInstance.signOut().then(() => {
          console.log("User signed out");
        });
      };
    })
    .catch((error) => {
      console.error("Error initializing Google API client:", error);
    });
}

document.addEventListener("DOMContentLoaded", handleClientLoad);

function createCalendarEvent(itinerary) {
  itinerary.forEach((stop) => {
    const event = {
      summary: stop.location,
      description: stop.notes || "No additional notes provided.",
      start: {
        dateTime: new Date().toISOString(), // Replace with actual start time
        timeZone: "America/New_York", // Adjust for your timezone
      },
      end: {
        dateTime: new Date(new Date().getTime() + stop.duration * 3600000).toISOString(), // Adjust duration
        timeZone: "America/New_York",
      },
    };

    gapi.client.calendar.events
      .insert({
        calendarId: "primary",
        resource: event,
      })
      .then((response) => {
        console.log("Event created:", response.result.htmlLink);
        alert(`Event created: ${response.result.htmlLink}`);
      })
      .catch((error) => {
        console.error("Error creating event:", error);
      });
  });
}

document.getElementById("saveToCalendar").addEventListener("click", () => {
  createCalendarEvent(itinerary); // Pass your itinerary array here
});
<button id="saveToCalendar">Save Itinerary to Calendar</button>
