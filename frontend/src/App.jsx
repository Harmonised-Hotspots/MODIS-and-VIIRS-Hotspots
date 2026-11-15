import React, { useState } from 'react';
import TopNav from './components/TopNav/TopNav';
import GlobeViewer from './components/GlobeViewer/GlobeViewer';
import SummaryCard from './components/SummaryCard/SummaryCard';
import BurningCalendar from './components/BurningCalendar/BurningCalendar';
import AOIPanel from './components/AOIPanel/AOIPanel';
import MethodologyDrawer from './components/MethodologyDrawer/MethodologyDrawer';
import './App.css';


function App() {
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [activeTier, setActiveTier] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [activeRegion, setActiveRegion] = useState('na');
  const [selectedCluster, setSelectedCluster] = useState(null);

  // Feature 4: Area of Interest (AOI) State
  const [isAOIOpen, setIsAOIOpen] = useState(false);
  const [activeAOI, setActiveAOI] = useState(null);

  // Feature 6: Science & Methodology Drawer State
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // One-click CSV export generator (Feature 6 requirement)
  const handleExportCSV = async () => {
    const aoiLabel = activeAOI ? activeAOI.name.replace(/[^a-zA-Z0-9]/g, '_') : activeRegion;
    const params = new URLSearchParams({
      year: selectedYear,
      calibrated: isCalibrated,
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
      <TopNav
        activeRegion={activeRegion}
        onSelectRegion={(reg) => {
          setActiveRegion(reg);
          setActiveAOI(null);
        }}
        isCalibrated={isCalibrated}
        onToggleCalibration={() => setIsCalibrated((prev) => !prev)}
        onExportCSV={handleExportCSV}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        onOpenAOI={() => setIsAOIOpen(true)}
        activeAOI={activeAOI}
      />

      {/* 2. 3D Earth Globe & Hotspot Visualizer (Feature 1) */}
      <GlobeViewer
        isCalibrated={isCalibrated}
        activeTier={activeTier}
        onTierChange={(tier) => setActiveTier(tier)}
        onSelectCluster={(spot) => setSelectedCluster(spot)}
        mapboxAccessToken={null} // Plug in Mapbox token here when ready
        activeAOI={activeAOI}
        onClearAOI={() => setActiveAOI(null)}
      />

      {/* 3. Plain-English Threat & Regional Summary Card (Feature 5) */}
      <SummaryCard
        activeYear={selectedYear}
        activeRegion={activeAOI ? activeAOI.name : (activeRegion === 'na' ? 'California Sierra' : 'Global Area')}
        isCalibrated={isCalibrated}
      />

      {/* 4. 52-Week Burning Activity Calendar & Macro Dock (Feature 2) */}
      <BurningCalendar
        selectedYear={selectedYear}
        onSelectYear={(year) => setSelectedYear(year)}
        isCalibrated={isCalibrated}
      />

      {/* 5. Feature 4: Interactive Area of Interest (AOI) Panel */}
      <AOIPanel
        isOpen={isAOIOpen}
        onClose={() => setIsAOIOpen(false)}
        activeAOI={activeAOI}
        onApplyAOI={(aoi) => {
          setActiveAOI(aoi);
          setActiveTier(2); // Automatically zoom to regional biome view when AOI is applied
        }}
        onClearAOI={() => setActiveAOI(null)}
      />

      {/* 6. Feature 6: Science & Methodology Slide-Over Drawer */}
      <MethodologyDrawer
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        activeYear={selectedYear}
        activeRegion={activeAOI ? activeAOI.name : 'California Sierra'}
        onExportCSV={handleExportCSV}
      />

    </div>
  );
}

export default function () {
  return <App />;
}
