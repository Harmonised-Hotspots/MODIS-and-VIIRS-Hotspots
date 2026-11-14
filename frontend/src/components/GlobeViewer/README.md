# 🌐 GlobeViewer — Mapbox Integration Guide

This component is the **3D Earth Globe & Hotspot Visualizer** for the NASA Fire Harmonization application. It is pre-architected so you can plug in **Mapbox GL JS** (or MapLibre GL) in under 5 minutes.

---

## 🚀 Quick Start for Your Teammate

### 1. Install Mapbox GL
In the `frontend` folder, install the Mapbox package:
```bash
npm install mapbox-gl
```

### 2. Plug in Your Mapbox Access Token
In `GlobeViewer.jsx`, find the `useEffect` block and pass your token:
```javascript
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN'; // or import.meta.env.VITE_MAPBOX_TOKEN
```

### 3. Initialize the 3D Globe
Initialize the Mapbox instance inside the pre-linked `mapContainerRef`:

```javascript
const map = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/dark-v11', // Apple-style dark cartography
  projection: 'globe',                      // Activates 3D Globe in Mapbox v2+
  center: [-119.5, 37.8],                   // California Sierra Nevada
  zoom: ZOOM_TIERS[currentTier].mapboxZoom, // Linked to 3-Tier Zoom HUD
  pitch: ZOOM_TIERS[currentTier].pitch,
});

// Atmospheric space lighting
map.on('style.load', () => {
  map.setFog({
    color: 'rgb(3, 5, 9)',
    'high-color': 'rgb(14, 40, 80)',
    'horizon-blend': 0.05,
    'space-color': 'rgb(3, 5, 9)',
    'star-intensity': 0.6,
  });
});
```

---

## 🎯 Pre-Wired Features & Props

The component already exposes all the states and callbacks you need:

| Prop / State | Type | Description |
| :--- | :--- | :--- |
| `mapContainerRef` | `useRef(HTMLDivElement)` | Pre-bound DOM node where Mapbox mounts cleanly. |
| `ZOOM_TIERS` | `Object` | **1: Orbit Globe** (`zoom: 1.5`, `pitch: 0`)<br>**2: Regional Biome** (`zoom: 6.0`, `pitch: 35`)<br>**3: Tactical Ridge** (`zoom: 12.0`, `pitch: 65`) |
| `handleTierClick(tierId)` | `Function` | Pre-wired to the floating HUD. Call `map.flyTo()` here to animate between tiers. |
| `isCalibrated` | `Boolean` | When `true`, filter out ghost noise pixels; when `false`, show raw VIIRS uncalibrated dots. |
| `onSelectCluster(spot)` | `Function` | Callback fired when a firefighter or user clicks an active fire cluster. |

---

## 📡 Feeding Hotspots as GeoJSON

In `src/data/mockHotspots.js`, the data is structured to be converted straight to a GeoJSON FeatureCollection:

```javascript
const geojson = {
  type: 'FeatureCollection',
  features: SAMPLE_HOTSPOTS.map((spot) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [spot.lon, spot.lat] },
    properties: {
      id: spot.id,
      name: spot.name,
      frp: spot.frp,
      isGhost: spot.isGhost,
    },
  })),
};

map.addSource('hotspots', { type: 'geojson', data: geojson });
```
