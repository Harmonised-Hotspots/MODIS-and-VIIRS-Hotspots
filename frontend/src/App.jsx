import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app-container">
      <h1 className="title">NASA Fire Harmonization</h1>
      <p className="subtitle">
        MODIS and VIIRS Hotspot Harmonization & Burning Activity Calendar
      </p>

      <div className="card">
        <button onClick={() => setCount((c) => c + 1)}>
          Count is {count}
        </button>
        <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.9rem' }}>
          Frontend environment initialized with React, JavaScript, and CSS.
        </p>
      </div>
    </div>
  );
}

export default App;
