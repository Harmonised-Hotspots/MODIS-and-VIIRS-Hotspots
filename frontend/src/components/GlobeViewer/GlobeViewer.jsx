import React, { useRef, useState, useEffect } from 'react';
import './GlobeViewer.css';
import { ZOOM_TIERS, SAMPLE_HOTSPOTS } from '../../data/mockHotspots';

/**
 * GlobeViewer Component
 * 
 * Scaffolding for 3D Earth Globe & Hotspot Visualizer.
 * Designed so your teammate can easily plug in Mapbox GL JS / MapLibre.
 * 
 * Props:
 * - isCalibrated: boolean (True = show harmonized fires only, False = show raw + ghost embers)
 * - activeTier: 1 | 2 | 3 (1: Orbit Globe, 2: Regional Biome, 3: Tactical Ridge)
 * - onTierChange: function(tierId)
 * - onSelectCluster: function(hotspot)
 * - mapboxAccessToken: string (optional, inject token to activate live Mapbox map)
 */
export default function GlobeViewer({
  isCalibrated = true,
  activeTier = 1,
  onTierChange,
  onSelectCluster,
  mapboxAccessToken = null,
}) {
  // DOM element container where Mapbox canvas will be mounted
  const mapContainerRef = useRef(null);

  // Reference to live Mapbox GL Map instance
  const mapInstanceRef = useRef(null);

  // Local state for zoom tier if not controlled externally
  const [currentTier, setCurrentTier] = useState(activeTier);
  const [selectedHotspot, setSelectedHotspot] = useState(SAMPLE_HOTSPOTS[0]);

  // Sync prop changes
  useEffect(() => {
    if (activeTier) {
      setCurrentTier(activeTier);
    }
  }, [activeTier]);

  /* =========================================================================
   * 🚀 MAPBOX PLUG-IN HOOK (READY FOR YOUR TEAMMATE)
   * =========================================================================
   * When ready to connect Mapbox:
   * 1. Run: npm install mapbox-gl
   * 2. Pass your token via props or set here: mapboxgl.accessToken = 'pk.xxx'
   * 3. Uncomment the block below!
   * ========================================================================= */
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if Mapbox token is provided
    if (mapboxAccessToken) {
      // Example integration:
      /*
      import mapboxgl from 'mapbox-gl';
      import 'mapbox-gl/dist/mapbox-gl.css';

      mapboxgl.accessToken = mapboxAccessToken;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Dark cartography style
        projection: 'globe', // 3D Earth Globe projection in Mapbox v2+
        center: [-119.5, 37.8], // California Sierra
        zoom: ZOOM_TIERS[currentTier].mapboxZoom,
        pitch: ZOOM_TIERS[currentTier].pitch,
      });

      map.on('style.load', () => {
        // Set atmospheric star sky & space glow
        map.setFog({
          color: 'rgb(3, 5, 9)',
          'high-color': 'rgb(14, 40, 80)',
          'horizon-blend': 0.05,
          'space-color': 'rgb(3, 5, 9)',
          'star-intensity': 0.6,
        });

        // Add 3D Terrain & Fire GeoJSON Sources here
      });

      mapInstanceRef.current = map;

      return () => map.remove();
      */
    }
  }, [mapboxAccessToken]);

  // Handle Zoom Tier Switch
  const handleTierClick = (tierId) => {
    setCurrentTier(tierId);
    if (onTierChange) onTierChange(tierId);

    // If Mapbox is active, smoothly animate camera to that tier's zoom & pitch
    if (mapInstanceRef.current) {
      const config = ZOOM_TIERS[tierId];
      mapInstanceRef.current.flyTo({
        zoom: config.mapboxZoom,
        pitch: config.pitch,
        duration: 2000,
        essential: true,
      });
    }
  };

  const handleHotspotClick = (spot) => {
    setSelectedHotspot(spot);
    if (onSelectCluster) onSelectCluster(spot);
  };

  return (
    <div className="globe-viewport">
      {/* 1. Mapbox Canvas Mount Node (When Mapbox is plugged in, it renders into this div) */}
      <div ref={mapContainerRef} className="mapbox-canvas-container" />

      {/* 2. Atmospheric Space Backdrop */}
      <div className="atmosphere-glow" />

      {/* 3. Developer Integration Guide Badge */}
      <div className="mapbox-developer-badge">
        <span style={{ color: '#38bdf8', fontWeight: 700 }}>Mapbox Plug-in Ready</span>
        <span>• Mount ref linked to <code>mapContainerRef</code></span>
        {mapboxAccessToken ? (
          <span style={{ color: '#4ade80' }}>✓ Token Connected</span>
        ) : (
          <span style={{ color: '#f59e0b' }}>ℹ Rendered in Apple 3D Mock View</span>
        )}
      </div>

      {/* 4. Beautiful Native 3D Globe Fallback (Active until Mapbox token is plugged in) */}
      {!mapboxAccessToken && (
        <div className="globe-sphere">
          {/* Atmospheric Rim Lighting */}
          <div className="globe-atmosphere-rim" />

          {/* Coordinate Grids (Lat/Lon) */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.2 }} viewBox="0 0 580 580">
            <circle cx="290" cy="290" r="230" fill="none" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
            <ellipse cx="290" cy="290" rx="270" ry="115" fill="none" stroke="#ffffff" strokeWidth="1" />
            <ellipse cx="290" cy="290" rx="135" ry="270" fill="none" stroke="#ffffff" strokeWidth="1" />
          </svg>

          {/* Continents Silhouettes */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }} viewBox="0 0 580 580">
            <path d="M 175,145 Q 230,135 270,185 T 240,290 T 185,250 Z" fill="#12243a" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
            <path d="M 240,300 Q 290,340 270,430 T 220,390 Z" fill="#12243a" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
          </svg>

          {/* ACTIVE FIRE HOTSPOTS */}
          {SAMPLE_HOTSPOTS.map((spot) => {
            // If spot is a ghost false-alarm and calibration is active, hide or show dashed
            const isGhost = spot.isGhost;
            if (isGhost && isCalibrated) {
              // Show subtle dashed rings to demonstrate noise reduction
            }

            // Approximate screen placement on the globe
            let left = 210;
            let top = 190;
            if (spot.id === 'fire-amazon-04') { left = 260; top = 350; }
            if (spot.id === 'fire-aus-05') { left = 450; top = 400; }
            if (spot.id === 'fire-ghost-02') { left = 190; top = 180; }
            if (spot.id === 'fire-ghost-03') { left = 225; top = 205; }

            return (
              <div
                key={spot.id}
                onClick={() => handleHotspotClick(spot)}
                style={{
                  position: 'absolute',
                  left: `${left}px`,
                  top: `${top}px`,
                  cursor: 'pointer',
                  zIndex: isGhost ? 5 : 10,
                }}
              >
                {/* Ghost Embers (Filtered Sensor Noise) */}
                {isGhost && (
                  <div
                    className="ghost-ring"
                    style={{
                      position: 'absolute',
                      inset: '-12px',
                      borderRadius: '50%',
                      border: '1.5px dashed #f97316',
                      opacity: isCalibrated ? 0.35 : 0.85,
                      pointerEvents: 'none',
                    }}
                  />
                )}

                {/* Solid Glowing Fire Core */}
                {!isGhost && (
                  <div
                    className="flame-ember"
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #ffffff 0%, #ffa500 45%, #ef4444 85%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff' }} />
                  </div>
                )}

                {/* Hotspot Label Tooltip */}
                {!isGhost && selectedHotspot?.id === spot.id && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '26px',
                      top: '-6px',
                      background: 'rgba(15, 23, 42, 0.92)',
                      border: '1px solid rgba(255, 69, 0, 0.5)',
                      borderRadius: '10px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
                      zIndex: 30,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#ff4500' }}>🔥 {spot.name}</div>
                    <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {spot.region} • FRP: {spot.frp} MW
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. 3-Tier Semantic Zoom Floating Switcher */}
      <div className="hud-zoom-bar">
        {Object.values(ZOOM_TIERS).map((tier) => (
          <button
            key={tier.id}
            onClick={() => handleTierClick(tier.id)}
            className={`hud-pill-button ${currentTier === tier.id ? 'active' : ''}`}
            title={tier.desc}
          >
            {tier.label}
          </button>
        ))}
        <div className="hud-divider" />
        <span className="hud-hint-text">
          Drag globe to rotate • Click cluster to inspect
        </span>
      </div>
    </div>
  );
}
