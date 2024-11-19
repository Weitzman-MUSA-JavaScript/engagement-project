
async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip; // Return the IP address
    } catch (error) {
        console.error("Error fetching IP address:", error);
        return null; // Return null if the IP cannot be fetched
    }
}
async function saveData(lng, lat) {
    const comment_EN = document.getElementById('comment').value;
    const sentiment = document.getElementById('sentiment-indicator').value;
    const timestamp = new Date().toISOString();
    const ipAddress = await getIPAddress(); // Get the user's IP address

    const data = { lng, lat, comment_EN, sentiment, timestamp, ipAddress };

    try {
        // Save to Firestore
        const docRef = await addDoc(collection(db, 'opinion_records'), data);
        console.log('Document written with ID:', docRef.id);
        alert('Data saved to Firestore!');
    } catch (error) {
        console.error('Error adding document:', error);
        alert('Failed to save data.');
    }

    // Close the popup
    document.querySelector('.mapboxgl-popup-close-button').click();
}

export {saveData, getIPAddress}