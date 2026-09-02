import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { fetchCashflowSummary } from "./api";

const inr = (n) => {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(1)}L`;
    return `${sign}₹${abs.toLocaleString("en-IN")}`;
};

const riskTone = {
    LOW: { bg: "#EAF3DE", border: "#639922", text: "#173404" },
    MEDIUM: { bg: "#FAEEDA", border: "#BA7517", text: "#412402" },
    HIGH: { bg: "#FAECE7", border: "#D85A30", text: "#4A1B0C" },
    CRITICAL: { bg: "#FCEBEB", border: "#A32D2D", text: "#501313" },
};

const priorityTone = {
    HIGH: { bg: "#FCEBEB", text: "#791F1F" },
    MEDIUM: { bg: "#FAEEDA", text: "#633806" },
    LOW: { bg: "#F1EFE8", text: "#444441" },
};

function Sidebar() {
    const items = ["Dashboard", "Cash flow", "Receivables", "Payables", "Forecast", "Simulator"];
    return (
        <div style={{ width: 200, flexShrink: 0, borderRight: "1px solid #E4E1D6", padding: "24px 16px" }}>
            <div style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 20, letterSpacing: "0.02em", marginBottom: 32, color: "#1A1A17" }}>
                KRYPTO
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {items.map((item, i) => (
                    <div
                        key={item}
                        style={{
                            padding: "8px 10px",
                            fontSize: 13.5,
                            borderRadius: 6,
                            cursor: "pointer",
                            color: i === 0 ? "#1A1A17" : "#6B6A63",
                            background: i === 0 ? "#EFEDE4" : "transparent",
                            fontWeight: i === 0 ? 500 : 400,
                        }}
                    >
                        {item}
                    </div>
                ))}
            </nav>
        </div>
    );
}

function MetricCard({ label, value, sub, tone }) {
    return (
        <div style={{ flex: 1, padding: "18px 20px", background: "#FBFAF6", border: "1px solid #E4E1D6", borderRadius: 4 }}>
            <div style={{ fontSize: 12.5, color: "#8A887F", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontVariantNumeric: "tabular-nums", color: tone?.text || "#1A1A17", fontWeight: 500, lineHeight: 1 }}>
                {value}
            </div>
            {sub && <div style={{ fontSize: 12.5, color: tone?.text || "#8A887F", marginTop: 8 }}>{sub}</div>}
        </div>
    );
}

function RootCauseBar({ label, pct }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: "#4A4941" }}>{label}</span>
                <span style={{ color: "#1A1A17", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: "#EFEDE4", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: "#D85A30" }} />
            </div>
        </div>
    );
}

function RecommendationRow({ rec }) {
    const tone = priorityTone[rec.priority];
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #E4E1D6" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 500, padding: "3px 8px", borderRadius: 3, background: tone.bg, color: tone.text, letterSpacing: "0.03em" }}>
                    {rec.priority}
                </span>
                <div>
                    <div style={{ fontSize: 13.5, color: "#1A1A17" }}>{rec.action}</div>
                    <div style={{ fontSize: 12, color: "#8A887F", marginTop: 2 }}>{rec.reason}</div>
                </div>
            </div>
            <div style={{ fontSize: 13.5, fontVariantNumeric: "tabular-nums", color: "#173404", fontWeight: 500 }}>+{inr(rec.impact)}</div>
        </div>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchCashflowSummary().then(setData);
    }, []);

    if (!data) {
        return <div style={{ padding: 40, fontFamily: "sans-serif", color: "#8A887F" }}>Loading…</div>;
    }

    const tone = riskTone[data.risk_level] || riskTone.MEDIUM;

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "#F7F5EF", fontFamily: "'Inter', 'Helvetica Neue', sans-serif", color: "#1A1A17" }}>
            <Sidebar />
            <div style={{ flex: 1, padding: "24px 32px", maxWidth: 880 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
                    <div>
                        <div style={{ fontSize: 12.5, color: "#8A887F" }}>Cash flow intelligence</div>
                        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 400, margin: "2px 0 0" }}>{data.business_name}</h1>
                    </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                    <MetricCard label="Current cash" value={inr(data.current_cash)} />
                    <MetricCard
                        label="Risk score"
                        value={`${data.risk_score} / 100`}
                        sub={data.risk_level}
                        tone={tone}
                    />
                    <MetricCard
                        label="Expected shortfall"
                        value={inr(data.shortfall.amount)}
                        sub={`in ${data.shortfall.days_remaining} days`}
                        tone={riskTone.CRITICAL}
                    />
                </div>

                <div style={{ background: "#FBFAF6", border: "1px solid #E4E1D6", borderRadius: 4, padding: "20px 24px", marginBottom: 20 }}>
                    <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 12 }}>90-day forecast</div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data.forecast} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="2 4" stroke="#E4E1D6" vertical={false} />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={{ stroke: "#E4E1D6" }} tickLine={false} />
                            <YAxis tickFormatter={inr} tick={{ fontSize: 11, fill: "#8A887F" }} axisLine={false} tickLine={false} width={54} />
                            <ReferenceLine y={0} stroke="#D85A30" strokeDasharray="3 3" />
                            <Tooltip formatter={(v) => inr(v)} contentStyle={{ fontSize: 12, border: "1px solid #E4E1D6", borderRadius: 4 }} />
                            <Line type="monotone" dataKey="cash" stroke="#1A1A17" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", gap: 20 }}>
                    <div style={{ flex: 1, background: "#FBFAF6", border: "1px solid #E4E1D6", borderRadius: 4, padding: "20px 24px" }}>
                        <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 14 }}>Why is risk high?</div>
                        {data.root_causes.map((c) => (
                            <RootCauseBar key={c.label} {...c} />
                        ))}
                    </div>

                    <div style={{ flex: 1.3, background: "#FBFAF6", border: "1px solid #E4E1D6", borderRadius: 4, padding: "20px 24px" }}>
                        <div style={{ fontSize: 13, color: "#8A887F", marginBottom: 4 }}>What should I do?</div>
                        {data.recommendations.map((r, i) => (
                            <RecommendationRow key={i} rec={r} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}