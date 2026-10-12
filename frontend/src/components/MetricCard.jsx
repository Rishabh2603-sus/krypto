import { useState } from "react";
import AnimatedNumber from "./AnimatedNumber";
import GlowCard from "./GlowCard";

export default function MetricCard({
  label,
  value,
  formatter,
  icon,
  iconColor = "var(--accent-primary)",
  iconBg = "var(--accent-dim)",
  trend,
  trendLabel,
  riskContext, // "low" | "medium" | "high" | "healthy" | "critical"
  delay = 0,
  isLoading = false,
  subtitle,
}) {
  const [hovered, setHovered] = useState(false);

  if (isLoading) {
    return (
      <div
        className="glass-card"
        style={{
          flex: 1,
          minWidth: 220,
          padding: "var(--sp-5) var(--sp-6)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div className="skeleton" style={{ width: 80, height: 16 }} />
          <div className="skeleton" style={{ width: 34, height: 34, borderRadius: "var(--radius-md)" }} />
        </div>
        <div className="skeleton" style={{ width: 140, height: 32, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 100, height: 14 }} />
      </div>
    );
  }

  const isPositiveTrend = typeof trend === "number" ? trend >= 0 : false;

  // Refined micro-status dot
  let statusDotColor = null;
  if (riskContext === "low" || riskContext === "healthy" || riskContext === "positive") {
    statusDotColor = "var(--income-color)";
  } else if (riskContext === "medium" || riskContext === "warning" || riskContext === "moderate") {
    statusDotColor = "var(--warning-color)";
  } else if (riskContext === "high" || riskContext === "critical" || riskContext === "negative") {
    statusDotColor = "var(--expense-color)";
  }

  return (
    <GlowCard
      className="metric-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        minWidth: 220,
        padding: "var(--sp-5) var(--sp-6)",
        animation: `fadeInUp var(--duration-slow) var(--ease-out) ${delay}ms both`,
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "var(--sp-3)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-secondary)",
              fontWeight: 500,
              letterSpacing: "0.02em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {label}
            {statusDotColor && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  backgroundColor: statusDotColor,
                  boxShadow: `0 0 6px ${statusDotColor}`,
                  display: "inline-block",
                }}
              />
            )}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "var(--radius-md)",
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: iconColor,
            transition: "transform 220ms cubic-bezier(0.16, 1, 0.3, 1)",
            transform: hovered ? "scale(1.08)" : "scale(1)",
            flexShrink: 0,
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          fontSize: 26,
          fontWeight: 600,
          fontVariantNumeric: "tabular-nums",
          color: "var(--text-primary)",
          lineHeight: 1.15,
          marginBottom: "var(--sp-2)",
          fontFamily: "var(--font-mono)",
          letterSpacing: "-0.02em",
          position: "relative",
          zIndex: 2,
        }}
      >
        <AnimatedNumber value={value} formatter={formatter} />
      </div>

      {trend !== undefined && trend !== null && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11.5,
            fontWeight: 500,
            fontFamily: "var(--font-mono)",
            color: isPositiveTrend ? "var(--income-color)" : "var(--expense-color)",
            position: "relative",
            zIndex: 2,
          }}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isPositiveTrend ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 200ms ease",
            }}
          >
            <polyline points="18,15 12,9 6,15" />
          </svg>
          <span>{Math.abs(trend)}%</span>
          {trendLabel && (
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400, marginLeft: 2, fontFamily: "var(--font-sans)", fontSize: 11 }}>
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </GlowCard>
  );
}
