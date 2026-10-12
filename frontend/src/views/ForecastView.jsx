import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import MetricCard from "../components/MetricCard";
import GlowCard from "../components/GlowCard";
import StatusBadge from "../components/StatusBadge";
import { formatINR } from "../components/AnimatedNumber";
import { fetchForecast } from "../api";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
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
        {label ? new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#34d399", fontFamily: "var(--font-mono)", fontSize: 11 }}>p90 Optimistic:</span>
          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{formatINR(d.p90)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "var(--accent-primary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>p50 Expected:</span>
          <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>{formatINR(d.p50)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#f87171", fontFamily: "var(--font-mono)", fontSize: 11 }}>p10 Conservative:</span>
          <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)" }}>{formatINR(d.p10)}</span>
        </div>
        {d.confidence && (
          <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
            SIMULATION CONFIDENCE: {d.confidence}%
          </div>
        )}
      </div>
    </div>
  );
}

export default function ForecastView({ playClick }) {
  const [horizon, setHorizon] = useState(90);
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchForecast(horizon);
        if (isMounted) setForecastData(data);
      } catch (err) {
        console.error("Forecast fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [horizon]);

  const handleHorizonChange = (h) => {
    if (playClick) playClick();
    setHorizon(h);
  };

  if (isLoading || !forecastData) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        <div className="skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)" }} />
        <div className="skeleton" style={{ height: 380, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const { runway_days, shortfall_date, capital_needed, forecast, assumptions } = forecastData;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      {/* Insolvency / Shortfall Alert Banner */}
      {shortfall_date ? (
        <GlowCard
          style={{
            padding: "var(--sp-5) var(--sp-6)",
            border: "1px solid rgba(248, 113, 113, 0.3)",
            background: "rgba(248, 113, 113, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 2 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "var(--radius-md)",
                background: "rgba(248, 113, 113, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--expense-color)",
                flexShrink: 0,
                border: "1px solid rgba(248, 113, 113, 0.25)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--expense-color)", letterSpacing: "0.02em" }}>
                LIQUIDITY SHORTFALL IDENTIFIED
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-primary)", marginTop: 2 }}>
                Cash projected to reach ₹0 by{" "}
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                  {new Date(shortfall_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                . Bridge capital required:{" "}
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--expense-color)" }}>
                  {formatINR(capital_needed || 3200000)}
                </span>
              </div>
            </div>
          </div>

          <StatusBadge type="critical" label="Threshold Breach" />
        </GlowCard>
      ) : (
        <GlowCard
          style={{
            padding: "var(--sp-4) var(--sp-6)",
            border: "1px solid rgba(56, 211, 159, 0.25)",
            background: "rgba(56, 211, 159, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--income-color)",
                boxShadow: "0 0 8px var(--income-color)",
              }}
            />
            <span style={{ fontSize: 13, color: "var(--text-primary)" }}>
              No insolvency threshold crossed within the selected {horizon}-day projection window.
            </span>
          </div>
          <StatusBadge type="healthy" label="Solvent Trajectory" />
        </GlowCard>
      )}

      {/* Horizon Selector & Top Metric Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
        <MetricCard
          label="Projected Runway"
          value={runway_days != null ? runway_days : 180}
          formatter={(v) => (runway_days != null ? `${Math.round(v)} Days` : "180+ Days")}
          riskContext={runway_days != null && runway_days < 45 ? "high" : "low"}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          iconColor="var(--accent-primary)"
          iconBg="var(--accent-dim)"
          subtitle={`Forecast Horizon: ${horizon} Days`}
        />

        <MetricCard
          label="Estimated p50 Ending Cash"
          value={forecast && forecast.length > 0 ? forecast[forecast.length - 1].p50 : 0}
          riskContext="positive"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          }
          iconColor="var(--income-color)"
          iconBg="var(--income-dim)"
          subtitle="Median expected balance"
        />

        {/* Horizon Pill Selector Box */}
        <GlowCard
          style={{
            padding: "var(--sp-4) var(--sp-6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 8, fontFamily: "var(--font-mono)", fontWeight: 600, letterSpacing: "0.06em", position: "relative", zIndex: 2 }}>
            FORECAST TIMELINE HORIZON
          </div>
          <div style={{ display: "flex", gap: 6, position: "relative", zIndex: 2 }}>
            {[30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => handleHorizonChange(days)}
                style={{
                  flex: 1,
                  padding: "7px 0",
                  borderRadius: "var(--radius-sm)",
                  border: horizon === days ? "1px solid rgba(56, 211, 159, 0.4)" : "1px solid var(--border-subtle)",
                  background: horizon === days ? "rgba(56, 211, 159, 0.12)" : "rgba(255, 255, 255, 0.02)",
                  color: horizon === days ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: 600,
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                }}
              >
                {days}D
              </button>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Triple-Line Predictive Area Chart (p10, p50, p90) */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Predictive Cash Flow Simulation (p10 / p50 / p90 Bands)
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              STOCHASTIC MONTE CARLO (N=1,000 RUNS)
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 11.5, fontFamily: "var(--font-mono)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#34d399" }}>
              <span style={{ width: 8, height: 2, background: "#34d399" }} />
              p90 Optimistic
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-primary)", fontWeight: 600 }}>
              <span style={{ width: 8, height: 3, background: "var(--accent-primary)" }} />
              p50 Expected
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#f87171" }}>
              <span style={{ width: 8, height: 2, background: "#f87171" }} />
              p10 Conservative
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: 380, position: "relative", zIndex: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecast} margin={{ top: 10, right: 15, left: 10, bottom: 8 }}>
              <defs>
                <linearGradient id="p90Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="p10Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={{ stroke: "var(--border-subtle)" }} />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={70} />
              <ReferenceLine y={0} stroke="var(--expense-color)" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip content={<ForecastTooltip />} />

              {/* p90 area */}
              <Area type="monotone" dataKey="p90" stroke="#34d399" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#p90Gradient)" dot={false} />

              {/* p10 area */}
              <Area type="monotone" dataKey="p10" stroke="#f87171" strokeWidth={1.5} strokeDasharray="3 3" fill="url(#p10Gradient)" dot={false} />

              {/* p50 median expected line */}
              <Area
                type="monotone"
                dataKey="p50"
                stroke="var(--accent-primary)"
                strokeWidth={2.5}
                fill="none"
                dot={false}
                activeDot={{ r: 5, fill: "var(--accent-primary)", stroke: "var(--bg-base)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>

      {/* Model Confidence & Assumptions Box */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, position: "relative", zIndex: 2 }}>
          Forecast Methodology & Stochastic Parameters
        </div>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16, position: "relative", zIndex: 2 }}>
          KRYPTO generates non-linear probabilistic bounds leveraging historical daily variances, scheduled AP maturities, customer collection latency patterns, and seasonal cash cycles.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10, position: "relative", zIndex: 2 }}>
          {assumptions?.map((assump, i) => (
            <div
              key={i}
              style={{
                padding: "8px 12px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.02)",
                border: "1px solid var(--border-subtle)",
                fontSize: 12,
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: "var(--accent-primary)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>›</span>
              <span>{assump}</span>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}
