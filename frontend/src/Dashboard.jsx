import { useEffect, useState, useCallback } from "react";
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
import { fetchCashflowSummary } from "./api";

/* ────────────────────────── Helpers ────────────────────────── */

const inr = (n) => {
    const abs = Math.abs(Number(n) || 0);
    const sign = Number(n) < 0 ? "−" : "";
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(1)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
    return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit" });

const formatFullDate = (date) =>
    new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });

/* ────────────────────────── Icons (inline SVG) ────────────── */

const Icons = {
    dashboard: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    ),
    cashflow: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
    ),
    receivables: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22V8M5 12l7-4 7 4" /><path d="M5 16l7 4 7-4" /><path d="M5 8l7-4 7 4" />
        </svg>
    ),
    payables: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
        </svg>
    ),
    forecast: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
        </svg>
    ),
    simulator: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    arrowUp: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18,15 12,9 6,15" />
        </svg>
    ),
    arrowDown: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6,9 12,15 18,9" />
        </svg>
    ),
    refresh: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23,4 23,10 17,10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
    ),
    bell: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    ),
    search: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
        </svg>
    ),
    wallet: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
        </svg>
    ),
    income: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5,12 12,5 19,12" />
        </svg>
    ),
    expense: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19,12 12,19 5,12" />
        </svg>
    ),
    net: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" />
        </svg>
    ),
};

const NAV_ITEMS = [
    { id: "dashboard", label: "Dashboard", icon: Icons.dashboard },
    { id: "cashflow", label: "Cash Flow", icon: Icons.cashflow },
    { id: "receivables", label: "Receivables", icon: Icons.receivables },
    { id: "payables", label: "Payables", icon: Icons.payables },
    { id: "forecast", label: "Forecast", icon: Icons.forecast },
    { id: "simulator", label: "Simulator", icon: Icons.simulator },
];

/* ────────────────────────── AnimatedNumber ─────────────────── */

function AnimatedNumber({ value, formatter = inr }) {
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        const target = Number(value) || 0;
        const duration = 800;
        const startTime = performance.now();
        const startVal = display;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(startVal + (target - startVal) * eased);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    // eslint-disable-next-line
    }, [value]);

    return <span>{formatter(display)}</span>;
}

/* ────────────────────────── StatusBadge ────────────────────── */

function StatusBadge({ type }) {
    const config = {
        income: { label: "Income", bg: "var(--income-dim)", color: "var(--income-color)" },
        expense: { label: "Expense", bg: "var(--expense-dim)", color: "var(--expense-color)" },
    };
    const c = config[type] || config.income;
    return (
        <span style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "var(--radius-full)",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.03em",
            background: c.bg,
            color: c.color,
            textTransform: "uppercase",
        }}>
            {c.label}
        </span>
    );
}

/* ────────────────────────── Skeleton Loader ────────────────── */

function SkeletonLoader() {
    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            minHeight: "100dvh",
            background: "var(--bg-base)",
        }}>
            <div className="ambient-bg" />
            {/* Sidebar skeleton */}
            <div style={{
                width: "var(--sidebar-width)",
                flexShrink: 0,
                background: "var(--bg-surface)",
                borderRight: "1px solid var(--border-subtle)",
                padding: "var(--sp-8) var(--sp-5)",
            }}>
                <div className="skeleton" style={{ width: 100, height: 28, marginBottom: 40 }} />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ width: "100%", height: 36, marginBottom: 8, borderRadius: "var(--radius-md)" }} />
                ))}
            </div>
            {/* Content skeleton */}
            <div style={{ flex: 1, padding: "var(--sp-8)" }}>
                <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 32 }} />
                <div style={{ display: "flex", gap: "var(--sp-4)", marginBottom: 24 }}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="skeleton" style={{ flex: 1, height: 120, borderRadius: "var(--radius-lg)" }} />
                    ))}
                </div>
                <div className="skeleton" style={{ width: "100%", height: 320, borderRadius: "var(--radius-lg)" }} />
            </div>
        </div>
    );
}

/* ────────────────────────── Sidebar ───────────────────────── */

function Sidebar({ activeView, onViewChange }) {
    return (
        <aside style={{
            width: "var(--sidebar-width)",
            flexShrink: 0,
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border-subtle)",
            padding: "var(--sp-6) var(--sp-4)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: 0,
            height: "100vh",
            height: "100dvh",
            zIndex: 10,
            overflow: "hidden auto",
            animation: "slideInLeft var(--duration-slow) var(--ease-out)",
        }}>
            {/* Logo */}
            <div style={{
                padding: "var(--sp-2) var(--sp-3)",
                marginBottom: "var(--sp-8)",
                display: "flex",
                alignItems: "center",
                gap: "var(--sp-3)",
            }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-md)",
                    background: "linear-gradient(135deg, var(--accent-primary), #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "var(--shadow-glow)",
                }}>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>K</span>
                </div>
                <span style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: 18,
                    letterSpacing: "0.06em",
                    color: "var(--text-primary)",
                }}>
                    KRYPTO
                </span>
            </div>

            {/* Navigation */}
            <nav style={{ display: "flex", flexDirection: "column", gap: "var(--sp-1)" }}>
                <div style={{
                    padding: "var(--sp-2) var(--sp-3)",
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-tertiary)",
                    marginBottom: "var(--sp-1)",
                }}>
                    Menu
                </div>
                {NAV_ITEMS.map((item) => {
                    const active = item.id === activeView;
                    return (
                        <button
                            key={item.id}
                            id={`nav-${item.id}`}
                            onClick={() => onViewChange(item.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "var(--sp-3)",
                                padding: "var(--sp-3) var(--sp-3)",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                border: "none",
                                background: active ? "var(--accent-dim)" : "transparent",
                                color: active ? "var(--accent-primary)" : "var(--text-secondary)",
                                fontSize: 13.5,
                                fontWeight: active ? 500 : 400,
                                fontFamily: "inherit",
                                transition: "all var(--duration-fast) var(--ease-out)",
                                textAlign: "left",
                                width: "100%",
                                position: "relative",
                                overflow: "hidden",
                            }}
                            onMouseEnter={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                                    e.currentTarget.style.color = "var(--text-primary)";
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!active) {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "var(--text-secondary)";
                                }
                            }}
                        >
                            {active && (
                                <div style={{
                                    position: "absolute",
                                    left: 0,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    width: 3,
                                    height: 18,
                                    borderRadius: "0 3px 3px 0",
                                    background: "var(--accent-primary)",
                                    boxShadow: "0 0 8px rgba(var(--accent-primary-rgb), 0.5)",
                                }} />
                            )}
                            <span style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.7 }}>
                                {item.icon}
                            </span>
                            {item.label}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom spacer + Version */}
            <div style={{ marginTop: "auto", padding: "var(--sp-4) var(--sp-3)" }}>
                <div style={{
                    padding: "var(--sp-4)",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(var(--accent-primary-rgb), 0.06)",
                    border: "1px solid rgba(var(--accent-primary-rgb), 0.1)",
                }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "var(--accent-primary)", marginBottom: 4 }}>
                        Pro Plan
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                        Advanced analytics & forecasting enabled
                    </div>
                </div>
            </div>
        </aside>
    );
}

/* ────────────────────────── Header ─────────────────────────── */

function Header({ onRefresh, isRefreshing }) {
    const [searchFocused, setSearchFocused] = useState(false);

    return (
        <header style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "var(--sp-8)",
            animation: "fadeIn var(--duration-slow) var(--ease-out)",
        }}>
            <div>
                <div style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--accent-primary)",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                }}>
                    Cash flow intelligence
                </div>
                <h1 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 26,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    letterSpacing: "-0.01em",
                    margin: 0,
                }}>
                    Dashboard Overview
                </h1>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
                {/* Search bar */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--sp-2)",
                    padding: "var(--sp-2) var(--sp-3)",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${searchFocused ? "var(--border-glow)" : "var(--border-subtle)"}`,
                    background: searchFocused ? "rgba(var(--accent-primary-rgb), 0.04)" : "var(--bg-card)",
                    transition: "all var(--duration-fast) var(--ease-out)",
                    width: searchFocused ? 260 : 200,
                }}>
                    <span style={{ color: "var(--text-tertiary)", display: "flex" }}>{Icons.search}</span>
                    <input
                        id="global-search"
                        type="text"
                        placeholder="Search…"
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        style={{
                            border: "none",
                            outline: "none",
                            background: "none",
                            color: "var(--text-primary)",
                            fontSize: 13,
                            fontFamily: "inherit",
                            width: "100%",
                        }}
                    />
                    <kbd style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-tertiary)",
                        fontFamily: "inherit",
                    }}>⌘K</kbd>
                </div>

                {/* Notification bell */}
                <button
                    id="btn-notifications"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-card)",
                        color: "var(--text-secondary)",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all var(--duration-fast) var(--ease-out)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-medium)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                    {Icons.bell}
                    <span style={{
                        position: "absolute",
                        top: 6,
                        right: 7,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--accent-primary)",
                        boxShadow: "0 0 6px rgba(var(--accent-primary-rgb), 0.6)",
                    }} />
                </button>

                {/* Refresh button */}
                <button
                    id="btn-refresh"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-card)",
                        color: "var(--text-secondary)",
                        cursor: isRefreshing ? "wait" : "pointer",
                        transition: "all var(--duration-fast) var(--ease-out)",
                    }}
                    onMouseEnter={(e) => { if (!isRefreshing) { e.currentTarget.style.borderColor = "var(--border-medium)"; e.currentTarget.style.color = "var(--text-primary)"; }}}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                    <span style={{
                        display: "flex",
                        animation: isRefreshing ? "spin 1s linear infinite" : "none",
                    }}>
                        {Icons.refresh}
                    </span>
                </button>

                {/* Avatar */}
                <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-full)",
                    background: "linear-gradient(135deg, #818cf8, #6366f1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 0 0 2px var(--bg-base), 0 0 0 3px rgba(var(--accent-primary-rgb), 0.3)",
                    transition: "box-shadow var(--duration-fast) var(--ease-out)",
                }}>
                    RS
                </div>
            </div>
        </header>
    );
}

/* ────────────────────────── MetricCard ─────────────────────── */

function MetricCard({ label, value, icon, iconColor, iconBg, trend, trendLabel, delay = 0 }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="glass-card"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                flex: 1,
                padding: "var(--sp-5) var(--sp-6)",
                transform: hovered ? "translateY(-2px)" : "translateY(0)",
                boxShadow: hovered ? "var(--shadow-lg)" : "var(--shadow-sm)",
                animation: `fadeInUp var(--duration-slow) var(--ease-out) ${delay}ms both`,
                cursor: "default",
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "var(--sp-4)",
            }}>
                <div style={{
                    fontSize: 12.5,
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                }}>
                    {label}
                </div>
                <div style={{
                    width: 34,
                    height: 34,
                    borderRadius: "var(--radius-md)",
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: iconColor,
                    transition: "transform var(--duration-fast) var(--ease-spring)",
                    transform: hovered ? "scale(1.1)" : "scale(1)",
                }}>
                    {icon}
                </div>
            </div>
            <div style={{
                fontSize: 30,
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
                color: "var(--text-primary)",
                lineHeight: 1.1,
                marginBottom: "var(--sp-2)",
                fontFamily: "var(--font-display)",
            }}>
                <AnimatedNumber value={value} />
            </div>
            {trend !== undefined && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 500,
                    color: trend >= 0 ? "var(--income-color)" : "var(--expense-color)",
                }}>
                    {trend >= 0 ? Icons.arrowUp : Icons.arrowDown}
                    <span>{Math.abs(trend)}%</span>
                    {trendLabel && <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>{trendLabel}</span>}
                </div>
            )}
        </div>
    );
}

/* ────────────────────────── Custom Tooltip ─────────────────── */

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-md)",
            padding: "var(--sp-3) var(--sp-4)",
            boxShadow: "var(--shadow-lg)",
            backdropFilter: "blur(12px)",
            animation: "fadeIn var(--duration-fast) var(--ease-out)",
        }}>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 6 }}>
                {formatFullDate(label)}
            </div>
            {payload.map((entry, i) => (
                <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                }}>
                    <span style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: entry.color || "var(--chart-line)",
                    }} />
                    {inr(entry.value)}
                </div>
            ))}
        </div>
    );
}

/* ────────────────────────── Charts Section ─────────────────── */

function ChartSection({ history }) {
    const [chartView, setChartView] = useState("area");

    const dailyChanges = history
        .filter((d) => d.cash_change !== 0)
        .map((d) => ({
            ...d,
            fill: d.cash_change >= 0 ? "var(--income-color)" : "var(--expense-color)",
        }));

    return (
        <div
            className="glass-card"
            style={{
                padding: "var(--sp-6)",
                marginBottom: "var(--sp-5)",
                animation: "fadeInUp var(--duration-slow) var(--ease-out) 250ms both",
            }}
        >
            {/* Chart header */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--sp-5)",
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>
                        Cash Balance History
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                        {history.length} data points · Aug 2026
                    </div>
                </div>
                <div style={{
                    display: "flex",
                    gap: 2,
                    padding: 3,
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border-subtle)",
                }}>
                    {["area", "bar"].map((view) => (
                        <button
                            key={view}
                            id={`btn-chart-${view}`}
                            onClick={() => setChartView(view)}
                            style={{
                                padding: "var(--sp-1) var(--sp-3)",
                                borderRadius: "var(--radius-sm)",
                                border: "none",
                                background: chartView === view ? "var(--accent-dim)" : "transparent",
                                color: chartView === view ? "var(--accent-primary)" : "var(--text-tertiary)",
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                transition: "all var(--duration-fast) var(--ease-out)",
                                textTransform: "capitalize",
                            }}
                        >
                            {view === "area" ? "Balance" : "Changes"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chart */}
            <ResponsiveContainer width="100%" height={300}>
                {chartView === "area" ? (
                    <AreaChart data={history} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                        <defs>
                            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.20} />
                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.01} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 6"
                            stroke="var(--chart-grid)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                            axisLine={{ stroke: "var(--border-subtle)" }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={inr}
                            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                        />
                        <ReferenceLine y={0} stroke="var(--expense-color)" strokeDasharray="3 3" strokeOpacity={0.5} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="cash_balance"
                            stroke="var(--accent-primary)"
                            strokeWidth={2.5}
                            fill="url(#balanceGradient)"
                            dot={{ r: 3, strokeWidth: 2, fill: "var(--bg-elevated)", stroke: "var(--accent-primary)" }}
                            activeDot={{
                                r: 6,
                                strokeWidth: 2,
                                fill: "var(--accent-primary)",
                                stroke: "var(--bg-elevated)",
                                style: { filter: "drop-shadow(0 0 6px rgba(129,140,248,0.5))" },
                            }}
                        />
                    </AreaChart>
                ) : (
                    <BarChart data={dailyChanges} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                        <CartesianGrid
                            strokeDasharray="3 6"
                            stroke="var(--chart-grid)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                            axisLine={{ stroke: "var(--border-subtle)" }}
                            tickLine={false}
                        />
                        <YAxis
                            tickFormatter={inr}
                            tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                            axisLine={false}
                            tickLine={false}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="var(--border-medium)" />
                        <Bar dataKey="cash_change" radius={[4, 4, 0, 0]} maxBarSize={28}>
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
    );
}

/* ────────────────────────── Summary Panel ──────────────────── */

function SummaryPanel({ data }) {
    const rows = [
        { label: "Opening balance", value: data.opening_balance, prefix: "" },
        { label: "Total income", value: data.total_income, prefix: "+", color: "var(--income-color)" },
        { label: "Total expenses", value: data.total_expense, prefix: "−", color: "var(--expense-color)" },
    ];
    return (
        <div
            className="glass-card"
            style={{
                flex: 1,
                padding: "var(--sp-6)",
                animation: "fadeInUp var(--duration-slow) var(--ease-out) 350ms both",
            }}
        >
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-5)" }}>
                Cash Flow Summary
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
                {rows.map((r) => (
                    <div
                        key={r.label}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: 13.5,
                        }}
                    >
                        <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                        <span style={{
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 500,
                            color: r.color || "var(--text-primary)",
                        }}>
                            {r.prefix}{inr(r.value)}
                        </span>
                    </div>
                ))}
                {/* Divider */}
                <div style={{
                    height: 1,
                    background: "var(--border-subtle)",
                }} />
                {/* Net */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 14,
                }}>
                    <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Net cash flow</span>
                    <span style={{
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 600,
                        fontSize: 16,
                        color: data.net_cashflow >= 0 ? "var(--income-color)" : "var(--expense-color)",
                    }}>
                        {data.net_cashflow >= 0 ? "+" : "−"}{inr(Math.abs(data.net_cashflow))}
                    </span>
                </div>
            </div>
        </div>
    );
}

/* ────────────────────────── Position Panel ─────────────────── */

function PositionPanel({ history, data }) {
    const latest = history.length > 0 ? history[history.length - 1] : null;
    const prevBalance = history.length > 1 ? history[history.length - 2].cash_balance : null;
    const changePercent = prevBalance ? (((latest.cash_balance - prevBalance) / prevBalance) * 100).toFixed(1) : null;

    return (
        <div
            className="glass-card"
            style={{
                flex: 1.3,
                padding: "var(--sp-6)",
                animation: "fadeInUp var(--duration-slow) var(--ease-out) 400ms both",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Subtle glow accent in corner */}
            <div style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(var(--accent-primary-rgb), 0.1) 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--sp-5)", position: "relative" }}>
                Latest Cash Position
            </div>
            {latest ? (
                <div style={{ position: "relative" }}>
                    <div style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 38,
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: "var(--sp-2)",
                        lineHeight: 1.1,
                    }}>
                        <AnimatedNumber value={latest.cash_balance} />
                    </div>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--sp-3)",
                        marginBottom: "var(--sp-5)",
                    }}>
                        <span style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>
                            as of {formatFullDate(latest.date)}
                        </span>
                        {changePercent !== null && (
                            <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 3,
                                padding: "2px 8px",
                                borderRadius: "var(--radius-full)",
                                fontSize: 11,
                                fontWeight: 500,
                                background: Number(changePercent) >= 0 ? "var(--income-dim)" : "var(--expense-dim)",
                                color: Number(changePercent) >= 0 ? "var(--income-color)" : "var(--expense-color)",
                            }}>
                                {Number(changePercent) >= 0 ? Icons.arrowUp : Icons.arrowDown}
                                {Math.abs(Number(changePercent))}%
                            </span>
                        )}
                    </div>
                    {/* Latest transaction */}
                    <div style={{
                        padding: "var(--sp-3) var(--sp-4)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border-subtle)",
                    }}>
                        <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 4 }}>
                            Latest transaction
                        </div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                                {latest.description}
                            </span>
                            <span style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: latest.cash_change >= 0 ? "var(--income-color)" : "var(--expense-color)",
                            }}>
                                {latest.cash_change >= 0 ? "+" : "−"}{inr(Math.abs(latest.cash_change))}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>No cash-flow history available.</div>
            )}
        </div>
    );
}

/* ────────────────────── Transaction Table ──────────────────── */

function TransactionTable({ history }) {
    const [sortDir, setSortDir] = useState("desc");
    const sorted = [...history]
        .filter((d) => d.cash_change !== 0)
        .sort((a, b) => sortDir === "desc"
            ? new Date(b.date) - new Date(a.date)
            : new Date(a.date) - new Date(b.date)
        );

    return (
        <div
            className="glass-card"
            style={{
                padding: "var(--sp-6)",
                marginTop: "var(--sp-5)",
                animation: "fadeInUp var(--duration-slow) var(--ease-out) 450ms both",
            }}
        >
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--sp-5)",
            }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
                    Recent Transactions
                </div>
                <button
                    id="btn-sort-transactions"
                    onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "var(--sp-1) var(--sp-3)",
                        borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--bg-elevated)",
                        color: "var(--text-secondary)",
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all var(--duration-fast) var(--ease-out)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-medium)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-subtle)"; }}
                >
                    {sortDir === "desc" ? "Newest first" : "Oldest first"}
                    {sortDir === "desc" ? Icons.arrowDown : Icons.arrowUp}
                </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: 13,
                }}>
                    <thead>
                        <tr style={{
                            borderBottom: "1px solid var(--border-subtle)",
                        }}>
                            {["Date", "Description", "Type", "Amount", "Balance"].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        textAlign: h === "Amount" || h === "Balance" ? "right" : "left",
                                        padding: "var(--sp-3) var(--sp-3)",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "var(--text-tertiary)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.map((row, i) => (
                            <tr
                                key={`${row.date}-${i}`}
                                style={{
                                    borderBottom: "1px solid var(--border-subtle)",
                                    transition: "background var(--duration-fast) var(--ease-out)",
                                    cursor: "default",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                                <td style={{ padding: "var(--sp-3)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                    {formatFullDate(row.date)}
                                </td>
                                <td style={{ padding: "var(--sp-3)", fontWeight: 500, color: "var(--text-primary)" }}>
                                    {row.description}
                                </td>
                                <td style={{ padding: "var(--sp-3)" }}>
                                    <StatusBadge type={row.cash_change >= 0 ? "income" : "expense"} />
                                </td>
                                <td style={{
                                    padding: "var(--sp-3)",
                                    textAlign: "right",
                                    fontVariantNumeric: "tabular-nums",
                                    fontWeight: 500,
                                    color: row.cash_change >= 0 ? "var(--income-color)" : "var(--expense-color)",
                                }}>
                                    {row.cash_change >= 0 ? "+" : "−"}{inr(Math.abs(row.cash_change))}
                                </td>
                                <td style={{
                                    padding: "var(--sp-3)",
                                    textAlign: "right",
                                    fontVariantNumeric: "tabular-nums",
                                    fontWeight: 500,
                                    color: "var(--text-primary)",
                                }}>
                                    {inr(row.cash_balance)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ────────────────────────── Main Dashboard ─────────────────── */

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState("dashboard");
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadData = useCallback(() => {
        setIsRefreshing(true);
        fetchCashflowSummary()
            .then((d) => {
                setData(d);
                setError(null);
            })
            .catch((err) => {
                console.error(err);
                setError("Unable to load cash-flow data.");
            })
            .finally(() => setIsRefreshing(false));
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    /* Loading state */
    if (!data && !error) return <SkeletonLoader />;

    /* Error state */
    if (error) {
        return (
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                background: "var(--bg-base)",
                fontFamily: "var(--font-sans)",
            }}>
                <div className="ambient-bg" />
                <div className="glass-card" style={{
                    padding: "var(--sp-10)",
                    textAlign: "center",
                    maxWidth: 400,
                }}>
                    <div style={{
                        width: 56,
                        height: 56,
                        borderRadius: "var(--radius-lg)",
                        background: "var(--expense-dim)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto var(--sp-5)",
                        fontSize: 24,
                    }}>
                        ⚠
                    </div>
                    <div style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: "var(--sp-2)",
                    }}>
                        Connection Error
                    </div>
                    <div style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        marginBottom: "var(--sp-6)",
                    }}>
                        {error}
                    </div>
                    <button
                        id="btn-retry"
                        onClick={loadData}
                        style={{
                            padding: "var(--sp-3) var(--sp-6)",
                            borderRadius: "var(--radius-md)",
                            border: "none",
                            background: "var(--accent-primary)",
                            color: "#fff",
                            fontSize: 13,
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all var(--duration-fast) var(--ease-out)",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-hover)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--accent-primary)"; }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const history = data.cash_balance_history || [];

    return (
        <div style={{
            display: "flex",
            minHeight: "100vh",
            minHeight: "100dvh",
            background: "var(--bg-base)",
        }}>
            {/* Ambient background glow */}
            <div className="ambient-bg" />

            {/* Sidebar */}
            <Sidebar activeView={activeView} onViewChange={setActiveView} />

            {/* Main Content */}
            <main style={{
                flex: 1,
                padding: "var(--sp-8) var(--sp-8) var(--sp-16)",
                maxWidth: 1200,
                overflowY: "auto",
            }}>
                <Header onRefresh={loadData} isRefreshing={isRefreshing} />

                {/* Metric Cards */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "var(--sp-4)",
                    marginBottom: "var(--sp-6)",
                }}>
                    <MetricCard
                        label="Current Cash"
                        value={data.current_cash}
                        icon={Icons.wallet}
                        iconColor="var(--accent-primary)"
                        iconBg="var(--accent-dim)"
                        delay={0}
                    />
                    <MetricCard
                        label="Total Income"
                        value={data.total_income}
                        icon={Icons.income}
                        iconColor="var(--income-color)"
                        iconBg="var(--income-dim)"
                        trend={12.4}
                        trendLabel="vs last month"
                        delay={60}
                    />
                    <MetricCard
                        label="Total Expenses"
                        value={data.total_expense}
                        icon={Icons.expense}
                        iconColor="var(--expense-color)"
                        iconBg="var(--expense-dim)"
                        trend={-3.2}
                        trendLabel="vs last month"
                        delay={120}
                    />
                    <MetricCard
                        label="Net Cash Flow"
                        value={data.net_cashflow}
                        icon={Icons.net}
                        iconColor="var(--income-color)"
                        iconBg="var(--income-dim)"
                        delay={180}
                    />
                </div>

                {/* Chart */}
                <ChartSection history={history} />

                {/* Bottom panels */}
                <div style={{
                    display: "flex",
                    gap: "var(--sp-5)",
                }}>
                    <SummaryPanel data={data} />
                    <PositionPanel history={history} data={data} />
                </div>

                {/* Transaction Table */}
                <TransactionTable history={history} />
            </main>

            {/* Spin keyframe for refresh */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}