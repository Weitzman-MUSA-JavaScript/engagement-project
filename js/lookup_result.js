import { getDataFS } from "./firebase.js";

// Pulls the results from the FB database and displays them on the map
async function loadResult(sessionID) {
  const responsesRaw = await getDataFS("user-responses");

  const responsesProcessed = responsesRaw.map((e) => JSON.parse(e.response));

  const responses = responsesProcessed.filter( (e) => e.sessionID == sessionID );

  // Loads the answers from all three questions
  const responseGeoJSON = responses.map((e) => responseToFeature(e,1))
    .concat( responses.map((e) => responseToFeature(e,2)) )
    .concat( responses.map((e) => responseToFeature(e,3)) );

  return ( responseGeoJSON );
}

// INTERIM MEASURE
function responseToFeature(response, qnNumber) {
  return {
    type: 'Feature',
    properties: {
      "username": response.username,
      "icon": response.icon,
      "qnNumber": qnNumber,
    },
    geometry: {
      type: 'Point',
      coordinates: [response["ans" + qnNumber].lon, response["ans" + qnNumber].lat],
    }
  };
}


export { loadResult };