// navigation.js

import { loadCreativeMode } from './creative.js';
import { loadGalleryMode } from './gallery.js';
import { loadStoryMode } from './storymap.js';

document.getElementById('creative-mode-btn').addEventListener('click', () => {
    // Clear the content of the description-panel
    let contentPanel = document.getElementById('description-panel');
    contentPanel.innerHTML = '';  

    loadCreativeMode();
});

document.getElementById('explore-ideas-btn').addEventListener('click', () => {
    // Clear the content of the description-panel
    let contentPanel = document.getElementById('description-panel');
    contentPanel.innerHTML = '';  

    loadGalleryMode();
});

document.getElementById('history-btn').addEventListener('click', () => {
    // Clear the content of the description-panel
    let contentPanel = document.getElementById('description-panel');
    contentPanel.innerHTML = '';  

    loadStoryMode();
    setLayerOpacityToZero(map, 'A-grid-20241116-3');
    setLayerOpacityToZero(map, 'A-roads-all');
    setLineOpacityToZero(map, 'CRL_with_extension_20241104');
    setLineOpacityToZero(map, 'MRTLines_20241113_future');
    setTextOpacityToZero(map, 'tekong_districts');
    setRasterOpacityToOne(map, 'raster-layer');

    map.flyTo({
      center: [104.03152, 1.412],
      zoom: 13,
      essential: true  // Ensures that the transition is smooth
    });
});

function assignHomeViewListeners() {
    document.getElementById('creative-mode-btn').addEventListener('click', () => {
        let contentPanel = document.getElementById('description-panel');
        contentPanel.innerHTML = ''; 
        loadCreativeMode();          
    });

    document.getElementById('explore-ideas-btn').addEventListener('click', () => {
        let contentPanel = document.getElementById('description-panel');
        contentPanel.innerHTML = '';  
        loadGalleryMode();
    });

    document.getElementById('history-btn').addEventListener('click', () => {
        let contentPanel = document.getElementById('description-panel');
        contentPanel.innerHTML = '';  
    
        loadStoryMode();
        setLayerOpacityToZero(map, 'A-grid-20241116-3');
        setLayerOpacityToZero(map, 'A-roads-all');
        setLineOpacityToZero(map, 'CRL_with_extension_20241104');
        setLineOpacityToZero(map, 'MRTLines_20241113_future');
        setTextOpacityToZero(map, 'tekong_districts');
        setRasterOpacityToOne(map, 'raster-layer');

        map.flyTo({
          center: [104.03152, 1.412],
          zoom: 13,
          essential: true  // Ensures that the transition is smooth
        });
    });

    document.getElementById('hdb-image').addEventListener('click', function () {
        alert(
            "This interactive web app is not affiliated with the Urban Redevelopment Authority, the Housing & Development Board, nor with the Government of Singapore.\n\n" +
            "Believing that this website is actual policy is like marrying someone based on their dating app profile.\n\n" +
            "For legal purposes, NONE of the information here reflects the planning intention of the Government. Please refer to the adopted Master Plan instead.\n\n" +
            "TLDR: For demonstration only!\n" +
            "bairun@upenn.edu\n\n" +
            "Visit the MUSA website:\n" +
            "https://www.design.upenn.edu/musa/about"
        );
    });
}

function setLayerOpacityToZero(map, layerId) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'fill-opacity', 0);
      console.log(`Layer ${layerId} opacity set to 0.`);
    } else {
      console.error(`Layer ${layerId} not found.`);
    }
  }

function setLineOpacityToZero(map, layerId) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'line-opacity', 0);
      console.log(`Layer ${layerId} opacity set to 0.`);
    } else {
      console.error(`Layer ${layerId} not found.`);
    }
  }

function setTextOpacityToZero(map, layerId) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'text-opacity', 0);
      console.log(`Layer ${layerId} opacity set to 0.`);
    } else {
      console.error(`Layer ${layerId} not found.`);
    }
  }
  
function setRasterOpacityToOne(map, layerId) {
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, 'raster-opacity', 1);
      console.log(`Layer ${layerId} opacity set to 1.`);
    } else {
      console.error(`Layer ${layerId} not found.`);
    }
  }

export { assignHomeViewListeners, setLayerOpacityToZero, setLineOpacityToZero, setTextOpacityToZero, setRasterOpacityToOne };