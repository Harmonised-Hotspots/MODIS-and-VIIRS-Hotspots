import React from 'react';
import { Search, Download, FileText, CheckCircle2 } from 'lucide-react';
import './TopNav.css';

/**
 * TopNav Component (Header Navigation + Feature 3 Harmonization Switch)
 */
export default function TopNav({
  onExportCSV,
}) {
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

      {/* 2. Global Search */}
      <div className="nav-center-group">
        <div className="nav-search-box">
          <Search className="nav-search-icon" />
          <input
            type="text"
            placeholder="Search..."
            className="nav-search-input"
          />
        </div>
      </div>

      {/* 3. Feature 3: Harmonization Active Switch & Data Exports */}
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
