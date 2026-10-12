import { useState, useEffect } from "react";
import MetricCard from "../components/MetricCard";
import GlowCard from "../components/GlowCard";
import StatusBadge from "../components/StatusBadge";
import { formatINR } from "../components/AnimatedNumber";
import { fetchReceivables, fetchPayables } from "../api";

export default function LedgerView({ playClick, playSuccess }) {
  const [activeTab, setActiveTab] = useState("receivables"); // "receivables" | "payables"
  const [receivables, setReceivables] = useState(null);
  const [payables, setPayables] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const [rec, pay] = await Promise.all([fetchReceivables(), fetchPayables()]);
        if (isMounted) {
          setReceivables(rec);
          setPayables(pay);
        }
      } catch (err) {
        console.error("LedgerView load error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTabChange = (tab) => {
    if (playClick) playClick();
    setActiveTab(tab);
  };

  if (isLoading || !receivables || !payables) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--sp-4)" }}>
          {[...Array(4)].map((_, i) => (
            <MetricCard key={i} isLoading={true} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const isRec = activeTab === "receivables";
  const currentData = isRec ? receivables : payables;
  const aging = currentData.aging || {};
  const invoices = currentData.invoices || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      {/* Top Ledger Tab Selector & DSO/DPO metric banner */}
      <GlowCard
        style={{
          padding: "var(--sp-4) var(--sp-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6, background: "rgba(255, 255, 255, 0.03)", padding: 3, borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)", position: "relative", zIndex: 2 }}>
          <button
            onClick={() => handleTabChange("receivables")}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: isRec ? "rgba(56, 211, 159, 0.12)" : "transparent",
              color: isRec ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            RECEIVABLES (AR)
          </button>
          <button
            onClick={() => handleTabChange("payables")}
            style={{
              padding: "7px 16px",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: !isRec ? "rgba(56, 211, 159, 0.12)" : "transparent",
              color: !isRec ? "var(--accent-primary)" : "var(--text-secondary)",
              fontWeight: 600,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
              transition: "all 150ms ease",
            }}
          >
            PAYABLES (AP)
          </button>
        </div>

        {/* DSO / DPO Benchmark Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            {isRec ? "DAYS SALES OUTSTANDING:" : "DAYS PAYABLE OUTSTANDING:"}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              padding: "3px 10px",
              borderRadius: 4,
              background: "rgba(56, 211, 159, 0.1)",
              border: "1px solid rgba(56, 211, 159, 0.25)",
              color: "var(--accent-primary)",
            }}
          >
            {isRec ? `${receivables.dso}d (Target: ${receivables.dso_benchmark}d)` : `${payables.dpo}d (Target: ${payables.dpo_benchmark}d)`}
          </span>
        </div>
      </GlowCard>

      {/* Aging Category Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--sp-4)",
        }}
      >
        <MetricCard
          label={isRec ? "Total Outstanding Invoices" : "Total Outstanding Bills"}
          value={currentData.total_outstanding}
          riskContext="medium"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          }
          iconColor="var(--accent-primary)"
          iconBg="var(--accent-dim)"
          subtitle={`${invoices.length} active entries`}
        />

        <MetricCard
          label="Current (0 – 30 Days)"
          value={aging.current_0_30}
          riskContext="low"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 14 14" />
            </svg>
          }
          iconColor="var(--income-color)"
          iconBg="var(--income-dim)"
          subtitle="Within agreed credit terms"
        />

        <MetricCard
          label="Overdue (31 – 60 Days)"
          value={aging.overdue_31_60}
          riskContext="medium"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
            </svg>
          }
          iconColor="var(--warning-color)"
          iconBg="rgba(251, 191, 36, 0.12)"
          subtitle="Follow-up recommended"
        />

        <MetricCard
          label="Critical (61+ Days)"
          value={aging.overdue_61_plus}
          riskContext="high"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          }
          iconColor="var(--expense-color)"
          iconBg="var(--expense-dim)"
          subtitle="High default / penalty risk"
        />
      </div>

      {/* Invoice Aging Ledger Table */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--sp-5)", flexWrap: "wrap", gap: 10, position: "relative", zIndex: 2 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
              {isRec ? "Receivables Aging Analysis" : "Payables Schedule & Aging"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              DETAILED COUNTERPARTY MATURITY & AGING LEDGER
            </div>
          </div>
        </div>

        <div style={{ overflowX: "auto", position: "relative", zIndex: 2 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", textAlign: "left" }}>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>INVOICE ID</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>COUNTERPARTY</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>DUE DATE</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>AGING STATUS</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11 }}>RISK</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right" }}>AMOUNT</th>
                <th style={{ padding: "8px 12px", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "center" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const isCritical = inv.days_overdue >= 50 || inv.status === "Critical";
                const isOverdue = inv.days_overdue > 0 && !isCritical;

                let rowBg = "transparent";
                if (isCritical) rowBg = "rgba(248, 113, 113, 0.04)";
                else if (isOverdue) rowBg = "rgba(251, 191, 36, 0.03)";

                return (
                  <tr
                    key={inv.id}
                    style={{
                      borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
                      background: rowBg,
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--accent-primary)" }}>
                      {inv.id}
                    </td>
                    <td style={{ padding: "10px 12px", fontWeight: 500, color: "var(--text-primary)" }}>
                      {inv.counterparty}
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
                      {inv.due_date}
                    </td>
                    <td style={{ padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 11.5, color: inv.days_overdue > 0 ? "var(--warning-color)" : "var(--text-tertiary)" }}>
                      {inv.days_overdue > 0 ? `+${inv.days_overdue}d overdue` : "Current"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <StatusBadge
                        type={inv.status}
                        size="sm"
                      />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                      {formatINR(inv.amount)}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          if (playSuccess) playSuccess();
                          alert(isRec ? `Payment reminder triggered for ${inv.counterparty}` : `Settlement batch queued for ${inv.counterparty}`);
                        }}
                        style={{
                          padding: "3px 10px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid rgba(56, 211, 159, 0.25)",
                          background: "rgba(56, 211, 159, 0.06)",
                          color: "var(--accent-primary)",
                          fontSize: 11,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 150ms ease",
                        }}
                      >
                        {isRec ? "REMIND" : "PAY"}
                      </button>
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
