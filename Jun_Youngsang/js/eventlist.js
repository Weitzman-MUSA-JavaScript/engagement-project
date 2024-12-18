import { db, collection, getDocs, doc, deleteDoc, updateDoc, getDoc } from './firebase.js';

let currentMarkers = []; // An array that stores the markers displayed on the map
let activePopup = null; // A variable that stores the currently active popup

// Function to load event markers on the event list and map
async function loadEvents(map) {
  const eventListContainer = document.getElementById("eventListContainer");

  try {
    // Initialize the event list container
    eventListContainer.innerHTML = "";

    // Remove all markers from the map
    currentMarkers.forEach((marker) => marker.remove());
    currentMarkers = []; // 배열 초기화

    // Import event data from Firestore
    const querySnapshot = await getDocs(collection(db, "base_event_reports"));

    querySnapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const { latitude, longitude } = data.event_place;
      const docId = docSnapshot.id; // Import the document ID

      // Add event data to the event list container
      const listItem = document.createElement("li");
      listItem.innerHTML = `
            <div class="event-details">
            <div class="event-title"><strong>${data.event_name}</strong><br></div>
            <div>${data.event_org} (${data.event_charge})<br>
            ${new Date(data.event_timestamp_from.seconds * 1000).toLocaleString()} - 
            ${new Date(data.event_timestamp_to.seconds * 1000).toLocaleString()}</div>
            </div>
            <div class="event-buttons">
                <button class="edit-btn" data-id="${docId}">Edit</button>
                <button class="delete-btn" data-id="${docId}">Delete</button>
            </div>
      `;
      eventListContainer.appendChild(listItem);

    // FlyTo and popup event location when clicking on the event list item
    listItem.addEventListener("click", () => {
        // Remove previously active popup
        if (activePopup) {
            activePopup.remove();
          }
        map.flyTo({
        center: [longitude, latitude], 
        zoom: 14,                      
        essential: true                
        });
        // Create a new popup and add it to the map
        activePopup = new mapboxgl.Popup({ offset: 25 })
          .setLngLat([longitude, latitude])
          .setHTML(`
            <strong>${data.event_name}</strong><br>
            ${data.event_charge} (${data.event_org})<br>
            ${new Date(data.event_timestamp_from.seconds * 1000).toLocaleString()} - 
            ${new Date(data.event_timestamp_to.seconds * 1000).toLocaleString()}
          `)
          .addTo(map);
    });



      // Add markers to the map
      if (!isNaN(latitude) && !isNaN(longitude)) {
        const marker = new mapboxgl.Marker({color: "#003764"})
          .setLngLat([longitude, latitude]) // 경도, 위도 순서
          .setPopup(new mapboxgl.Popup().setHTML(`
            <strong>${data.event_name}</strong><br>
            ${data.event_charge} (${data.event_org})<br>
            ${new Date(data.event_timestamp_from.seconds * 1000).toLocaleString()} - 
            ${new Date(data.event_timestamp_to.seconds * 1000).toLocaleString()}
          `))
          .addTo(map);

        currentMarkers.push(marker); // Add the marker to the array
      }
    });

    // Add event listener to the event list container
    eventListContainer.addEventListener("click", (e) => handleListActions(e, map));

  } catch (error) {
    console.error("Error loading events: ", error);
  }
}

// Edit and delete event actions
async function handleListActions(e, map) {
    const target = e.target;
    const docId = target.getAttribute("data-id");
  
    if (target.classList.contains("delete-btn")) {
      const confirmDelete = confirm("Are you sure you want to delete this event?");
      if (confirmDelete) {
        try {
          await deleteDoc(doc(db, "base_event_reports", docId));
          alert("Event deleted successfully!");
          loadEvents(map); // Refresh the event list
        } catch (error) {
          console.error("Error deleting event: ", error);
        }
      }
    }
  
    if (target.classList.contains("edit-btn")) {
        // Fill in the edit form with the current values
        const docRef = doc(db, "base_event_reports", docId);
        const docSnapshot = await getDoc(docRef);
  
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
      
            // Fill in the form fields with the current values
            document.getElementById("event_name").value = data.event_name;
            document.getElementById("event_charge").value = data.event_charge;
            document.getElementById("event_org").value = data.event_org;
            document.getElementById("event_personnum").value = data.event_personnum;
            document.getElementById("event_place").value = `${data.event_place.latitude}, ${data.event_place.longitude}`;
            document.getElementById("event_timestamp_from").value = new Date(data.event_timestamp_from.seconds * 1000).toISOString().slice(0, 16);
            document.getElementById("event_timestamp_to").value = new Date(data.event_timestamp_to.seconds * 1000).toISOString().slice(0, 16);
            document.getElementById("event_type").value = data.event_type;
      
            // Show the Bootstrap modal
            const editModal = new bootstrap.Modal(document.getElementById("eventModal"));
            editModal.show();

            // confirmButton (Update Firestore)
            const confirmButton = document.getElementById("confirmButton");
            confirmButton.replaceWith(confirmButton.cloneNode(true)); // Remove existing event listener
            document.getElementById("confirmButton").addEventListener("click", async () => {
            try {
                const updatedData = {
                    event_name: document.getElementById("event_name").value,
                    event_charge: document.getElementById("event_charge").value,
                    event_org: document.getElementById("event_org").value,
                    event_personnum: parseInt(document.getElementById("event_personnum").value, 10),
                    event_place: {
                    latitude: parseFloat(document.getElementById("event_place").value.split(",")[0]),
                    longitude: parseFloat(document.getElementById("event_place").value.split(",")[1]),
                    },
                    event_timestamp_from: new Date(document.getElementById("event_timestamp_from").value),
                    event_timestamp_to: new Date(document.getElementById("event_timestamp_to").value),
                    event_type: document.getElementById("event_type").value,
                };

                await updateDoc(docRef, updatedData);
                alert("Event updated successfully!");
                editModal.hide(); // Close the modal
                loadEvents(map); // Refresh the event list
            } catch (error) {
            console.error("Error updating event: ", error);
        }
    });
        } else {
            alert("Document does not exist!");
        }
    }
} 

export { loadEvents };