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
  const handleExportCSV = () => {
    const aoiLabel = activeAOI ? activeAOI.name.replace(/[^a-zA-Z0-9]/g, '_') : activeRegion;
    const csvContent = [
      'date,latitude,longitude,frp_megawatts,sensor,aoi_filter,harmonized_confidence',
      `2020-08-22,37.195,-119.261,1840.4,MODIS_VIIRS_SYNTH,${aoiLabel},98.2`,
      `2020-08-22,37.210,-119.280,1210.8,VIIRS_CROSS_CAL,${aoiLabel},95.6`,
      `2020-08-22,37.180,-119.240,890.1,MODIS_C61,${aoiLabel},92.0`,
      `2020-08-23,37.250,-119.310,1450.0,MODIS_VIIRS_SYNTH,${aoiLabel},97.1`,
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `nasa_fire_harmonized_${aoiLabel}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
