// Mock Hotspot dataset for Globe & Map visualization
// Formatted ready for Mapbox GeoJSON FeatureCollection conversion

export const SAMPLE_HOTSPOTS = [
  {
    id: 'fire-creek-01',
    name: 'Creek Fire Complex',
    region: 'California Sierra',
    lat: 37.195,
    lon: -119.261,
    frp: 1840, // Fire Radiative Power (MW)
    confidence: 95,
    isGhost: false, // True wildfire core
    date: '2020-08-22',
  },
  {
    id: 'fire-ghost-02',
    name: 'Filtered Noise Cluster',
    region: 'California Foothills',
    lat: 37.310,
    lon: -119.450,
    frp: 12,
    confidence: 35,
    isGhost: true, // Filtered sensor false-alarm pixel
    date: '2020-08-22',
  },
  {
    id: 'fire-ghost-03',
    name: 'Filtered Noise Cluster',
    region: 'California Foothills',
    lat: 37.120,
    lon: -119.150,
    frp: 18,
    confidence: 40,
    isGhost: true, // Filtered sensor false-alarm pixel
    date: '2020-08-22',
  },
  {
    id: 'fire-amazon-04',
    name: 'Amazon Deforestation Burn',
    region: 'Amazon Basin, Brazil',
    lat: -9.871,
    lon: -55.823,
    frp: 620,
    confidence: 88,
    isGhost: false,
    date: '2020-08-22',
  },
  {
    id: 'fire-aus-05',
    name: 'NSW Bushfire Outbreak',
    region: 'New South Wales, Australia',
    lat: -33.868,
    lon: 151.209,
    frp: 910,
    confidence: 92,
    isGhost: false,
    date: '2020-01-14',
  },
];

export const ZOOM_TIERS = {
  1: { id: 1, label: '1: Orbit Globe', mapboxZoom: 1.5, pitch: 0, desc: 'Planetary Overview' },
  2: { id: 2, label: '2: Regional Biome', mapboxZoom: 6.0, pitch: 35, desc: 'Corridor & State Scale' },
  3: { id: 3, label: '3: Tactical Ridge', mapboxZoom: 12.0, pitch: 65, desc: '3D Terrain & Watershed Perimeters' },
};
