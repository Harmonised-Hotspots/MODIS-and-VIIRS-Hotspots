import React, { useState, useEffect, Fragment } from 'react';
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
  onSelectMonth,
  isCalibrated = true,
  activeAOI = null,
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [cells, setCells] = useState([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams({
        year: selectedYear,
        calibrated: String(isCalibrated),
      });

      if (activeAOI) {
        params.append('aoi_lat', activeAOI.lat);
        params.append('aoi_lon', activeAOI.lon);
        params.append('aoi_radius', activeAOI.radiusKm || 100);
      }

      const endpoint = `http://127.0.0.1:5000/api/calendar?${params.toString()}`;
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Calendar fetch failed with status ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;

        setCells(
          data
            .filter((d) => d.date)
            .toSorted((a, b) => (a.date > b.date ? 1 : -1))
            .reduce((a, b) => {
              a[b.date] = b;
              return a;
            }, {})
        );
      } catch (err) {
        if (!cancelled) {
          console.error('Calendar fetch failed:', err);
          setCells({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedYear, isCalibrated, activeAOI]);

  return (
    <div className="calendar-dock-container">
    <div className="calendar-dock">
      <div className="calendar-controls-row">
        <div className="calendar-title-group">
          <span className="calendar-main-title">
            {activeAOI
              ? `Daily Burning Activity — ${activeAOI.name}`
              : 'Daily Burning Activity'}
          </span>

          <select className="year-select" onChange={e => onSelectYear(e.target.value)} value={selectedYear}>
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
                const date = Temporal.Now.plainDateISO().with({year: selectedYear, month: 1, day: 1}).add(`P${index}D`);
                const cell = cells[date.toString()];
                return <Fragment key={index}>
                  {date.day === 1 && date.year === Number(selectedYear) ?
                    <div className="calendar-month-name">
                      {MONTH_NAMES[date.month - 1]}
                    </div> : null}
                  <div
                    className={`day-cell level-${cell?.level ?? 0} ${cell?.isPeakDay ? 'peak-day' : ''}`}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => onSelectMonth(date.month)}
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
            ? `Date: ${hoveredCell.date} • Count: ${hoveredCell.count} • FRP: ${hoveredCell.total_frp} • Level: ${hoveredCell.level}`
            : ''}
        </span>
        <span>NASA Earthdata FIRMS - MODIS &amp; VIIRS NOAA-20 (2018-2025)</span>
      </div>
    </div>
    </div>
  );
}
