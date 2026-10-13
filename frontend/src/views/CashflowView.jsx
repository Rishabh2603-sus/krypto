import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import MetricCard from "../components/MetricCard";
import GlowCard from "../components/GlowCard";
import StatusBadge from "../components/StatusBadge";
import { formatINR } from "../components/AnimatedNumber";
import { fetchCashflowBreakdown, fetchCashflowBurn, fetchCashflowSummary } from "../api";

function CustomBarTooltip({ active, payload, label }) {
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
        {label}
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

export default function CashflowView({ playClick }) {
  const [breakdown, setBreakdown] = useState(null);
  const [burn, setBurn] = useState(null);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // "all" | "income" | "expense"

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const [bdData, burnData, sumData] = await Promise.all([
          fetchCashflowBreakdown(),
          fetchCashflowBurn(),
          fetchCashflowSummary(),
        ]);
        if (isMounted) {
          setBreakdown(bdData);
          setBurn(burnData);
          setSummary(sumData);
        }
      } catch (err) {
        console.error("CashflowView fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !breakdown || !burn) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
          {[...Array(3)].map((_, i) => (
            <MetricCard key={i} isLoading={true} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 350, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  // Filter transaction records
  const allHistory = summary?.cash_balance_history?.filter((t) => t.cash_change !== 0) || [];
  const filteredHistory = allHistory.filter((item) => {
    const isIncome = item.cash_change > 0;
    if (filterType === "income" && !isIncome) return false;
    if (filterType === "expense" && isIncome) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.description?.toLowerCase().includes(q) ||
        item.date?.includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      {/* Burn Rate & Runway Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "var(--sp-4)",
        }}
      >
        <MetricCard
          label="Average Daily Burn Rate"
          value={burn.daily_burn}
          riskContext={burn.daily_burn > 35000 ? "high" : "low"}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          iconColor="var(--expense-color)"
          iconBg="var(--expense-dim)"
          subtitle="Operating burn per calendar day"
          delay={0}
        />

        <MetricCard
          label="Estimated Cash Runway"
          value={burn.runway_days}
          formatter={(v) => `${Math.round(v)} Days`}
          riskContext={burn.runway_days < 45 ? "high" : "low"}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
          iconColor="var(--accent-primary)"
          iconBg="var(--accent-dim)"
          subtitle={`Approximately ${burn.runway_months || (burn.runway_days / 30).toFixed(1)} months remaining`}
          delay={60}
        />

        <MetricCard
          label="Monthly Burn Velocity"
          value={burn.monthly_burn}
          riskContext="medium"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
          iconColor="var(--warning-color)"
          iconBg="rgba(251, 191, 36, 0.12)"
          subtitle="Fixed + Variable opex"
          delay={120}
        />
      </div>

      {/* Monthly Inflow vs Outflow Chart */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Monthly Inflow vs Outflow Comparison
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              GROUPED PERIODIC RECEIPTS & DISBURSEMENT VOLUME
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--income-color)" }} />
              INFLOW
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--expense-color)" }} />
              OUTFLOW
            </span>
          </div>
        </div>

        <div style={{ width: "100%", height: 320, position: "relative", zIndex: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={breakdown.monthly} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={{ stroke: "var(--border-subtle)" }} />
              <YAxis tickFormatter={formatINR} tick={{ fontSize: 10.5, fill: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} width={70} />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="income" name="Inflow" fill="var(--income-color)" radius={[3, 3, 0, 0]} maxBarSize={28} />
              <Bar dataKey="expense" name="Outflow" fill="var(--expense-color)" radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlowCard>

      {/* Expense Categories Breakdown & Top Inflows */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--sp-5)" }}>
        {/* Horizontal Progress Bars for Expense Categories */}
        <GlowCard style={{ padding: "var(--sp-6)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, position: "relative", zIndex: 2 }}>
            Expense Categorization
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginBottom: "var(--sp-5)", position: "relative", zIndex: 2 }}>
            DISBURSEMENT DISTRIBUTION BY COST ACCOUNT
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", zIndex: 2 }}>
            {breakdown.categories?.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5, marginBottom: 5 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{cat.name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: "var(--text-tertiary)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{cat.percentage}%</span>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>{formatINR(cat.amount)}</span>
                  </div>
                </div>
                {/* Custom Progress Bar */}
                <div
                  style={{
                    width: "100%",
                    height: 5,
                    borderRadius: 3,
                    background: "rgba(255, 255, 255, 0.04)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${cat.percentage}%`,
                      height: "100%",
                      borderRadius: 3,
                      background: cat.color || "var(--accent-primary)",
                      boxShadow: `0 0 6px ${cat.color || "var(--accent-primary)"}66`,
                      transition: "width 800ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* Top Inflows Summary */}
        <GlowCard style={{ padding: "var(--sp-6)" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, position: "relative", zIndex: 2 }}>
            Key Revenue Contributors
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginBottom: "var(--sp-5)", position: "relative", zIndex: 2 }}>
            LARGEST CUSTOMER INFLOWS CURRENT QUARTER
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", zIndex: 2 }}>
            {breakdown.top_inflows?.map((inf, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {inf.client}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                    SHARE: {inf.share}
                  </div>
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--income-color)", fontFamily: "var(--font-mono)" }}>
                  +{formatINR(inf.amount)}
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>

      {/* Transaction Explorer with Filters */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: 12, position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Transaction Explorer & Audit
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              {filteredHistory.length} MATCHING AUDIT RECORDS
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* Type selector */}
            <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.03)", padding: 2, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
              {["all", "income", "expense"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (playClick) playClick();
                    setFilterType(t);
                  }}
                  style={{
                    padding: "3px 10px",
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    background: filterType === t ? "rgba(56, 211, 159, 0.12)" : "transparent",
                    color: filterType === t ? "var(--accent-primary)" : "var(--text-tertiary)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Search input */}
            <input
              type="text"
              placeholder="Search description or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "var(--text-primary)",
                fontSize: 12,
                outline: "none",
                width: 220,
                fontFamily: "inherit",
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto", position: "relative", zIndex: 2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>DATE</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>DESCRIPTION</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>TYPE</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right" }}>AMOUNT</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right" }}>RUNNING BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item, idx) => {
                const isIncome = item.cash_change > 0;
                return (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.03)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{item.date}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontWeight: 500 }}>{item.description}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <StatusBadge type={isIncome ? "income" : "expense"} size="sm" />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontFamily: "var(--font-mono)", color: isIncome ? "var(--income-color)" : "var(--expense-color)" }}>
                      {isIncome ? "+" : "−"}{formatINR(Math.abs(item.cash_change))}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {formatINR(item.cash_balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
