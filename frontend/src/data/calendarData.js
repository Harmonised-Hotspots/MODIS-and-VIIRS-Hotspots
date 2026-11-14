// Historical Multi-Year Burning Activity Dataset (2000–2026)
// Cross-calibrated MODIS C6.1 (1km) & VIIRS VNP14IMGTDL (375m)

export const YEARS = Array.from({ length: 27 }, (_, i) => 2000 + i);

export const KEY_EPOCHS = [
  { year: 2003, label: '2003 (MODIS Only)', desc: 'Cedar Fire Outbreak' },
  { year: 2012, label: '2012 (Transition)', desc: 'VIIRS Satellite Launched' },
  { year: 2018, label: '2018 (Camp Fire)', desc: 'Severe Drought Season' },
  { year: 2020, label: '2020 (Peak Outbreak)', desc: 'Historical Record (Creek Fire)' },
  { year: 2024, label: '2024 (Park Fire)', desc: 'Current Active Season' },
  { year: 2026, label: '2026 (Present)', desc: 'Current Real-Time Feed' },
];

// 25-Year Macro Trajectory Data (Raw uncalibrated vs Harmonized calibrated)
export const MACRO_TREND = [
  { year: 2000, raw: 840, calibrated: 840, note: 'Terra MODIS Operational' },
  { year: 2002, raw: 910, calibrated: 910 },
  { year: 2003, raw: 1190, calibrated: 1190, note: '2003 Southern CA Outbreak' },
  { year: 2006, raw: 930, calibrated: 930 },
  { year: 2008, raw: 1040, calibrated: 1040 },
  { year: 2011, raw: 980, calibrated: 980, note: 'Final Pre-VIIRS Season' },
  { year: 2012, raw: 3950, calibrated: 1040, isSensorSwitch: true, note: 'VIIRS Launch (+340% Artifact)' },
  { year: 2014, raw: 4120, calibrated: 1090 },
  { year: 2017, raw: 4580, calibrated: 1210, note: 'Tubbs & Thomas Outbreaks' },
  { year: 2018, raw: 4690, calibrated: 1235, note: 'Camp Fire Outbreak' },
  { year: 2020, raw: 5120, calibrated: 1350, isPeak: true, note: 'Historic Peak Season (Creek Fire)' },
  { year: 2021, raw: 4890, calibrated: 1290, note: 'Dixie Fire' },
  { year: 2023, raw: 3820, calibrated: 1010, note: 'High Precipitation / Cool Season' },
  { year: 2024, raw: 4480, calibrated: 1180, note: 'Park Fire Complex' },
  { year: 2026, raw: 4150, calibrated: 1095, isCurrent: true, note: 'Active Real-Time Monitoring' },
];

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug (Peak)', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAY_NAMES = ['Mon', 'Wed', 'Fri', 'Sun'];

// Deterministic calendar generator for any year (4 rows x 16 columns)
export function getCalendarGridForYear(year = 2020) {
  const cells = [];
  const isHighYear = year === 2020 || year === 2018 || year === 2021;
  const isModerateYear = year === 2024 || year === 2017 || year === 2003;

  for (let r = 0; r < 4; r++) {
    for (let col = 0; col < 16; col++) {
      let level = 0;
      let count = 0;
      let isPeakDay = false;

      // Summer Outbreak Window (Columns 7 to 12 = Jul to Oct)
      if (col >= 8 && col <= 11) {
        if (col === 10 && r === 0 && isHighYear) {
          level = 4; // Peak Outbreak day
          count = year === 2020 ? 480 : 390;
          isPeakDay = true;
        } else if (col >= 9 && col <= 11) {
          level = isHighYear ? 3 : 2;
          count = Math.floor(120 + ((col * 31 + r * 17) % 90));
        } else {
          level = 2;
          count = Math.floor(60 + ((col * 19 + r * 11) % 50));
        }
      } else if (col >= 5 && col <= 7) { // Early summer rising
        level = 1;
        count = Math.floor(15 + ((col * 13 + r * 7) % 35));
      } else if (col >= 12 && col <= 13) { // Fall tapering
        level = isHighYear ? 2 : 1;
        count = Math.floor(25 + ((col * 11 + r * 5) % 40));
      } else { // Winter / Cool Dormant (Nov - Apr)
        level = 0;
        count = Math.floor((col + r) % 6);
      }

      cells.push({
        id: `${year}-r${r}-c${col}`,
        row: r,
        dayName: DAY_NAMES[r],
        col,
        level,
        count,
        isPeakDay,
      });
    }
  }

  return cells;
}
