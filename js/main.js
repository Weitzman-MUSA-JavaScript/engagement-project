import {app, analytics} from './firebase.js';
import { getReports, uploadReports, convertToGeoJSON} from './firebase.js';
const url = './data/layers/emotions_clean.geojson';

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
  button.innerText = "Let's delve into your feelings!";
  button.class ="close-popup";
  

  // Replace spinner with the button
  container.replaceChild(button, spinner);

  // Add a click event listener to the button
  button.addEventListener("click", () => {
    const elementToRemove = document.getElementById("info");
    if (elementToRemove) {
      elementToRemove.remove();
    } else {
      console.error("Element with ID 'container' not found.");
    }
    return false;
  });
}, 1000);

export {data};


