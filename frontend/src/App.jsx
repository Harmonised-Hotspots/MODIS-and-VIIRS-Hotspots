import React, { useState } from 'react';
import GlobeViewer from './components/GlobeViewer/GlobeViewer';
import './App.css';

function App() {
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [activeTier, setActiveTier] = useState(1);
  const [selectedCluster, setSelectedCluster] = useState(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#030509]">
      {/* 3D Earth Globe & Hotspot Visualizer (Feature 1 Scaffolding) */}
      <GlobeViewer
        isCalibrated={isCalibrated}
        activeTier={activeTier}
        onTierChange={(tier) => setActiveTier(tier)}
        onSelectCluster={(spot) => setSelectedCluster(spot)}
        mapboxAccessToken={null} // Pass 'pk.xxx' here when ready to activate live Mapbox map
      />
    </div>
  );
}

export default App;
