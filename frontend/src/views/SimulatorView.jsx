import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import GlowCard from "../components/GlowCard";
import StatusBadge from "../components/StatusBadge";
import { formatINR } from "../components/AnimatedNumber";
import { simulateScenario } from "../api";

const defaultSliders = {
  collectionDelay: 0,
  expenseShock: 0,
  revenueGrowth: 0,
  cashInjection: 0,
};

function SimTooltip({ active, payload, label }) {
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
        DAY {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 2 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: entry.color }} />
          <span style={{ color: "var(--text-secondary)" }}>{entry.name}:</span>
          <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {formatINR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function SimulatorView({ playClick, playSuccess }) {
  const [sliders, setSliders] = useState(defaultSliders);
  const [simResult, setSimResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSim = useCallback(async (paramsToRun) => {
    setIsRunning(true);
    try {
      const res = await simulateScenario(paramsToRun);
      setSimResult(res);
      if (playSuccess) playSuccess();
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsRunning(false);
    }
  }, [playSuccess]);

  // Run initial simulation on load
  useEffect(() => {
    runSim(defaultSliders);
  }, [runSim]);

  const handleSliderChange = (field, value) => {
    if (playClick) playClick();
    const next = { ...sliders, [field]: Number(value) };
    setSliders(next);
  };

  const handleReset = () => {
    if (playClick) playClick();
    setSliders(defaultSliders);
    runSim(defaultSliders);
  };

  const handleRun = () => {
    runSim(sliders);
  };

  const isNetPositive = simResult?.net_liquidity_change >= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      {/* Top Header Card */}
      <GlowCard
        style={{
          padding: "var(--sp-5) var(--sp-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            What-If Cash Flow Sandbox
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            STRESS TEST MACRO LIQUIDITY, DEBTOR LAGS & CAPITAL INJECTIONS
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, position: "relative", zIndex: 2 }}>
          <button
            onClick={handleReset}
            style={{
              padding: "7px 14px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255, 255, 255, 0.03)",
              color: "var(--text-secondary)",
              fontWeight: 500,
              fontSize: 11.5,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            RESET
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            style={{
              padding: "7px 18px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid rgba(56, 211, 159, 0.4)",
              background: "rgba(56, 211, 159, 0.12)",
              color: "var(--accent-primary)",
              fontWeight: 600,
              fontSize: 11.5,
              fontFamily: "var(--font-mono)",
              cursor: isRunning ? "wait" : "pointer",
              transition: "all 150ms ease",
            }}
          >
            {isRunning ? "SIMULATING..." : "RUN SIMULATION"}
          </button>
        </div>
      </GlowCard>

      {/* Grid: 4 Interactive Range Sliders (Left) + Outcome Card (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "var(--sp-5)" }} className="sim-controls-grid">
        {/* Sliders Panel */}
        <GlowCard style={{ padding: "var(--sp-6)" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-5)", position: "relative", zIndex: 2 }}>
            Sensitivity & Stress Parameters
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20, position: "relative", zIndex: 2 }}>
            {/* 1. Collection Delay */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
                <span style={{ color: "var(--text-secondary)" }}>1. Collection Lag (AR Delay):</span>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: sliders.collectionDelay > 0 ? "var(--warning-color)" : "var(--text-primary)" }}>
                  {sliders.collectionDelay > 0 ? `+${sliders.collectionDelay} Days` : `${sliders.collectionDelay} Days`}
                </span>
              </div>
              <input
                type="range"
                min="-15"
                max="45"
                step="1"
                value={sliders.collectionDelay}
                onChange={(e) => handleSliderChange("collectionDelay", e.target.value)}
                className="sim-slider"
                style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginTop: 3 }}>
                <span>-15d (Accelerated)</span>
                <span>0d (Baseline)</span>
                <span>+45d (Severe Lag)</span>
              </div>
            </div>

            {/* 2. Expense Shock */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
                <span style={{ color: "var(--text-secondary)" }}>2. Operational Expense Shock:</span>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: sliders.expenseShock > 0 ? "var(--expense-color)" : "var(--income-color)" }}>
                  {sliders.expenseShock > 0 ? `+${sliders.expenseShock}%` : `${sliders.expenseShock}%`}
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                step="5"
                value={sliders.expenseShock}
                onChange={(e) => handleSliderChange("expenseShock", e.target.value)}
                className="sim-slider"
                style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginTop: 3 }}>
                <span>-20% (Cost cut)</span>
                <span>0% (Steady state)</span>
                <span>+50% (Surge)</span>
              </div>
            </div>

            {/* 3. Revenue Growth */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
                <span style={{ color: "var(--text-secondary)" }}>3. Revenue Trajectory Adjustment:</span>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: sliders.revenueGrowth >= 0 ? "var(--income-color)" : "var(--expense-color)" }}>
                  {sliders.revenueGrowth > 0 ? `+${sliders.revenueGrowth}%` : `${sliders.revenueGrowth}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="30"
                step="5"
                value={sliders.revenueGrowth}
                onChange={(e) => handleSliderChange("revenueGrowth", e.target.value)}
                className="sim-slider"
                style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginTop: 3 }}>
                <span>-30% (Drop)</span>
                <span>0% (Baseline)</span>
                <span>+30% (Upside)</span>
              </div>
            </div>

            {/* 4. Cash Injection */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12.5 }}>
                <span style={{ color: "var(--text-secondary)" }}>4. Capital / Debt Injection:</span>
                <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--accent-primary)" }}>
                  {formatINR(sliders.cashInjection)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2500000"
                step="100000"
                value={sliders.cashInjection}
                onChange={(e) => handleSliderChange("cashInjection", e.target.value)}
                className="sim-slider"
                style={{ width: "100%", accentColor: "var(--accent-primary)", cursor: "pointer" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", marginTop: 3 }}>
                <span>₹0 (None)</span>
                <span>₹10.0L</span>
                <span>₹25.0L (Bridge)</span>
              </div>
            </div>
          </div>
        </GlowCard>

        {/* Outcome Card */}
        <GlowCard
          style={{
            padding: "var(--sp-6)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--sp-4)" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                Simulated Outcome Impact
              </span>
              <StatusBadge
                type={isNetPositive ? "healthy" : "critical"}
                label={isNetPositive ? "Cushion" : "Strain"}
              />
            </div>

            {simResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>RUNWAY DELTA</div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 600,
                      color: simResult.runway_delta_days >= 0 ? "var(--income-color)" : "var(--expense-color)",
                      fontFamily: "var(--font-mono)",
                      marginTop: 2,
                    }}
                  >
                    {simResult.runway_delta_days >= 0 ? `+${simResult.runway_delta_days} Days` : `${simResult.runway_delta_days} Days`}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                    Simulated: {simResult.simulated_runway_days}d (Base: {simResult.baseline_runway_days}d)
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>NET LIQUIDITY IMPACT (DAY 60)</div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: isNetPositive ? "var(--income-color)" : "var(--expense-color)",
                      marginTop: 2,
                    }}
                  >
                    {isNetPositive ? "+" : "−"}{formatINR(Math.abs(simResult.net_liquidity_change))}
                  </div>
                </div>

                {simResult.stress_alert && (
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(248, 113, 113, 0.08)",
                      border: "1px solid rgba(248, 113, 113, 0.2)",
                      fontSize: 11.5,
                      color: "var(--expense-color)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ⚠ {simResult.stress_alert}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 16, borderTop: "1px solid var(--border-subtle)", paddingTop: 10, position: "relative", zIndex: 2 }}>
            REAL-TIME SENSITIVITY MODEL · 60-DAY PROJECTION HORIZON
          </div>
        </GlowCard>
      </div>

      {/* Comparison Chart: Baseline (dashed emerald) vs Simulated (solid) */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Scenario Curve: Baseline vs Simulated Cash Position
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              PROJECTED TRAJECTORY COMPARISON OVER 60 DAYS
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "center", fontSize: 11.5, fontFamily: "var(--font-mono)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--accent-primary)" }}>
              <span style={{ width: 10, height: 2, borderTop: "2px dashed var(--accent-primary)" }} />
              Baseline
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: isNetPositive ? "var(--income-color)" : "var(--expense-color)", fontWeight: 600 }}>
              <span style={{ width: 10, height: 2, background: isNetPositive ? "var(--income-color)" : "var(--expense-color)" }} />
              Simulated
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: 340, position: "relative", zIndex: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={simResult?.comparison || []} margin={{ top: 10, right: 15, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="day" tickFormatter={(d) => `Day ${d}`} tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={{ stroke: "var(--border-subtle)" }} />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip content={<SimTooltip />} />
              {/* Baseline dashed */}
              <Line
                type="monotone"
                dataKey="baseline"
                name="Baseline"
                stroke="var(--accent-primary)"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
              {/* Simulated solid */}
              <Line
                type="monotone"
                dataKey="simulated"
                name="Simulated"
                stroke={isNetPositive ? "var(--income-color)" : "var(--expense-color)"}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: isNetPositive ? "var(--income-color)" : "var(--expense-color)", stroke: "var(--bg-base)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>
    </div>
  );
}
