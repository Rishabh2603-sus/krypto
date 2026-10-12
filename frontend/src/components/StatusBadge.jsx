export default function StatusBadge({ type, label, size = "md" }) {
  const normalized = (type || "").toLowerCase().trim();

  let bg = "rgba(129, 140, 248, 0.12)";
  let color = "var(--accent-primary)";
  let dotColor = "var(--accent-primary)";
  let defaultLabel = label || "Active";

  if (normalized === "income" || normalized === "positive" || normalized === "low" || normalized === "healthy") {
    bg = "rgba(52, 211, 153, 0.12)";
    color = "var(--income-color)";
    dotColor = "#34d399";
    defaultLabel = label || (normalized === "income" ? "Income" : normalized === "low" ? "Low Risk" : "Healthy");
  } else if (normalized === "expense" || normalized === "negative" || normalized === "critical" || normalized === "high") {
    bg = "rgba(248, 113, 113, 0.12)";
    color = "var(--expense-color)";
    dotColor = "#f87171";
    defaultLabel = label || (normalized === "expense" ? "Expense" : normalized === "critical" ? "Critical" : "High Risk");
  } else if (normalized === "overdue" || normalized === "moderate" || normalized === "medium" || normalized === "warning") {
    bg = "rgba(251, 191, 36, 0.12)";
    color = "var(--warning-color)";
    dotColor = "#fbbf24";
    defaultLabel = label || (normalized === "overdue" ? "Overdue" : "Moderate");
  } else if (normalized === "current") {
    bg = "rgba(56, 189, 248, 0.12)";
    color = "#38bdf8";
    dotColor = "#38bdf8";
    defaultLabel = label || "Current";
  }

  const isSmall = size === "sm";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: isSmall ? 4 : 6,
        padding: isSmall ? "2px 8px" : "3px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: isSmall ? 10.5 : 11.5,
        fontWeight: 500,
        letterSpacing: "0.03em",
        background: bg,
        color: color,
        border: `1px solid ${color}33`,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: isSmall ? 5 : 6,
          height: isSmall ? 5 : 6,
          borderRadius: "50%",
          background: dotColor,
          boxShadow: `0 0 6px ${dotColor}99`,
        }}
      />
      {label || defaultLabel}
    </span>
  );
}
