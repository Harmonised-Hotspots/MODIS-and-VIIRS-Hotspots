import React, { useRef, useState, useEffect } from 'react';
import './GlobeViewer.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// import access token via env file
mapboxgl.accessToken = 'pk.eyJ1Ijoia2Vyb21laSIsImEiOiJjbXdiZGlxdWEwMWFnMzBxNTdjcTJocnVkIn0.jDQs_EmmcfL3xt3OvHs0nQ';

// Dummy hotspot data for testing purposes
const SAMPLE_HOTSPOTS = [
  { latitude: 50.67, longitude: -120.33, frp: 36.3 },
  { latitude: 53.92, longitude: -122.75, frp: 13.8 },
  { latitude: 58.8, longitude: -122.7, frp: 56.5 },
  { latitude: 51.05, longitude: -114.07, frp: 18.1 },
];

//
export default function HotspotMap() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [hotspots, setHotspots] = useState(SAMPLE_HOTSPOTS);
  const [mapReady, setMapReady] = useState(false);

  // Effect to create globe map
  useEffect(() => {
    // checks if a map is already in effect
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
    };
  }, []);

  // Effect to implement hotspots from live data
  // Runs when map is ready and live data is updated
  useEffect(() => {
    if (!mapReady) return;
    const markers = hotspots.map((h) =>
      new mapboxgl.Marker({ color: '#ff4500' })
        .setLngLat([h.longitude, h.latitude])
        .setPopup(new mapboxgl.Popup().setText(`FRP: ${h.frp} MW`))
        .addTo(mapRef.current)
    );
    return () => markers.forEach((m) => m.remove());
  }, [mapReady, hotspots]);

  // Positioning of the mapbox in website
  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}


