import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './BurningCalendar.css';
import {
  YEARS,
  KEY_EPOCHS,
  MONTH_NAMES,
  DAY_NAMES,
  getCalendarGridForYear,
} from '../../data/calendarData';

/**
 * Feature 2: 52-Week Burning Activity Calendar & 25-Year Macro Ribbon
 * 
 * Props:
 * - selectedYear: number (e.g. 2020)
 * - onSelectYear: function(year)
 * - isCalibrated: boolean (True = harmonized curve, False = show 2012 raw artifact spike)
 */
export default function BurningCalendar({
  selectedYear = 2020,
  onSelectYear,
  isCalibrated = true,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Generate deterministic calendar cells for selected year
  const cells = getCalendarGridForYear(selectedYear);

  // Handle year selection
  const handleYearChange = (year) => {
    if (onSelectYear) onSelectYear(year);
    setIsDropdownOpen(false);
  };

  // Compute X coordinate for the active year on the 380px sparkline
  // Range: 2000 to 2026 (26 years span)
  const sparklineWidth = 360;
  const yearFraction = (selectedYear - 2000) / 26;
  const cursorX = 10 + yearFraction * sparklineWidth;

  // Approximate Y value on curve (peak around 2020)
  let cursorY = 18;
  if (selectedYear >= 2018 && selectedYear <= 2021) cursorY = 7;
  else if (selectedYear >= 2012) cursorY = 11;
  else if (selectedYear === 2003) cursorY = 14;

  return (
    <div className="calendar-dock">
      
      {/* 1. 25-YEAR MACRO HORIZON RIBBON */}
      <div className="macro-header-row">
        <div className="macro-title-group">
          <span className="macro-badge">25-Year Historical Trend</span>
          <span className="macro-subtitle">
            2000 (Terra Launch) ➔ 2012 (Sensor Switch Normalized) ➔ 2026
          </span>
        </div>

        {/* Macro Sparkline Trajectory */}
        <div className="macro-sparkline-wrap">
          <svg className="w-80 h-7 overflow-visible" viewBox="0 0 380 28">
            {/* 2012 Sensor Transition Marker Line */}
            <line
              x1={10 + (12 / 26) * sparklineWidth}
              y1="2"
              x2={10 + (12 / 26) * sparklineWidth}
              y2="26"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
            <text
              x={14 + (12 / 26) * sparklineWidth}
              y="9"
              fill="#94a3b8"
              fontSize="8"
              fontWeight="600"
            >
              2012 VIIRS
            </text>

            {/* Uncalibrated Raw Sensor Spike (Red dashed curve shown when calibration is off) */}
            {!isCalibrated && (
              <path
                d="M 10,22 L 80,21 L 175,19 L 178,4 L 280,3 L 370,5"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeDasharray="3 3"
              />
            )}

            {/* Harmonized Continuous Trend Curve */}
            <path
              d="M 10,22 Q 90,20 175,18 T 285,8 T 370,12"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />

            {/* Active Year Cursor Dot */}
            <circle
              cx={cursorX}
              cy={cursorY}
              r="4.5"
              fill="#ff4500"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>

          <span className="macro-status-pill">
            Year {selectedYear} Active
          </span>
        </div>
      </div>

      {/* 2. CALENDAR CONTROLS & YEAR SELECTION */}
      <div className="calendar-controls-row">
        <div className="calendar-title-group">
          <span className="calendar-main-title">Daily Burning Activity</span>

          {/* Year Picker Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="year-picker-btn"
            >
              <span>{selectedYear}</span>
              <ChevronDown className="w-3.5 h-3.5 text-sky-400" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-32 max-h-48 overflow-y-auto bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 z-50">
                {YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => handleYearChange(y)}
                    className={`w-full text-left px-3 py-1.5 text-xs rounded-lg transition-colors ${
                      selectedYear === y
                        ? 'bg-sky-500/20 text-sky-300 font-bold'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    Year {y}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Epoch Scrub Pills */}
          <div className="epoch-pills-wrap">
            {KEY_EPOCHS.map((epoch) => (
              <button
                key={epoch.year}
                onClick={() => handleYearChange(epoch.year)}
                className={`epoch-pill ${selectedYear === epoch.year ? 'active' : ''}`}
                title={epoch.desc}
              >
                {epoch.label}
              </button>
            ))}
          </div>

          <span className="calendar-scrub-hint">
            • Scrub calendar to inspect {selectedYear} daily outbreaks
          </span>
        </div>

        {/* Accessible Color Ramp Legend */}
        <div className="color-ramp-legend">
          <span>Zero Activity</span>
          <div className="ramp-swatches">
            <span className="ramp-swatch bg-[#0e1626]" title="Level 0: No fire activity" />
            <span className="ramp-swatch bg-[#075985]" title="Level 1: Low (1-20 fires)" />
            <span className="ramp-swatch bg-[#0284c7]" title="Level 2: Moderate (20-80 fires)" />
            <span className="ramp-swatch bg-[#f59e0b]" title="Level 3: High (80-200 fires)" />
            <span className="ramp-swatch bg-[#ef4444]" title="Level 4: Critical Outbreak (200+ fires)" />
          </div>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>Critical Outbreak</span>
        </div>
      </div>

      {/* 3. 52-WEEK MATRIX GRID */}
      <div className="matrix-container">
        {/* 4 Day Rows: Mon, Wed, Fri, Sun (Y-Axis) */}
        <div className={`calendar-grid`} >
          {Array.from({length: 53}).map((_, c) => {
            return <div style={{paddingTop: 25}}>
              {Array.from({length: 7}).map((_, r) => {
                const cell = cells[c * 7 + r];
                return <>
                  {cell?.date.day == 3 ?
                    <div style={{position: 'absolute', top: 0}}>
                      {MONTH_NAMES[cell.date.month - 1]}
                    </div> : null}
                  <div
                    className={`day-cell level-${cell?.level}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    &nbsp;
                  </div>
                </>
              })}
            </div>

          })}
        </div>

      </div>

      {/* 4. FOOTER INFO STRIP */}
      <div className="calendar-dock-footer">
        <span className={`footer-inspect-text ${hoveredCell ? 'active' : ''}`}>
          {hoveredCell
            ? `Date: ${hoveredCell.date} • Level: ${hoveredCell.level}`
            : 'Hover or click any calendar day to inspect fire severity and exact satellite overpass counts'}
        </span>
        <span>NASA Earthdata FIRMS • Terra/Aqua MODIS & S-NPP/NOAA-20 VIIRS Cross-Calibration</span>
      </div>

    </div>
  );
}
