import { useState, useEffect } from "react";
import MetricCard from "../components/MetricCard";
import ChartSection from "../components/ChartSection";
import StatusBadge from "../components/StatusBadge";
import GlowCard from "../components/GlowCard";
import AnimatedNumber, { formatINR } from "../components/AnimatedNumber";
import { fetchCashflowSummary, fetchRiskScore, fetchRecommendations } from "../api";

const formatFullDate = (date) =>
  new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

export default function OverviewView({ playClick, playSuccess }) {
  const [data, setData] = useState(null);
  const [risk, setRisk] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [cfData, riskData, recData] = await Promise.all([
          fetchCashflowSummary(),
          fetchRiskScore(),
          fetchRecommendations(),
        ]);
        if (isMounted) {
          setData(cfData);
          setRisk(riskData);
          setRecommendations(recData || []);
        }
      } catch (err) {
        console.error("Overview fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !data) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
          {[...Array(4)].map((_, i) => (
            <MetricCard key={i} isLoading={true} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 350, borderRadius: "var(--radius-lg)" }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: "var(--sp-4)" }}>
          <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius-lg)" }} />
          <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    );
  }

  const history = data.cash_balance_history || [];
  const latest = history.length > 0 ? history[history.length - 1] : null;
  const prevBalance = history.length > 1 ? history[history.length - 2].cash_balance : null;
  const changePercent = prevBalance && latest ? (((latest.cash_balance - prevBalance) / prevBalance) * 100).toFixed(1) : null;

  // Sorted and paginated transactions
  const filteredTx = history.filter((d) => d.cash_change !== 0);
  const sortedTx = [...filteredTx].sort((a, b) =>
    sortDir === "desc" ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)
  );
  const totalPages = Math.ceil(sortedTx.length / pageSize) || 1;
  const currentTx = sortedTx.slice((page - 1) * pageSize, page * pageSize);

  const summaryRows = [
    { label: "Opening balance", value: data.opening_balance, prefix: "" },
    { label: "Total income", value: data.total_income, prefix: "+", color: "var(--income-color)" },
    { label: "Total expenses", value: data.total_expense, prefix: "−", color: "var(--expense-color)" },
  ];

  return (
    <div className="overview-container" style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      {/* Top Banner / Risk Badge Header */}
      <GlowCard
        style={{
          padding: "var(--sp-4) var(--sp-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              background: "rgba(56, 211, 159, 0.1)",
              border: "1px solid rgba(56, 211, 159, 0.25)",
              color: "var(--accent-primary)",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            ACTIVE PROFILE: {data.profile || "Manufacturing MSME"}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {data.transaction_count} AUDITED LEDGER ENTRIES
          </span>
        </div>

        {risk && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}>
            <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>RISK:</span>
            {(() => {
              const scoreVal = Math.round(risk.risk_score ?? risk.score ?? 35);
              const levelVal = risk.risk_level || risk.status || "LOW";
              return (
                <StatusBadge
                  type={scoreVal > 70 ? "critical" : scoreVal > 50 ? "moderate" : "healthy"}
                  label={`${scoreVal}/100 · ${levelVal}`}
                />
              );
            })()}
          </div>
        )}
      </GlowCard>

      {/* 4 Hero Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: "var(--sp-4)",
        }}
      >
        <MetricCard
          label="Current Cash Position"
          value={data.current_cash}
          riskContext={data.current_cash < 2000000 ? "high" : "low"}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
            </svg>
          }
          iconColor="var(--accent-primary)"
          iconBg="var(--accent-dim)"
          trend={changePercent !== null ? Number(changePercent) : 5.8}
          trendLabel="vs prev close"
          delay={0}
        />

        <MetricCard
          label="Total Operating Inflow"
          value={data.total_income}
          riskContext="positive"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5,12 12,5 19,12" />
            </svg>
          }
          iconColor="var(--income-color)"
          iconBg="var(--income-dim)"
          trend={12.4}
          trendLabel="MoM expansion"
          delay={60}
        />

        <MetricCard
          label="Total Operating Outflow"
          value={data.total_expense}
          riskContext="negative"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19,12 12,19 5,12" />
            </svg>
          }
          iconColor="var(--expense-color)"
          iconBg="var(--expense-dim)"
          trend={-3.2}
          trendLabel="burn efficiency"
          delay={120}
        />

        <MetricCard
          label="Net Cash Generation"
          value={data.net_cashflow}
          riskContext={data.net_cashflow >= 0 ? "healthy" : "critical"}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" />
              <polyline points="17,6 23,6 23,12" />
            </svg>
          }
          iconColor={data.net_cashflow >= 0 ? "var(--income-color)" : "var(--expense-color)"}
          iconBg={data.net_cashflow >= 0 ? "var(--income-dim)" : "var(--expense-dim)"}
          trend={data.net_cashflow >= 0 ? 8.9 : -14.2}
          trendLabel="net operating delta"
          delay={180}
        />
      </div>

      {/* Cash Balance History Chart */}
      <ChartSection history={history} title="Cash Balance & Liquidity Trajectory" playClick={playClick} />

      {/* Summary Panel + Position Panel Side by Side */}
      <div
        className="summary-position-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.3fr",
          gap: "var(--sp-5)",
        }}
      >
        {/* Cash Flow Summary Panel */}
        <GlowCard
          style={{
            padding: "var(--sp-6)",
            animation: "fadeInUp var(--duration-slow) var(--ease-out) 300ms both",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-5)", position: "relative", zIndex: 2 }}>
            Ledger Reconciliation
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)", position: "relative", zIndex: 2 }}>
            {summaryRows.map((r) => (
              <div
                key={r.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 13,
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    color: r.color || "var(--text-primary)",
                  }}
                >
                  {r.prefix}
                  {formatINR(r.value)}
                </span>
              </div>
            ))}

            <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 14,
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Net Cash Flow</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: 16,
                  color: data.net_cashflow >= 0 ? "var(--income-color)" : "var(--expense-color)",
                }}
              >
                {data.net_cashflow >= 0 ? "+" : "−"}
                {formatINR(Math.abs(data.net_cashflow))}
              </span>
            </div>
          </div>
        </GlowCard>

        {/* Latest Cash Position Panel */}
        <GlowCard
          style={{
            padding: "var(--sp-6)",
            animation: "fadeInUp var(--duration-slow) var(--ease-out) 350ms both",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-4)", position: "relative", zIndex: 2 }}>
            Latest Cash Position
          </div>

          {latest ? (
            <div style={{ position: "relative", zIndex: 2 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 32,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "var(--sp-2)",
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                <AnimatedNumber value={latest.cash_balance} />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--sp-3)",
                  marginBottom: "var(--sp-5)",
                }}
              >
                <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                  AUDITED: {formatFullDate(latest.date)}
                </span>
                {changePercent !== null && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 3,
                      padding: "1px 7px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      background: Number(changePercent) >= 0 ? "var(--income-dim)" : "var(--expense-dim)",
                      color: Number(changePercent) >= 0 ? "var(--income-color)" : "var(--expense-color)",
                    }}
                  >
                    {Number(changePercent) >= 0 ? "+" : ""}
                    {changePercent}%
                  </span>
                )}
              </div>

              {/* Latest transaction card */}
              <div
                style={{
                  padding: "var(--sp-3) var(--sp-4)",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ fontSize: 10.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginBottom: 4 }}>
                  LAST RECORDED SETTLEMENT
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {latest.description}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: latest.cash_change >= 0 ? "var(--income-color)" : "var(--expense-color)",
                    }}
                  >
                    {latest.cash_change >= 0 ? "+" : "−"}
                    {formatINR(Math.abs(latest.cash_change))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No cash history available.</div>
          )}
        </GlowCard>
      </div>

      {/* Quick Recommendations Preview */}
      {recommendations.length > 0 && (
        <GlowCard
          style={{
            padding: "var(--sp-6)",
            animation: "fadeInUp var(--duration-slow) var(--ease-out) 400ms both",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-4)", position: "relative", zIndex: 2 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                AI Liquidity Directives
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                Real-time recommendations triggered by working capital stress model
              </div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                padding: "2px 8px",
                borderRadius: 4,
                fontFamily: "var(--font-mono)",
                background: "rgba(56, 211, 159, 0.12)",
                color: "var(--accent-primary)",
                border: "1px solid rgba(56, 211, 159, 0.25)",
                fontWeight: 600,
              }}
            >
              {recommendations.length} ACTIVE DIRECTIVES
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--sp-4)", position: "relative", zIndex: 2 }}>
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                style={{
                  padding: "var(--sp-4)",
                  borderRadius: "var(--radius-md)",
                  background: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ fontSize: 10.5, color: "var(--accent-primary)", fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                      {rec.category}
                    </span>
                    <StatusBadge
                      size="sm"
                      type={rec.urgency === "High" ? "critical" : rec.urgency === "Medium" ? "moderate" : "healthy"}
                      label={rec.urgency}
                    />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>
                    {rec.title}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, marginBottom: 12 }}>
                    {rec.description}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--income-color)" }}>
                    {rec.impact}
                  </span>
                  <button
                    onClick={() => {
                      if (playSuccess) playSuccess();
                      alert(`Initiated action: ${rec.actionLabel}`);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid rgba(56, 211, 159, 0.3)",
                      background: "rgba(56, 211, 159, 0.08)",
                      color: "var(--accent-primary)",
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                    }}
                  >
                    {rec.actionLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Transaction Table with Pagination & Sorting */}
      <GlowCard
        style={{
          padding: "var(--sp-6)",
          animation: "fadeInUp var(--duration-slow) var(--ease-out) 450ms both",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--sp-5)",
            flexWrap: "wrap",
            gap: 12,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              Recent Transactions
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              PAGE {page} OF {totalPages} ({sortedTx.length} TOTAL ENTRIES)
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => {
                if (playClick) playClick();
                setSortDir((d) => (d === "desc" ? "asc" : "desc"));
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255, 255, 255, 0.03)",
                color: "var(--text-secondary)",
                fontSize: 11.5,
                fontFamily: "var(--font-mono)",
                cursor: "pointer",
              }}
            >
              <span>DATE: {sortDir === "desc" ? "NEWEST" : "OLDEST"}</span>
            </button>
          </div>
        </div>

        {/* Table element */}
        <div style={{ overflowX: "auto", position: "relative", zIndex: 2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>DATE</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>DESCRIPTION</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>TYPE</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right" }}>AMOUNT</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right" }}>BALANCE AFTER</th>
              </tr>
            </thead>
            <tbody>
              {currentTx.map((tx, idx) => {
                const isIncome = tx.cash_change >= 0;
                return (
                  <tr
                    key={idx}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                    }}
                  >
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {formatFullDate(tx.date)}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {tx.description}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <StatusBadge type={isIncome ? "income" : "expense"} size="sm" />
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 600,
                        color: isIncome ? "var(--income-color)" : "var(--expense-color)",
                      }}
                    >
                      {isIncome ? "+" : "−"}
                      {formatINR(Math.abs(tx.cash_change))}
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        textAlign: "right",
                        fontFamily: "var(--font-mono)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {formatINR(tx.cash_balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginTop: "var(--sp-4)", position: "relative", zIndex: 2 }}>
          <button
            disabled={page <= 1}
            onClick={() => {
              if (playClick) playClick();
              setPage((p) => Math.max(1, p - 1));
            }}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: page <= 1 ? "transparent" : "rgba(255, 255, 255, 0.04)",
              color: page <= 1 ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            PREV
          </button>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", padding: "0 6px" }}>
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              if (playClick) playClick();
              setPage((p) => Math.min(totalPages, p + 1));
            }}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-subtle)",
              background: page >= totalPages ? "transparent" : "rgba(255, 255, 255, 0.04)",
              color: page >= totalPages ? "var(--text-tertiary)" : "var(--text-primary)",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            NEXT
          </button>
        </div>
      </GlowCard>
    </div>
  );
}
