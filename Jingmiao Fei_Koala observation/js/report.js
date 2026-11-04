import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { db } from "./firebase-config.js";
import {mapboxglAccessToken} from "./map.js"

// 定义澳大利亚省份的合法名称
const AUSTRALIAN_PROVINCES = ["New South Wales", "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia", "Northern Territory", "Australian Capital Territory"];

function setupReportForm(map, chart, loadDataFromFirestore) {
  const form = document.getElementById("koala-form");
  const getLocationButton = document.getElementById("get-location");
  const clickMapButton = document.getElementById("click-on-map");
  const latitudeInput = document.getElementById("latitude");
  const longitudeInput = document.getElementById("longitude");

  let currentMarker = null; // 用于存储当前标记

  // 反向地理编码函数：根据经纬度获取省份
  async function getProvinceFromCoordinates(lat, lon) {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxglAccessToken}`;
    try {
      const response = await fetch(url);
      const data = await response.json();

      // 检查返回的地理信息
      const context = data.features[0]?.context || [];
      let province = "Others"; // 默认值为 "Others"
      let country = null;

      for (const entry of context) {
        if (entry.id.startsWith("region")) {
          // 如果找到省份，将其临时存储为 `province`
          province = entry.text;
        }
        if (entry.id.startsWith("country")) {
          // 获取国家名称
          country = entry.text;
        }
      }

      // 确保点击位置在澳大利亚境内，并且省份在指定列表中
      if (country === "Australia" && AUSTRALIAN_PROVINCES.includes(province)) {
        return province;
      } else {
        return "Others"; // 如果不在澳大利亚境内，或省份无效，返回 "Others"
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
      return "Unknown"; // 如果出错，返回 Unknown
    }
  }

  // 点击地图功能
  clickMapButton.addEventListener("click", () => {
    alert("Click on the map to select a location.");
    const clickHandler = (event) => {
      const { lng, lat } = event.lngLat; // 获取地图点击的经纬度

      // 填充经纬度输入框
      latitudeInput.value = lat.toFixed(3); // 保留3位小数
      longitudeInput.value = lng.toFixed(3); // 保留3位小数

      // 移除之前的标记
      if (currentMarker) {
        currentMarker.remove();
      }

      // Create a custom marker using an HTML element
      const markerElement = document.createElement('div');
      markerElement.className = 'custom-marker';

      // 在地图上添加新的标记
      currentMarker = new mapboxgl.Marker({ element: markerElement }) // Use the custom element
      .setLngLat([lng, lat])
      .addTo(map);

      map.off("click", clickHandler); // 移除地图的点击事件监听器
    };

    map.on("click", clickHandler); // 启用地图点击事件监听器
  });

  // 为 "Get Current Location" 按钮添加事件监听器
  getLocationButton.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          latitudeInput.value = latitude.toFixed(3); // 保留3位小数
          longitudeInput.value = longitude.toFixed(3);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location. Please enter it manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  });

  // 表单提交处理
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const latitude = parseFloat(latitudeInput.value); // 获取纬度
    const longitude = parseFloat(longitudeInput.value); // 获取经度
    const date = document.getElementById("date").value;
    const number = parseInt(document.getElementById("number").value);
    const description = document.getElementById("description").value;
    const year = parseInt(date.split("-")[0]);

    // 确保纬度和经度有效
    if (isNaN(latitude) || isNaN(longitude) || latitude > 90 || latitude < -90 || longitude > 180 || longitude < -180) {
      alert("Please enter valid latitude and longitude values.");
      return;
    }

    // 根据经纬度获取省份
    const province = await getProvinceFromCoordinates(latitude, longitude);

    const koalaObservationsRef = collection(db, "koalaObservations");

    // 添加新的观察记录
    addDoc(koalaObservationsRef, {
      location: { lat: latitude, lon: longitude },
      date,
      year,
      province, // 自动获取的省份
      numberOfKoalas: number,
      description,
      timestamp: serverTimestamp(),
    })
      .then(() => {
        alert("Observation submitted!");
        form.reset();
        loadDataFromFirestore(map, chart, "all", []); // 提交后刷新数据

        // 移除地图上的标记
        if (currentMarker) {
          currentMarker.remove();
          currentMarker = null;
        }
      })
      .catch((error) => {
        console.error("Error adding document: ", error);
      });
  });
}

export { setupReportForm };
