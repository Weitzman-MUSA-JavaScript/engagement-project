import {app, analytics} from './firebase.js'
import { getReports, uploadReports , convertToGeoJSON} from "./firebase.js";
var url = './data/layers/emotions_clean.geojson';

async function getData(url) {
  const response = await fetch(url);

  return response.json();
}
app

//it is better for people to not have to log in
//const data = await getData(url);
const reportsJSON = await getReports()
const data= await convertToGeoJSON(reportsJSON)
console.log('main data loaded', data )
//console.log('sub data loaded', reports)
//uploadReports(data)
export{data}




  
  
  
