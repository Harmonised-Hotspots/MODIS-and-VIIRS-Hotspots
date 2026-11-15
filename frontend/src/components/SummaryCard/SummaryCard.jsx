import React, {useState, useEffect} from 'react';
import { Flame, Calendar, AlertTriangle, Filter } from 'lucide-react';
import './SummaryCard.css';

/**
 * Feature 5: Plain-English Incident Summary Card
 */
export default function SummaryCard({
  activeYear = 2020,
  selectedMonth = 2020,
  activeAOI = null,
}) {
  const [data, setData] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams({
        year: activeYear,
      });

      if (activeAOI) {
        params.append('aoi_lat', activeAOI.lat);
        params.append('aoi_lon', activeAOI.lon);
        params.append('aoi_radius', activeAOI.radiusKm || 100);
      }

      const endpoint = `http://127.0.0.1:5000/api/summary?${params.toString()}`;
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Summary fetch failed with status ${response.status}`);
        }
        const json = await response.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Summary fetch failed:', err);
          setData({});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeYear, activeAOI]);

  useEffect(() => {
    (async () => {
      const endpoint = `http://127.0.0.1:5000/api/analytics?year=${activeYear}&month=${selectedMonth}`;
      const data = await fetch(endpoint).then((r) => r.json());
      setAnalyticsData(data);
    })();
  }, [activeYear, selectedMonth]);

  // Calibrated counts vs uncalibrated raw VIIRS noise (for active AOI or all Canada)
  const calibratedCount = data?.calibrated_count;
  const rawCount = data?.raw_count;
  const ghostEmbersCount = data?.ghost_embers_filtered;
  const anomalyPercent = data?.anomaly_percent;
  const worstDay = data?.worst_day;
  const normalBaseline = data?.normal_baseline;
  const peakMonths = data?.peak_months;

  return (
    <aside className="summary-card">
      
      {/* 1. Active Year Header */}
      <div>
        <div className="summary-main-title">
          {activeAOI
            ? `Year ${activeYear} Summary — ${activeAOI.name}`
            : `Year ${activeYear} Summary`}
        </div>
      </div>

      {/* 2. Hero Calibrated vs Raw Metric */}
      <div className="summary-hero-metric">
        <div className={`summary-hero-number`}>
          Harmonized: {calibratedCount?.toLocaleString()}<br/>
          Raw: {rawCount != null ? Math.round(rawCount).toLocaleString() : ''}<br/>
          <span style={{fontSize: '20px'}}>Baseline: {normalBaseline?.toLocaleString()}</span>
        </div>
      </div>

      {/* 3. Plain-English Human Anomaly Banner */}
      <div className="summary-anomaly-banner">
        <div className="anomaly-title">
          <span>
            {anomalyPercent != null
              ? `${anomalyPercent >= 0 ? '▲' : '▼'} ${anomalyPercent}% compared to historical data`
              : 'Loading historical comparison...'}
          </span>
        </div>
      </div>

      {/* 4. Operational Metrics List */}
      <div className="summary-metrics-list">
        <div className="summary-metric-row">
          <span className="summary-metric-key">
            Peak Months
          </span>
          <span className="summary-metric-value danger">
            {peakMonths}
          </span>
        </div>
        <div className="summary-metric-row">
          <span className="summary-metric-key">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Worst Day
          </span>
          <span className="summary-metric-value danger">
            {worstDay?.label}<br/>
            FRP: {worstDay?.frp_mw?.toLocaleString()} MW
          </span>
        </div>

        <div className="summary-metric-row">
          <span className="summary-metric-key">
            <Filter className="w-3.5 h-3.5 text-emerald-400" />
            Ghost Embers Filtered
          </span>
          <span className="summary-metric-value highlight">
              {ghostEmbersCount?.toLocaleString()} false-alarms
          </span>
        </div>
      </div>

      <div style={{ fontSize: "16px", fontWeight: "bold" }}> Current Month</div>
      <div>
        Count: {analyticsData.selected_month?.current_count} <br />
        FRP: {analyticsData.selected_month?.current_frp} <br />
        FRP vs Median: {analyticsData.selected_month?.frp_pct_vs_median} <br />
        Historical Median Count: {analyticsData.selected_month?.historical_median_count} <br />
        Historical Median FRP: {analyticsData.selected_month?.historical_median_frp} <br />
        Is Peak Month: {analyticsData.selected_month?.is_peak_month ? "yes" : "no"} <br />
        Percent vs Median: {analyticsData.selected_month?.pct_vs_median} <br />
      </div>

    </aside>
  );
}
