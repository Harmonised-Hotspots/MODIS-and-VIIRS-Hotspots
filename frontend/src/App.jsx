import React, { useState } from 'react';
import GlobeViewer from './components/GlobeViewer/GlobeViewer';
import BurningCalendar from './components/BurningCalendar/BurningCalendar';
import './App.css';

function App() {
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [activeTier, setActiveTier] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2020);
  const [selectedCluster, setSelectedCluster] = useState(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030509]">
      {/* 3D Earth Globe & Hotspot Visualizer (Feature 1) */}
      <GlobeViewer
        isCalibrated={isCalibrated}
        activeTier={activeTier}
        onTierChange={(tier) => setActiveTier(tier)}
        onSelectCluster={(spot) => setSelectedCluster(spot)}
        mapboxAccessToken={null} // Plug in Mapbox token here when ready
      />

      {/* 52-Week Burning Activity Calendar & Macro Dock (Feature 2) */}
      <BurningCalendar
        selectedYear={selectedYear}
        onSelectYear={(year) => setSelectedYear(year)}
        isCalibrated={isCalibrated}
      />
    </div>
  );
}

export default App;
