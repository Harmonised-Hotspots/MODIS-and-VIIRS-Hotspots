import React, { useRef, useState, useEffect } from 'react';
import './GlobeViewer.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const AOI_SOURCE_ID = 'aoi-highlight-source';
const AOI_FILL_LAYER_ID = 'aoi-highlight-fill';
const AOI_LINE_LAYER_ID = 'aoi-highlight-outline';

// To be changed - not implemented yet
const SOURCE_ID = "hotspots";
const LAYER_ID = "hotspot-display-layer";

function buildAreaHighlightGeoJSON(aoi) {
  if (!aoi) {
    return { type: 'FeatureCollection', features: [] };
  }

  const bbox = aoi.bbox;
  const hasWideBbox =
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    (Math.abs(bbox[2] - bbox[0]) > 0.03 || Math.abs(bbox[3] - bbox[1]) > 0.03);

  if (hasWideBbox) {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: aoi.name },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [minLon, minLat],
                [maxLon, minLat],
                [maxLon, maxLat],
                [minLon, maxLat],
                [minLon, minLat],
              ],
            ],
          },
        },
      ],
    };
  }

  const steps = 64;
  const radiusKm = aoi.radiusKm || 35;
  const latDegPerKm = 1 / 111.32;
  const lonDegPerKm = 1 / (111.32 * Math.max(0.15, Math.cos((aoi.lat * Math.PI) / 180)));
  const ring = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * 2 * Math.PI;
    ring.push([
      aoi.lon + Math.cos(angle) * radiusKm * lonDegPerKm,
      aoi.lat + Math.sin(angle) * radiusKm * latDegPerKm,
    ]);
  }

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { name: aoi.name },
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      },
    ],
  };
}

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

export default function HotspotMap({ activeAOI = null, onClearAOI, selectedYear }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  // Just added when changing markers to dots
  const [cells, setCells] = useState({});

  // Create globe/map and AOI highlight layers
  useEffect(() => {
    if (mapRef.current) return;

    // if no map is in effect create a new map
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/brianpeiris/cmwimriru00bg01st10f0b2m6',
      center: [-106, 56],
      zoom: 3,
    });

    const map = mapRef.current;

    map.on('load', () => {
      map.addSource(AOI_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: AOI_FILL_LAYER_ID,
        type: 'fill',
        source: AOI_SOURCE_ID,
        paint: {
          'fill-color': '#f97316',
          'fill-opacity': 0.18,
        },
      });

      map.addLayer({
        id: AOI_LINE_LAYER_ID,
        type: 'line',
        source: AOI_SOURCE_ID,
        paint: {
          'line-color': '#fb923c',
          'line-width': 2.5,
          'line-opacity': 0.95,
        },
      });

      setMapReady(true);
    });

    // set map to ready once loaded
    mapRef.current.on('load', () => setMapReady(true));

    return () => {
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Render fire hotspot markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    // holds all created dots/hotspots
    let hotspots = [];

    // fetch data from api
    (async () => {
      const params = new URLSearchParams({
        year: selectedYear,
      });

      if (activeAOI) {
        params.append('aoi_lat', activeAOI.lat);
        params.append('aoi_lon', activeAOI.lon);
        params.append('aoi_radius', activeAOI.radiusKm || 100);
      }

      const endpoint = `http://localhost:5000/api/hotspots?${params.toString()}`;
      const json = await fetch(endpoint).then(r => r.json());

      const HOTSPOT_RECORD = json.data?? [];

      // Place markers from fetched data
      hotspots = ['harmonized', 'modis', 'viirs'].flatMap(s => HOTSPOT_RECORD[s].map((h) =>
          // Change markers to dot
        new mapboxgl.Marker({ element: createDot(COLOR_EXPRESSION(h))})
          .setLngLat([h.lon, h.lat])
          .setPopup(new mapboxgl.Popup().setText(`FRP: ${h.frp} MW`))
          .addTo(mapRef.current)
      ));
    })();

    return () => hotspots.forEach((m) => m.remove());
  }, [mapReady, selectedYear]);

  // Highlight searched area without dropping a pin
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    const source = map.getSource(AOI_SOURCE_ID);
    if (source) {
      source.setData(buildAreaHighlightGeoJSON(activeAOI));
    }

    if (!activeAOI) {
      map.flyTo({ center: [-106, 56], zoom: 3, duration: 1000 });
      return;
    }

    const bbox = activeAOI.bbox;
    if (
      Array.isArray(bbox) &&
      bbox.length === 4 &&
      (Math.abs(bbox[2] - bbox[0]) > 0.03 || Math.abs(bbox[3] - bbox[1]) > 0.03)
    ) {
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        { padding: 100, duration: 1200, maxZoom: 11 }
      );
    } else {
      map.flyTo({
        center: [activeAOI.lon, activeAOI.lat],
        zoom: 9,
        duration: 1200,
      });
    }
  }, [mapReady, activeAOI]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      {activeAOI && (
        <div
          style={{
            position: 'absolute',
            top: 78,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 25,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            borderRadius: 9999,
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            fontSize: 12,
            fontWeight: 600,
            backdropFilter: 'blur(12px)',
          }}
        >
          <span>Area highlighted: {activeAOI.name}</span>
          {onClearAOI && (
            <button
              onClick={onClearAOI}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#f8fafc',
                borderRadius: 9999,
                padding: '2px 8px',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
