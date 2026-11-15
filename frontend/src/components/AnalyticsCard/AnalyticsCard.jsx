import React, { useState, useEffect } from "react";
import {
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
} from "recharts";
import "./AnalyticsCard.css";
import { LONG_MONTH_NAMES, MONTH_NAMES } from "../../data/calendarData";

export default function AnalyticsCard({ selectedYear, selectedMonth }) {
  const [data, setData] = useState({});
  const [yearlyMetric, setYearlyMetric] = useState("counts");
  const [monthlyMetric, setMonthlyMetric] = useState("current_count");

  useEffect(() => {
    (async () => {
      const endpoint = `http://127.0.0.1:5000/api/analytics?year=${selectedYear}&month=${selectedMonth}`;
      const data = await fetch(endpoint).then((r) => r.json());
      setData(data);
    })();
  }, [selectedYear, selectedMonth]);

  return (
    <aside className="analytics-card">
      <div style={{ fontSize: "20px", fontWeight: "bold" }}>Analytics</div>
      <div className="trends">
        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: 10 }}>
          Yearly Trends
        </div>
        <LineChart data={data.yearly_trend} width={350} height={120}>
          <XAxis dataKey="year" fontSize="12" />
          <YAxis fontSize="12" />
          {yearlyMetric === "counts" ? (
            <>
              <Line type="monotone" dataKey="calibrated_count" />
              <Line type="monotone" dataKey="raw_count" />
            </>
          ) : (
            <Line type="monotone" dataKey="total_frp" />
          )}
        </LineChart>
        <div className="chart-selector">
          <select onChange={(e) => setYearlyMetric(e.target.value)}>
            <option>Harmonized and Raw counts</option>
            <option>FRP</option>
          </select>
        </div>
      </div>
      <div className="trends">
        <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: 10 }}>
          Monthly Trends
        </div>
        <LineChart data={data.monthly_comparison} width={350} height={120}>
          <XAxis
            dataKey="month"
            fontSize="12"
            tick={(d) => {
              return (
                <g transform={`translate(${d.x},${d.y})`}>
                  <text
                    x={0}
                    y={0}
                    dy={16}
                    textAnchor="end"
                    transform="rotate(-35)"
                    fill="#777"
                    fontSize="12px"
                  >
                    {MONTH_NAMES[d.payload.value - 1]}
                  </text>
                </g>
              );
            }}
          />
          <YAxis fontSize="12" />
          {[
            "current_count",
            "current_frp",
            "frp_pct_vs_median",
            "historical_median_count",
            "historical_median_frp",
            "pct_vs_median",
          ]
            .filter((f) => f === monthlyMetric)
            .map((f) => (
              <Line type="monotone" dataKey={f} />
            ))}
        </LineChart>
        <div className="chart-selector">
          <select onChange={(e) => setMonthlyMetric(e.target.value)}>
            <option value="current_count">Counts</option>
            <option value="current_frp">FRP</option>
            <option value="frp_pct_vs_median">FRP vs Median</option>
            <option value="historical_median_count">
              Historical Median Count
            </option>
            <option value="historical_median_frp">Historical Median FRP</option>
            <option value="pct_vs_median">Percent vs Median</option>
          </select>
        </div>
      </div>
    </aside>
  );
}
