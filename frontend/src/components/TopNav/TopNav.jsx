import React from 'react';
import { Search, Download, FileText, CheckCircle2 } from 'lucide-react';
import './TopNav.css';

const REGIONS = [
  { id: 'global', name: 'Global' },
  { id: 'na', name: 'North America' },
  { id: 'sa', name: 'South America' },
  { id: 'eu', name: 'Europe' },
  { id: 'au', name: 'Australia' },
];

/**
 * TopNav Component (Header Navigation + Feature 3 Harmonization Switch)
 */
export default function TopNav({
  activeRegion = 'na',
  onSelectRegion,
  isCalibrated = true,
  onToggleCalibration,
  onExportCSV,
  onOpenMethodology,
  onOpenAOI,
  activeAOI = null,
}) {
  return (
    <header className="top-nav-bar">
      
      {/* 1. NASA & Archive Brand Identity */}
      <div className="nav-brand-group">
        <div className="nasa-logo-badge">
          <span className="brand-dot" />
          NASA FIRMS
        </div>
        <div className="nav-title-group">
          <div className="nav-main-title">
            Harmonized Earth Fire Observatory
            <span className="nav-archive-badge">2000–2026 Archive</span>
          </div>
          <span className="nav-subtitle">
            Cross-Calibrated MODIS (Aqua/Terra) & VIIRS (NOAA-20/21)
          </span>
        </div>
      </div>

      {/* 2. Global Search & Region Quick Filter */}
      <div className="nav-center-group">
        <div className="nav-search-box">
          <Search className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search county, national park, coordinates..."
            className="nav-search-input"
          />
          <kbd className="nav-search-kbd">⌘K</kbd>
        </div>

        {/* Draw AOI Button */}
        <button
          onClick={onOpenAOI}
          className="nav-action-btn"
          style={{
            borderColor: activeAOI ? '#38bdf8' : 'rgba(255, 255, 255, 0.14)',
            color: activeAOI ? '#38bdf8' : '#f1f5f9',
            background: activeAOI ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.07)',
          }}
          title="Draw or define Area of Interest bounding polygon"
        >
          <span>⬡</span>
          <span>{activeAOI ? activeAOI.name : 'Draw AOI'}</span>
        </button>

        {/* Region Pills */}
        <div className="nav-region-pills">
          {REGIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelectRegion && onSelectRegion(r.id)}
              className={`nav-region-btn ${activeRegion === r.id ? 'active' : ''}`}
            >
              {r.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Feature 3: Harmonization Active Switch & Data Exports */}
      <div className="nav-right-group">
        {/* Harmonization Switch Button */}
        <button
          onClick={onToggleCalibration}
          className={`harmonization-toggle-btn ${isCalibrated ? 'calibrated' : 'uncalibrated'}`}
          title="Toggle cross-sensor harmonization (MODIS + VIIRS)"
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isCalibrated ? '#22c55e' : '#ef4444',
              boxShadow: isCalibrated ? '0 0 8px #22c55e' : '0 0 8px #ef4444',
            }}
          />
          <span>{isCalibrated ? 'Calibration Active' : 'Raw Sensor Artifact'}</span>
          <div
            className="toggle-switch-track"
            style={{ backgroundColor: isCalibrated ? '#22c55e' : '#475569' }}
          >
            <div
              className="toggle-switch-thumb"
              style={{
                transform: isCalibrated ? 'translateX(14px)' : 'translateX(2px)',
              }}
            />
          </div>
        </button>

        {/* Export CSV Button */}
        <button onClick={onExportCSV} className="nav-action-btn">
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        {/* Science & Method Drawer Button */}
        <button
          onClick={onOpenMethodology}
          className="nav-action-btn"
          style={{
            background: 'rgba(2, 132, 199, 0.2)',
            borderColor: 'rgba(2, 132, 199, 0.4)',
            color: '#38bdf8',
          }}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Science & Method</span>
        </button>
      </div>

    </header>
  );
}
