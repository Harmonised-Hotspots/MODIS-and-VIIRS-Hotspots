import React from 'react';
import { Flame, Calendar, AlertTriangle, Filter } from 'lucide-react';
import './SummaryCard.css';

/**
 * Feature 5: Plain-English Regional Threat & Incident Summary Card
 */
export default function SummaryCard({
  activeYear = 2020,
  activeRegion = 'California Sierra',
  isCalibrated = true,
}) {
  // Calibrated counts vs uncalibrated raw VIIRS noise
  const calibratedCount = activeYear === 2020 ? 1240 : (activeYear === 2024 ? 1180 : 1050);
  const rawCount = activeYear >= 2012 ? calibratedCount * 3.8 : calibratedCount;
  const ghostEmbersCount = Math.round(rawCount - calibratedCount);
  const anomalyPercent = activeYear === 2020 ? 18 : (activeYear === 2024 ? 12 : 5);

  return (
    <aside className="summary-card">
      
      {/* 1. Region & Active Year Header */}
      <div>
        <div className="summary-header-label">{activeRegion} Fire Season</div>
        <div className="summary-main-title">Year {activeYear} Summary</div>
      </div>

      {/* 2. Hero Calibrated vs Raw Metric */}
      <div className="summary-hero-metric">
        <div className={`summary-hero-number ${!isCalibrated ? 'uncalibrated' : ''}`}>
          {isCalibrated ? calibratedCount.toLocaleString() : Math.round(rawCount).toLocaleString()}
        </div>
        <div className="summary-hero-desc">
          {isCalibrated
            ? 'Calibrated fires detected this year (Footprint normalized)'
            : '⚠️ Raw sensor pixels (340% VIIRS sensitivity jump unfiltered)'}
        </div>
      </div>

      {/* 3. Plain-English Human Anomaly Banner */}
      <div className="summary-anomaly-banner">
        <div className="anomaly-title">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>▲ {anomalyPercent}% higher than 20-year normal</span>
        </div>
        <div className="anomaly-desc">
          Normal baseline: ~1,050 calibrated fires per year for this biome.
        </div>
      </div>

      {/* 4. Operational Metrics List */}
      <div className="summary-metrics-list">
        <div className="summary-metric-row">
          <span className="summary-metric-key">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Peak Fire Months
          </span>
          <span className="summary-metric-value">August & September</span>
        </div>

        <div className="summary-metric-row">
          <span className="summary-metric-key">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Worst Outbreak Day
          </span>
          <span className="summary-metric-value danger">
            Aug 22 (Creek Fire Outbreak)
          </span>
        </div>

        <div className="summary-metric-row">
          <span className="summary-metric-key">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Ghost Embers Filtered
          </span>
          <span className="summary-metric-value highlight">
            {isCalibrated
              ? `✓ ${ghostEmbersCount.toLocaleString()} false-alarms`
              : '0 (Filter Inactive)'}
          </span>
        </div>
      </div>

      {/* 5. Fuel Types Burning */}
      <div className="summary-fuels-section">
        <div className="fuels-label-row">
          <span>Fuel Classification</span>
          <span style={{ color: '#cbd5e1' }}>Timber Forest 64%</span>
        </div>
        <div className="fuels-progress-bar">
          <div className="fuel-slice-forest" title="Timber / Dense Forest (64%)" />
          <div className="fuel-slice-brush" title="Brush / Chaparral (24%)" />
          <div className="fuel-slice-agri" title="Agricultural / Grasslands (12%)" />
        </div>
        <div className="fuels-legend-row">
          <span>🌲 Forest 64%</span>
          <span>🌾 Brush 24%</span>
          <span>🚜 Agri 12%</span>
        </div>
      </div>

    </aside>
  );
}
