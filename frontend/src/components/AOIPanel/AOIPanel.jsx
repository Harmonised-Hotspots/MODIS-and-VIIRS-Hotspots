import React, { useState } from 'react';
import { Hexagon, X, MapPin, Compass, Check, Sliders } from 'lucide-react';
import './AOIPanel.css';

export const AOI_PRESETS = [
  {
    id: 'aoi-sierra',
    name: 'Sierra Nevada Basin (CA)',
    region: 'California, USA',
    lat: 37.865,
    lon: -119.538,
    radiusKm: 120,
    areaKm2: 45200,
    fireCount: 1240,
    anomaly: '+18% Anomaly',
  },
  {
    id: 'aoi-plumas',
    name: 'Plumas National Forest (CA)',
    region: 'Northern California, USA',
    lat: 39.950,
    lon: -120.850,
    radiusKm: 75,
    areaKm2: 17670,
    fireCount: 680,
    anomaly: '+24% Anomaly',
  },
  {
    id: 'aoi-amazon',
    name: 'Amazon Deforestation Arc (BR)',
    region: 'Mato Grosso & Pará, Brazil',
    lat: -10.200,
    lon: -55.400,
    radiusKm: 250,
    areaKm2: 196300,
    fireCount: 2840,
    anomaly: '+31% Anomaly',
  },
  {
    id: 'aoi-nsw',
    name: 'NSW Alpine Forest Zone (AU)',
    region: 'New South Wales, Australia',
    lat: -35.600,
    lon: 148.800,
    radiusKm: 100,
    areaKm2: 31400,
    fireCount: 910,
    anomaly: '+12% Anomaly',
  },
  {
    id: 'aoi-med',
    name: 'Mediterranean Pine Belt (GR/IT)',
    region: 'Southern Europe',
    lat: 38.200,
    lon: 21.700,
    radiusKm: 90,
    areaKm2: 25400,
    fireCount: 450,
    anomaly: '+8% Anomaly',
  },
];

/**
 * Feature 4: Interactive Area of Interest (AOI) Polygon & Coordinate Panel
 */
export default function AOIPanel({
  isOpen = false,
  onClose,
  activeAOI = null,
  onApplyAOI,
  onClearAOI,
}) {
  const [activeTab, setActiveTab] = useState('presets'); // 'presets' | 'coords'
  const [selectedPreset, setSelectedPreset] = useState(activeAOI || AOI_PRESETS[0]);

  // Custom coordinates form state
  const [customLat, setCustomLat] = useState(37.865);
  const [customLon, setCustomLon] = useState(-119.538);
  const [customRadius, setCustomRadius] = useState(100);

  if (!isOpen) return null;

  const handleApply = () => {
    if (activeTab === 'presets') {
      onApplyAOI(selectedPreset);
    } else {
      const area = Math.round(Math.PI * customRadius * customRadius);
      const customAOI = {
        id: `custom-${Date.now()}`,
        name: `Custom AOI (${customRadius} km Radius)`,
        region: `${customLat.toFixed(3)}°N, ${customLon.toFixed(3)}°W`,
        lat: parseFloat(customLat),
        lon: parseFloat(customLon),
        radiusKm: customRadius,
        areaKm2: area,
        fireCount: Math.round(area * 0.024),
        anomaly: '+15% Anomaly',
      };
      onApplyAOI(customAOI);
    }
    onClose();
  };

  const handleReset = () => {
    if (onClearAOI) onClearAOI();
    onClose();
  };

  return (
    <div className="aoi-overlay-backdrop" onClick={onClose}>
      <div className="aoi-modal-panel" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="aoi-header-row">
          <div className="aoi-title-group">
            <div className="aoi-icon-badge">
              <Hexagon className="w-4 h-4" />
            </div>
            <div>
              <div className="aoi-modal-title">Define Area of Interest (AOI)</div>
              <div className="aoi-modal-subtitle">
                Filter satellite fire hotspots within a custom boundary
              </div>
            </div>
          </div>
          <button onClick={onClose} className="aoi-close-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="aoi-tabs-bar">
          <button
            onClick={() => setActiveTab('presets')}
            className={`aoi-tab-btn ${activeTab === 'presets' ? 'active' : ''}`}
          >
            Pre-set Forest Watersheds
          </button>
          <button
            onClick={() => setActiveTab('coords')}
            className={`aoi-tab-btn ${activeTab === 'coords' ? 'active' : ''}`}
          >
            Coordinates & Radius (km)
          </button>
        </div>

        {/* Tab 1: Presets List */}
        {activeTab === 'presets' && (
          <div className="aoi-presets-grid">
            {AOI_PRESETS.map((preset) => {
              const isSelected = selectedPreset?.id === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`aoi-preset-card ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div className="aoi-preset-name">{preset.name}</div>
                    <div className="aoi-preset-coords">
                      {preset.region} • {preset.lat}° Lat, {preset.lon}° Lon • Radius: {preset.radiusKm} km
                    </div>
                  </div>
                  <div className="aoi-preset-fires-badge">
                    {preset.fireCount.toLocaleString()} fires
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Custom Coordinate Inputs */}
        {activeTab === 'coords' && (
          <div className="aoi-coords-form">
            <div className="aoi-input-grid">
              <div className="aoi-field-group">
                <label className="aoi-field-label">Center Latitude (°N)</label>
                <input
                  type="number"
                  step="0.001"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  className="aoi-text-input"
                  placeholder="e.g. 37.865"
                />
              </div>
              <div className="aoi-field-group">
                <label className="aoi-field-label">Center Longitude (°W/°E)</label>
                <input
                  type="number"
                  step="0.001"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  className="aoi-text-input"
                  placeholder="e.g. -119.538"
                />
              </div>
            </div>

            {/* Radius Slider */}
            <div className="aoi-radius-slider-wrap">
              <div className="aoi-slider-header">
                <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Bounding Search Radius</span>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>{customRadius} km</span>
              </div>
              <input
                type="range"
                min="25"
                max="300"
                step="5"
                value={customRadius}
                onChange={(e) => setCustomRadius(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8', cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
                <span>25 km (Tactical Ridge)</span>
                <span>Area: ~{Math.round(Math.PI * customRadius * customRadius).toLocaleString()} km²</span>
                <span>300 km (State Biome)</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions Footer */}
        <div className="aoi-actions-footer">
          <button onClick={handleReset} className="aoi-reset-btn">
            Clear / Global
          </button>
          <button onClick={handleApply} className="aoi-apply-btn">
            Apply Area of Interest
          </button>
        </div>

      </div>
    </div>
  );
}
