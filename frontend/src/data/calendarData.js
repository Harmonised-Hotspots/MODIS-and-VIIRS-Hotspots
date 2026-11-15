// Historical Multi-Year Burning Activity Dataset (2000–2026)
// Cross-calibrated MODIS C6.1 (1km) & VIIRS VNP14IMGTDL (375m)

export const YEARS = Array.from({ length: 8 }, (_, i) => 2018 + i);

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
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const LONG_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const NUM_WEEKS = 52;

export function getCalendarGridForYear(year = 2020) {
  let date = Temporal.Now.plainDateISO().with({month: 1, day: 1});
  let nextYear = Temporal.Now.plainDateISO().with({year: date.year + 1, month: 1, day: 1});
  const cells = [];
  let i = 0; 
  while (date.until(nextYear).total('hours') > 0) {
    cells.push({date, level: Math.floor((Math.sin(i % 7 / 6 * Math.PI)) * 4) });
    date = date.add('P1D');
    i++;
  }
  return cells;
}
