import React, { useRef, useState, useEffect } from 'react';
import './GlobeViewer.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// public access token ok for testing
mapboxgl.accessToken = 'pk.eyJ1Ijoia2Vyb21laSIsImEiOiJjbXdiZGlxdWEwMWFnMzBxNTdjcTJocnVkIn0.jDQs_EmmcfL3xt3OvHs0nQ';

// To be changed - not implemented yet
const SOURCE_ID = "hotspots";
const LAYER_ID = "hotspot-display-layer";

// Modis, Viirs, and harmonized data all have different color shades
// Darker shades will display firespots with high and low probability confidence
const COLORS = {
  MODIS: {high: '#b30000', low: '#fc8d59'},
  VIIRS: {high: '#08519c', low: '#6baed6'},
  HARMONIZED: {high: '#54278f', low: '#9e9ac8'}
};
// Fallback color means code is not properly intaking the h value (deosnt know whether dot is modis, viirs, or harmonized
const ERR_COLOR = '#FFFFFF';

// Color logic
const COLOR_EXPRESSION = (h) => {
   const palette = COLORS[h.source ?? 'MODIS'];
   if (!palette) return ERR_COLOR;
   // if confidence is over 75 categorize as high if under categorize as low
    return h.confidence < 75 ? palette.low : palette.high;
};

// Creates an HTML div element to use as the map marker/point
const createDot = (color) => {
  const el = document.createElement('div');
  el.style.width = '5px';
  el.style.height = '5px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = color;
  el.style.border = '1px solid rgba(0,0,0,0.4)';
  el.style.cursor = 'pointer';
  return el;
};

// Default function
export default function HotspotMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  // Sample hotspots needs to be replaced with actual data
  const [mapReady, setMapReady] = useState(false);
  // Just added when changing markers to dots
  const [selectedYear, setSelectedYear] = useState(2024); // or take as a prop
  const [cells, setCells] = useState({});

  // Effect to create globe map
  useEffect(() => {
    if (mapRef.current) return;

    // if no map is in effect create a new map
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/keromei/cmwgso8ny00bv01sg5e7ydhpb',
      center: [-106, 56],
      zoom: 3,
    });

    // set map to ready once loaded
    mapRef.current.on('load', () => setMapReady(true));

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Effect to implement hotspots from live data
  // Runs when map is ready and live data is updated
  useEffect(() => {
    if (!mapReady) return;
    // holds all created dots/hotspots
    let hotspots = [];

    // fetch data from api
    (async () => {
      const endpoint = `http://localhost:5000/api/hotspots?year=${selectedYear}`;
      const json = await fetch(endpoint).then(r => r.json());

      const HOTSPOT_RECORD = json.data?? [];

      // Place markers from fetched data
      hotspots = HOTSPOT_RECORD.map((h) =>
          // Change markers to dot
        new mapboxgl.Marker({ element: createDot(COLOR_EXPRESSION(h))})
          .setLngLat([h.lon, h.lat])
          .setPopup(new mapboxgl.Popup().setText(`FRP: ${h.frp} MW`))
          .addTo(mapRef.current)
      );
    }) ();

    return () => hotspots.forEach((m) => m.remove());
  }, [mapReady, selectedYear]);

  // Positioning of the mapbox in website
  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}