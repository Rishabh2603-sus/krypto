import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import GlowCard from "./GlowCard";
import { formatINR } from "./AnimatedNumber";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const formatFullDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "rgba(10, 12, 16, 0.95)",
        border: "1px solid var(--border-medium)",
        borderRadius: "var(--radius-md)",
        padding: "var(--sp-3) var(--sp-4)",
        boxShadow: "0 16px 32px rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(24px)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
        {formatFullDate(label)}
      </div>
      {payload.map((entry, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12.5,
            fontWeight: 500,
            color: "var(--text-primary)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: entry.color || "var(--chart-line)",
              boxShadow: `0 0 6px ${entry.color || "var(--chart-line)"}`,
            }}
          />
          <span style={{ color: "var(--text-secondary)" }}>{entry.name === "cash_change" ? "Delta: " : "Balance: "}</span>
          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{formatINR(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ChartSection({ history = [], title = "Cash Balance Trajectory", playClick }) {
  const [chartView, setChartView] = useState("area"); // "area" | "bar"

  const dailyChanges = history
    .filter((d) => d.cash_change !== 0)
    .map((d) => ({
      ...d,
      fill: d.cash_change >= 0 ? "var(--income-color)" : "var(--expense-color)",
    }));

  return (
    <GlowCard
      style={{
        padding: "var(--sp-6)",
        marginBottom: "var(--sp-6)",
        animation: "fadeInUp var(--duration-slow) var(--ease-out) 200ms both",
      }}
    >
      {/* Header with Title and View Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--sp-5)",
          flexWrap: "wrap",
          gap: "var(--sp-3)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.01em", marginBottom: 2 }}>
            {title}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {history.length} AUDITED DATA POINTS · TIME-SERIES CURVE
          </div>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            gap: 2,
            padding: 3,
            borderRadius: "var(--radius-md)",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <button
            id="btn-chart-area"
            onClick={() => {
              if (playClick) playClick();
              setChartView("area");
            }}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: chartView === "area" ? "rgba(56, 211, 159, 0.12)" : "transparent",
              color: chartView === "area" ? "var(--accent-primary)" : "var(--text-tertiary)",
              fontSize: 11.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              transition: "all var(--duration-fast) var(--ease-out)",
            }}
          >
            Running Balance
          </button>
          <button
            id="btn-chart-bar"
            onClick={() => {
              if (playClick) playClick();
              setChartView("bar");
            }}
            style={{
              padding: "4px 12px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: chartView === "bar" ? "rgba(56, 211, 159, 0.12)" : "transparent",
              color: chartView === "bar" ? "var(--accent-primary)" : "var(--text-tertiary)",
              fontSize: 11.5,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              transition: "all var(--duration-fast) var(--ease-out)",
            }}
          >
            Daily Delta
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div style={{ width: "100%", height: 320, position: "relative", zIndex: 2 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartView === "area" ? (
            <AreaChart data={history} margin={{ top: 8, right: 16, left: 10, bottom: 8 }}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "var(--border-subtle)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatINR}
                tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <ReferenceLine y={0} stroke="var(--expense-color)" strokeDasharray="3 3" strokeOpacity={0.3} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="cash_balance"
                stroke="var(--accent-primary)"
                strokeWidth={2}
                fill="url(#balanceGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  fill: "var(--accent-primary)",
                  stroke: "var(--bg-base)",
                  style: { filter: "drop-shadow(0 0 8px rgba(56, 211, 159, 0.8))" },
                }}
              />
            </AreaChart>
          ) : (
            <BarChart data={dailyChanges} margin={{ top: 8, right: 16, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                axisLine={{ stroke: "var(--border-subtle)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatINR}
                tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={0} stroke="var(--border-subtle)" />
              <Bar dataKey="cash_change" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {dailyChanges.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.cash_change >= 0 ? "var(--income-color)" : "var(--expense-color)"}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </GlowCard>
  );
}
