import {app, analytics} from './firebase.js';
import { getReports, uploadReports, convertToGeoJSON} from './firebase.js';
const url = './data/layers/emotions_clean.geojson';
// Main icon
const logo = document.createElement("img");
logo.src = "data/icons/opine-logo.svg"; // Path to the SVG file
logo.alt = "My Happy SVG"; // Alternative text for accessibility
logo.style.height = "50px"; // Optional: Set a height for the image
logo.style.width = "50px";  // Optional: Set a width for the image


async function getData(url) {
  const response = await fetch(url);

  return response.json();
}
app;

// it is better for people to not have to log in
// const data = await getData(url);
const reportsJSON = await getReports();
const data= await convertToGeoJSON(reportsJSON);
console.log('main data loaded', data );
// console.log('sub data loaded', reports)
// uploadReports(data)

setTimeout(() => {
  const container = document.getElementById("spinner-holder");
  const spinner = document.getElementById("spinner");

  // Create a button
  const button = document.createElement("button");
  button.type = "button";
  button.class ="close-popup";
  button.appendChild(logo);
  button.style.border = "none";  // Remove border
  button.style.background = "none";  // Remove background
  button.style.padding = "10px 20px";  // Optional: Add some padding for better appearance
  button.style.cursor = "pointer";  
  // Add hover effect using CSS

  // Replace spinner with the button
  container.replaceChild(button, spinner);
// Add hover effect using CSS
  button.addEventListener("mouseenter", () => {
    logo.style.filter = "invert(1)"; // Brighten the SVG on hover
    logo.style.transition = "filter 0.3s ease";
  });

  button.addEventListener("mouseleave", () => {
    logo.style.filter = "invert(1)"; // Reset brightness
  });
  // Add a click event listener to the button
  button.addEventListener("click", () => {
    const elementToFade = document.getElementById("info");
    if (elementToFade) {
      // Add the fade-out class
      elementToFade.classList.add("fade-out");
    
      // Wait for the transition to complete, then remove the element
      elementToFade.addEventListener("transitionend", () => {
        elementToFade.remove();
      }, { once: true }); // Use { once: true } to remove the event listener after it fires
    } else {
      console.error("Element with ID 'info' not found.");
    }
    return false;
  });
}, 1000);

export {data};




