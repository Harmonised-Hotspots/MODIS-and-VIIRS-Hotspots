import React, { useState, Fragment } from 'react';
import { ChevronDown } from 'lucide-react';
import './BurningCalendar.css';
import {
  YEARS,
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

  // Generate deterministic calendar cells for selected year
  const cells = getCalendarGridForYear(selectedYear);

  // Handle year selection
  const handleYearChange = (year) => {
    if (onSelectYear) onSelectYear(year);
  };

  return (
    <div className="calendar-dock-container">
    <div className="calendar-dock">
      <div className="calendar-controls-row">
        <div className="calendar-title-group">
          <span className="calendar-main-title">Daily Burning Activity</span>

          <select>
            {YEARS.map(year => <option key={year}>{year}</option>)}
          </select>
        </div>

        <div className="color-ramp-legend">
          <span>Zero Activity</span>
          <div className="ramp-swatches">
            <span className="ramp-swatch level-0" title="Level 0: No fire activity" />
            <span className="ramp-swatch level-1" title="Level 1: Low (1-20 fires)" />
            <span className="ramp-swatch level-2" title="Level 2: Moderate (20-80 fires)" />
            <span className="ramp-swatch level-3" title="Level 3: High (80-200 fires)" />
            <span className="ramp-swatch level-4" title="Level 4: Critical Outbreak (200+ fires)" />
          </div>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>Critical Outbreak</span>
        </div>
      </div>

      <div className="matrix-container">
        <div className={`calendar-grid`} >
          {Array.from({length: 54}).map((_, c) => {
            return <div key={c} style={{paddingTop: 20}}>
              {Array.from({length: 7}).map((_, r) => {
                const index = (c - 1) * 7 + r;
                if (c === 0) {
                  return  <Fragment key={index}><div className="calendar-day-name">{(index + 6) % 2 === 0 ? '' : DAY_NAMES[index + 7]}</div></Fragment>;
                }
                const cell = cells[index];
                return <Fragment key={index}>
                  {cell?.date.day == 3 ?
                    <div className="calendar-month-name">
                      {MONTH_NAMES[cell.date.month - 1]}
                    </div> : null}
                  <div
                    className={`day-cell level-${cell?.level}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    &nbsp;
                  </div>
                </Fragment>
              })}
            </div>

          })}
        </div>

      </div>

      <div className="calendar-dock-footer">
        <span className={`footer-inspect-text ${hoveredCell ? 'active' : ''}`}>
          {hoveredCell
            ? `Date: ${hoveredCell.date} • Level: ${hoveredCell.level}`
            : ''}
        </span>
        <span>NASA Earthdata FIRMS - MODIS &amp; VIIRS NOAA-20 (2018-2025)</span>
      </div>
    </div>
    </div>
  );
}
