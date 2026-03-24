// sa-incident-tracker/js/map.js
const MAP_CENTER = [-29.85, 31.03];
const DEFAULT_ZOOM = 11;

const alertIcons = {
  crime:        { emoji: "🚨", color: "#ff5252", border: "#c62828", label: "Crime" },
  protest:      { emoji: "✊", color: "#448aff", border: "#1565c0", label: "Protest" },
  "mass-action": { emoji: "🚧", color: "#ffab40", border: "#ef6c00", label: "Mass Action" },
  riot:         { emoji: "🔥", color: "#ab47bc", border: "#6a1b9a", label: "Riot" },
  disruption:   { emoji: "🚧", color: "#ffeb3b", border: "#f9a825", label: "Disruption" },
  suspicious:   { emoji: "👀", color: "#a1887f", border: "#5d4037", label: "Suspicious" },
  other:        { emoji: "⚠️", color: "#90a4ae", border: "#455a64", label: "Other" }
};

window.mapInstance = null;
window.tempMarker = null;
let markersCluster = null;
let clickListener = null;
let allMarkers = [];                    // Store all markers for filtering
let activeFilters = new Set();          // Empty = show all

function initMap(containerId = 'map') {
  if (window.mapInstance) return window.mapInstance;

  window.mapInstance = L.map(containerId, {
    center: MAP_CENTER,
    zoom: DEFAULT_ZOOM,
    maxZoom: 19,
    minZoom: 3
  });

  markersCluster = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      const childMarkers = cluster.getAllChildMarkers();
      const typeCounts = {};

      childMarkers.forEach(m => {
        const t = m.options.alertType || 'other';
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });

      let dominantType = 'other';
      let maxCount = 0;
      for (const t in typeCounts) {
        if (typeCounts[t] > maxCount) {
          maxCount = typeCounts[t];
          dominantType = t;
        }
      }

      const iconInfo = alertIcons[dominantType] || alertIcons.other;

      return L.divIcon({
        html: `<div style="background:${iconInfo.color}; color:white; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:22px; border:3px solid ${iconInfo.border}; box-shadow:0 3px 10px rgba(0,0,0,0.4); text-shadow:0 0 4px rgba(0,0,0,0.8);">${iconInfo.emoji}</div>`,
        className: '',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
    }
  });

  window.mapInstance.addLayer(markersCluster);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(window.mapInstance);

  // Add collapsible legend with filters
  addLegendWithFilters();

  enableReportClick();
  return window.mapInstance;
}

// Collapsible Legend with Checkboxes (Live Filtering)
function addLegendWithFilters() {
  const legend = L.control({ position: 'topright' });

  legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'legend-container');
    div.style.background = 'white';
    div.style.padding = '10px';
    div.style.borderRadius = '8px';
    div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    div.style.minWidth = '220px';
    div.style.fontFamily = 'Arial, sans-serif';

    div.innerHTML = `
      <div style="font-weight:bold; margin-bottom:8px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" id="legend-header">
        <span>🔍 Filter Incidents</span>
        <span id="legend-toggle">▼</span>
      </div>
      <div id="legend-body" style="display:none;">
        ${Object.keys(alertIcons).map(type => {
          const info = alertIcons[type];
          return `
            <label style="display:flex; align-items:center; gap:8px; margin:6px 0; font-size:0.95em; cursor:pointer;">
              <input type="checkbox" value="${type}" checked style="accent-color: ${info.color};">
              <span style="font-size:1.3em;">${info.emoji}</span>
              <span>${info.label}</span>
            </label>
          `;
        }).join('')}
        <button id="reset-filters" style="margin-top:10px; width:100%; padding:8px; background:#006633; color:white; border:none; border-radius:6px; cursor:pointer;">
          Show All Types
        </button>
      </div>
    `;

    // Toggle collapse
    div.querySelector('#legend-header').addEventListener('click', () => {
      const body = div.querySelector('#legend-body');
      const toggle = div.querySelector('#legend-toggle');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        toggle.textContent = '▲';
      } else {
        body.style.display = 'none';
        toggle.textContent = '▼';
      }
    });

    // Filter logic
    div.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', applyFilters);
    });

    // Reset button
    div.querySelector('#reset-filters').addEventListener('click', () => {
      div.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
      applyFilters();
    });

    return div;
  };

  legend.addTo(window.mapInstance);
}

function applyFilters() {
  const checkedTypes = new Set();
  document.querySelectorAll('.legend-container input[type="checkbox"]:checked').forEach(cb => {
    checkedTypes.add(cb.value);
  });

  markersCluster.clearLayers();

  allMarkers.forEach(marker => {
    const type = marker.options.alertType || 'other';
    if (checkedTypes.size === 0 || checkedTypes.has(type)) {
      markersCluster.addLayer(marker);
    }
  });

  fitToMarkers();
}

function enableReportClick() {
  if (clickListener) window.mapInstance.off('click', clickListener);

  clickListener = function(e) {
    const lat = e.latlng.lat.toFixed(5);
    const lng = e.latlng.lng.toFixed(5);

    if (window.tempMarker) window.mapInstance.removeLayer(window.tempMarker);

    window.tempMarker = L.circleMarker([lat, lng], {
      radius: 8, fillColor: "#3388ff", color: "#ffffff", weight: 3, opacity: 1, fillOpacity: 0.8
    }).addTo(window.mapInstance);

    showAddReportModal(lat, lng);
  };

  window.mapInstance.on('click', clickListener);
}

function addMarkerToCluster(alert) {
  const lat = parseFloat(alert.lat) || -29.85;
  const lng = parseFloat(alert.lng) || 31.03;

  const typeKey = alert.type?.toLowerCase().trim() || 'other';
  const iconInfo = alertIcons[typeKey] || alertIcons.other;

  const markerIcon = L.divIcon({
    html: `<div style="background:${iconInfo.color}; color:white; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:20px; border:3px solid ${iconInfo.border}; box-shadow:0 3px 10px rgba(0,0,0,0.35);">${iconInfo.emoji}</div>`,
    className: '',
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });

  const marker = L.marker([lat, lng], { icon: markerIcon });

  // Your existing popup content (kept the same)
  const popupContent = `... your current popup HTML ...`;   // ← keep your existing popupContent here

  marker.bindPopup(popupContent);
  marker.options.alertType = typeKey;

  allMarkers.push(marker);        // Store for filtering
  markersCluster.addLayer(marker);
}

function fitToMarkers() {
  if (!markersCluster || markersCluster.getLayers().length === 0) return;
  const bounds = markersCluster.getBounds();
  if (bounds.isValid()) {
    window.mapInstance.fitBounds(bounds, { padding: [60, 60] });
  }
}
