import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { SearchBox } from '@mapbox/search-js-react';
import { MAPBOX_ACCESS_TOKEN } from '../../config/mapbox';
import './TopNav.css';

function estimateRadiusKm(bbox) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return 50;
  const [minLon, minLat, maxLon, maxLat] = bbox;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(maxLat - minLat);
  const dLon = toRad(maxLon - minLon);
  const avgLat = toRad((minLat + maxLat) / 2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(avgLat) ** 2 * Math.sin(dLon / 2) ** 2;
  const diagKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(15, Math.min(500, Math.round(diagKm / 2)));
}

/**
 * TopNav Component (Header Navigation + Mapbox Location Search)
 */
export default function TopNav({
  onExportCSV,
  activeAOI,
  onSelectAOI,
  onClearAOI,
}) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!activeAOI) {
      setQuery('');
    }
  }, [activeAOI]);

  const handleRetrieve = (res) => {
    const feature = res?.features?.[0];
    if (!feature) return;

    const props = feature.properties || {};
    const coords = feature.geometry?.coordinates || [
      props.coordinates?.longitude,
      props.coordinates?.latitude,
    ];
    const [lon, lat] = coords;
    if (lat == null || lon == null) return;

    const bbox = Array.isArray(props.bbox) && props.bbox.length === 4 ? props.bbox : null;
    const name = props.name || props.full_address || 'Selected Area';

    onSelectAOI?.({
      name,
      fullName: props.full_address || name,
      lat,
      lon,
      bbox,
      radiusKm: estimateRadiusKm(bbox),
    });
  };

  return (
    <header className="top-nav-bar">
      
      {/* 1. NASA & Archive Brand Identity */}
      <div className="nav-brand-group">
        <div className="nav-title-group">
          <div className="nav-main-title">
            Harmonized Canadian Fire Observatory
            <span className="nav-archive-badge">2018–2025 Data Archive</span>
          </div>
          <span className="nav-subtitle">
            Data from NASA MODIS and VIIRS NOAA-20
          </span>
        </div>
      </div>

      {/* 2. Global Location Search (suggests areas and highlights on map without dropping pins) */}
      <div className="nav-center-group">
        <div className="nav-mapbox-search-wrap">
          <SearchBox
            accessToken={MAPBOX_ACCESS_TOKEN}
            marker={false}
            placeholder="Search city, province, or region..."
            value={query}
            onChange={(val) => setQuery(val)}
            onRetrieve={handleRetrieve}
            onClear={() => {
              setQuery('');
              onClearAOI?.();
            }}
            options={{
              language: 'en',
              country: 'CA',
              proximity: [-106, 56],
            }}
            theme={{
              variables: {
                fontFamily: 'inherit',
                unit: '13px',
                borderRadius: '10px',
                colorBackground: '#0f172a',
                colorBackgroundHover: '#1e293b',
                colorBackgroundActive: '#1e293b',
                colorText: '#ffffff',
                colorSecondary: '#94a3b8',
                colorPrimary: '#38bdf8',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.45)',
              },
              cssText: `
                input,
                input:focus,
                input:focus-visible {
                  color: #ffffff !important;
                  caret-color: #ffffff !important;
                  border: none !important;
                  outline: none !important;
                  box-shadow: none !important;
                }
                input::placeholder {
                  color: #94a3b8 !important;
                }
              `,
            }}
          />
        </div>
      </div>

      {/* 3. Data Exports */}
      <div className="nav-right-group">
        {/* Export CSV Button */}
        <button onClick={onExportCSV} className="nav-action-btn">
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

    </header>
  );
}
