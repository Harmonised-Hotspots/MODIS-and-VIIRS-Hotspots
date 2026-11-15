import React, { useRef, useState, useEffect } from 'react';
import './GlobeViewer.css';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const AOI_SOURCE_ID = 'aoi-highlight-source';
const AOI_FILL_LAYER_ID = 'aoi-highlight-fill';
const AOI_LINE_LAYER_ID = 'aoi-highlight-outline';

// Dummy hotspot data for testing purposes
const SAMPLE_HOTSPOTS = [
  { latitude: 50.67, longitude: -120.33, frp: 36.3 },
  { latitude: 53.92, longitude: -122.75, frp: 13.8 },
  { latitude: 58.8, longitude: -122.7, frp: 56.5 },
  { latitude: 51.05, longitude: -114.07, frp: 18.1 },
];

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

export default function HotspotMap({ activeAOI = null, onClearAOI }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [hotspots] = useState(SAMPLE_HOTSPOTS);
  const [mapReady, setMapReady] = useState(false);

  // Create globe/map and AOI highlight layers
  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/keromei/cmwgso8ny00bv01sg5e7ydhpb',
      center: [-106, 56],
      zoom: 3,
    });
    mapRef.current = map;

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Render fire hotspot markers
  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const markers = hotspots.map((h) =>
      new mapboxgl.Marker({ color: '#ff4500' })
        .setLngLat([h.longitude, h.latitude])
        .setPopup(new mapboxgl.Popup().setText(`FRP: ${h.frp} MW`))
        .addTo(mapRef.current)
    );
    return () => markers.forEach((m) => m.remove());
  }, [mapReady, hotspots]);

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