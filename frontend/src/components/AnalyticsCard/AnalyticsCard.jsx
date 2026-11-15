import React, {useState, useEffect} from 'react';
import {LineChart, XAxis,  YAxis, Tooltip, CartesianGrid, Line} from 'recharts';
import './AnalyticsCard.css';
import {LONG_MONTH_NAMES} from "../../data/calendarData";

export default function AnalyticsCard({
	selectedYear, selectedMonth
}) {
  const [data, setData] = useState({});
  const [yearlyMetric, setYearlyMetric] = useState("counts");
  const [monthlyMetric, setMonthlyMetric] = useState("current_count");

  useEffect(() => {
    (async () => {
      const endpoint = `http://127.0.0.1:5000/api/analytics?year=${selectedYear}&month=${selectedMonth}`;
      const data = await fetch(endpoint).then(r => r.json());
      console.log(data);
      setData(data);
    })();
  }, [selectedYear, selectedMonth]);

  /*
   *


{
    "current_count": 3979,
    "current_frp": 180072.1,
    "frp_pct_vs_median": -80.6,
    "historical_median_count": 6852,
    "historical_median_frp": 926280.5,
    "is_peak_month": true,
    "month": 5,
    "month_full": "May",
    "month_name": "May",
    "pct_vs_median": -41.9
}


   */

  return <aside className="analytics-card">
    <div>Analytics</div>
    <div>Yearly Trends </div>
    <LineChart data={data.yearly_trend} width={300} height={150}>
      <XAxis dataKey="year" fontSize="12" />
      <YAxis fontSize="12"/>
      <Tooltip shared />
      <CartesianGrid stroke="#f5f5f5" />
    {yearlyMetric === "counts" ? <>
      <Line type="monotone" dataKey="calibrated_count" />
      <Line type="monotone" dataKey="raw_count" /></>:

      <Line type="monotone" dataKey="total_frp" />
      }
    </LineChart>
<div><select onChange={e => setYearlyMetric(e.target.value)}><option>counts</option><option>frp</option></select></div>
    <div>Monthly Trends
    </div>
    <LineChart data={data.monthly_comparison} width={300} height={150}>
      <XAxis dataKey="month" fontSize="12" />
      <YAxis fontSize="12"/>
      <Tooltip shared />
      <CartesianGrid stroke="#f5f5f5" />
    {monthlyMetric === "current_count" ? <Line type="monotone" dataKey="current_count" />: null}
    {monthlyMetric === "current_frp" ? <Line type="monotone" dataKey="current_frp" />: null}
    {monthlyMetric === "frp_pct_vs_median" ? <Line type="monotone" dataKey="frp_pct_vs_median" />: null}
    {monthlyMetric === "historical_median_count" ? <Line type="monotone" dataKey="historical_median_count" />: null}
    {monthlyMetric === "historical_median_frp" ? <Line type="monotone" dataKey="historical_median_frp" />: null}
    {monthlyMetric === "pct_vs_median" ? <Line type="monotone" dataKey="pct_vs_median" />: null}
    </LineChart>
    <div>
<select onChange={e => setMonthlyMetric(e.target.value)}>
    <option>current_count</option>
    <option>current_frp</option>
    <option>frp_pct_vs_median</option>
    <option>historical_median_count</option>
    <option>historical_median_frp</option>
    <option>pct_vs_median</option>
    </select>
    </div>
    <div>Current Month</div>
    <div>
    count: {data.selected_month?.current_count}<br/>
    frp: {data.selected_month?.current_frp}<br/>
    frp_pct_vs_median: {data.selected_month?.frp_pct_vs_median}<br/>
    historical_median_count: {data.selected_month?.historical_median_count}<br/>
    historical_median_frp: {data.selected_month?.historical_median_frp}<br/>
    is_peak_month: {data.selected_month?.is_peak_month ? 'yes' : 'no'}<br/>
    pct_vs_median: {data.selected_month?.pct_vs_median}<br/>
    </div>
  </aside>
}
