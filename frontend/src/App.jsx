import React, { useState } from 'react';
import TopNav from './components/TopNav/TopNav';
import GlobeViewer from './components/GlobeViewer/GlobeViewer';
import SummaryCard from './components/SummaryCard/SummaryCard';
import BurningCalendar from './components/BurningCalendar/BurningCalendar';
import './App.css';

function App() {
  const [selectedYear, setSelectedYear] = useState(2020);

  const [activeAOI, setActiveAOI] = useState(null);

  // One-click CSV export generator (Feature 6 requirement)
  const handleExportCSV = async () => {
    const aoiLabel = activeAOI ? activeAOI.name.replace(/[^a-zA-Z0-9]/g, '_') : "";
    const params = new URLSearchParams({
      year: selectedYear,
      aoi_name: aoiLabel,
    });

    if (activeAOI) {
      params.append('aoi_lat', activeAOI.lat);
      params.append('aoi_lon', activeAOI.lon);
      params.append('aoi_radius', activeAOI.radiusKm || 100);
    }

    try {
      const response = await fetch(`http://localhost:5000/api/export?${params.toString()}`);
      if (!response.ok) throw new Error(`Export failed with status ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nasa_fire_harmonized_${aoiLabel}_${selectedYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('CSV export failed:', err);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030509]">
      
      {/* 1. Top Navigation Bar with AOI Draw & Harmonization Switch */}
      <TopNav onExportCSV={handleExportCSV} />

      {/* 2. 3D Earth Globe & Hotspot Visualizer (Feature 1) */}
      <GlobeViewer
        mapboxAccessToken={null} // Plug in Mapbox token here when ready
        activeAOI={activeAOI}
        onClearAOI={() => setActiveAOI(null)}
      />

      {/* 3. Plain-English Threat & Regional Summary Card (Feature 5) */}
      <SummaryCard
        activeYear={selectedYear}
      />

      {/* 4. 52-Week Burning Activity Calendar & Macro Dock (Feature 2) */}
      <BurningCalendar
        selectedYear={selectedYear}
        onSelectYear={(year) => setSelectedYear(year)}
      />
    </div>
  );
}

export default function () {
  return <App />;
}
