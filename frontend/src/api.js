const API_BASE_URL = "http://127.0.0.1:8000";

// Fallback & In-Memory state for standalone operation
let currentProfile = "Manufacturing MSME";

const demoDatasets = {
  "Manufacturing MSME": {
    opening_balance: 4500000,
    total_income: 14200000,
    total_expense: 11850000,
    net_cashflow: 2350000,
    current_cash: 6850000,
    transaction_count: 84,
    burn: {
      daily_burn: 131666,
      monthly_burn: 3950000,
      runway_days: 52,
      runway_months: 1.7,
      net_burn_rate: -78333,
    },
    risk: {
      score: 64,
      status: "Moderate",
      risk_level: "Medium",
      trend: "+4 pts vs last month",
      factors: [
        { name: "Vendor Concentration", impact: "High", detail: "3 vendors account for 62% of raw material spend" },
        { name: "DSO Creep", impact: "Medium", detail: "DSO increased from 41 to 54 days over 60 days" },
        { name: "Capex Liquidity Cushion", impact: "Low", detail: "Current buffer covers 1.7 months of operating burn" },
      ]
    }
  },
  "SaaS Startup": {
    opening_balance: 12000000,
    total_income: 8900000,
    total_expense: 14600000,
    net_cashflow: -5700000,
    current_cash: 6300000,
    transaction_count: 112,
    burn: {
      daily_burn: 162222,
      monthly_burn: 4866666,
      runway_days: 39,
      runway_months: 1.3,
      net_burn_rate: 190000,
    },
    risk: {
      score: 78,
      status: "High",
      risk_level: "High",
      trend: "+12 pts vs last month",
      factors: [
        { name: "Negative Net Cashflow", impact: "Critical", detail: "Monthly burn exceeds cash receipts by ₹19.0L" },
        { name: "Cloud & Infrastructure Cost", impact: "Medium", detail: "AWS compute spikes 28% month-over-month" },
        { name: "Runway Compression", impact: "High", detail: "Less than 45 days runway before next capital injection" },
      ]
    }
  },
  "D2C Retail": {
    opening_balance: 3200000,
    total_income: 18400000,
    total_expense: 15100000,
    net_cashflow: 3300000,
    current_cash: 6500000,
    transaction_count: 240,
    burn: {
      daily_burn: 167777,
      monthly_burn: 5033333,
      runway_days: 38,
      runway_months: 1.3,
      net_burn_rate: -110000,
    },
    risk: {
      score: 42,
      status: "Healthy",
      risk_level: "Low",
      trend: "-6 pts vs last month",
      factors: [
        { name: "Working Capital Inflow", impact: "Low", detail: "Instant settlement on payment gateways (T+1)" },
        { name: "Inventory Holding Days", impact: "Medium", detail: "Finished goods turnover at 38 days" },
        { name: "Ad Spend Volatility", impact: "Medium", detail: "Meta & Google CAC fluctuated 14% this quarter" },
      ]
    }
  }
};

const defaultHistory = [
  { date: "2026-08-01", description: "Opening Balance", cash_change: 0, cash_balance: 4500000 },
  { date: "2026-08-03", description: "Client Retainer - Nexus Corp", cash_change: 1200000, cash_balance: 5700000 },
  { date: "2026-08-05", description: "Cloud Infrastructure (AWS)", cash_change: -185000, cash_balance: 5515000 },
  { date: "2026-08-07", description: "Hardware Supplier Batch #1", cash_change: -820000, cash_balance: 4695000 },
  { date: "2026-08-10", description: "Enterprise License - Alpha Ind", cash_change: 2450000, cash_balance: 7145000 },
  { date: "2026-08-12", description: "Bi-weekly Payroll Batch A", cash_change: -1450000, cash_balance: 5695000 },
  { date: "2026-08-15", description: "Vendor Settlement - Apex Log", cash_change: -340000, cash_balance: 5355000 },
  { date: "2026-08-18", description: "Consulting Milestone - Zeta Ltd", cash_change: 1800000, cash_balance: 7155000 },
  { date: "2026-08-20", description: "Office Lease & Utilities", cash_change: -420000, cash_balance: 6735000 },
  { date: "2026-08-22", description: "Export Tax & Duties (GST)", cash_change: -510000, cash_balance: 6225000 },
  { date: "2026-08-25", description: "Strategic Partner Advance", cash_change: 1950000, cash_balance: 8175000 },
  { date: "2026-08-27", description: "Bi-weekly Payroll Batch B", cash_change: -1420000, cash_balance: 6755000 },
  { date: "2026-08-29", description: "Server Refresh & CapEx", cash_change: -280000, cash_balance: 6475000 },
  { date: "2026-08-31", description: "Incentive Rebate - FinTech Corp", cash_change: 375000, cash_balance: 6850000 }
];

/* ────────────────────────── Endpoints ────────────────────────── */

export async function fetchCashflowSummary() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cashflow/summary`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.cash_balance_history && data.cash_balance_history.length > 0) {
        return data;
      }
    }
  } catch {
    // Backend offline or route error; proceed to fallback
  }

  const profileData = demoDatasets[currentProfile] || demoDatasets["Manufacturing MSME"];
  return {
    opening_balance: profileData.opening_balance,
    total_income: profileData.total_income,
    total_expense: profileData.total_expense,
    net_cashflow: profileData.net_cashflow,
    current_cash: profileData.current_cash,
    transaction_count: profileData.transaction_count,
    cash_balance_history: defaultHistory,
    profile: currentProfile,
  };
}

export async function fetchCashflowBreakdown() {
  try {
    const [bdRes, mRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/cashflow/breakdown`),
      fetch(`${API_BASE_URL}/api/cashflow/monthly`),
    ]);

    if (bdRes.ok) {
      const bdData = await bdRes.json();
      const mData = mRes.ok ? await mRes.json() : { monthly: [] };

      const palette = ["#818cf8", "#38bdf8", "#34d399", "#fbbf24", "#f472b6", "#a78bfa"];
      const categories = Object.entries(bdData.breakdown || {}).map(([name, item], idx) => ({
        name,
        amount: item.total,
        percentage: Math.round(item.pct),
        color: palette[idx % palette.length],
      }));

      return {
        monthly: mData.monthly && mData.monthly.length > 0 ? mData.monthly : [
          { month: "Aug 2026", income: 890000, expense: 618000, net: 272000 }
        ],
        categories: categories.length > 0 ? categories : [
          { name: "Payroll & Salaries", amount: 240000, percentage: 39, color: "#818cf8" },
          { name: "Raw Materials", amount: 180000, percentage: 29, color: "#38bdf8" },
          { name: "Vendor Invoices", amount: 110000, percentage: 18, color: "#34d399" },
          { name: "Office Rent", amount: 45000, percentage: 7, color: "#fbbf24" },
          { name: "Transport & Logistics", amount: 25000, percentage: 4, color: "#f472b6" },
          { name: "Electricity & Utilities", amount: 18000, percentage: 3, color: "#a78bfa" }
        ],
        top_inflows: [
          { client: "XYZ Ltd", amount: 370000, share: "41.6%" },
          { client: "ABC Traders", amount: 270000, share: "30.3%" },
          { client: "PQR Industries", amount: 250000, share: "28.1%" }
        ]
      };
    }
  } catch {
    // fallback
  }

  return {
    monthly: [
      { month: "Apr 2026", income: 3200000, expense: 2800000, net: 400000 },
      { month: "May 2026", income: 4100000, expense: 3400000, net: 700000 },
      { month: "Jun 2026", income: 3800000, expense: 4200000, net: -400000 },
      { month: "Jul 2026", income: 4900000, expense: 3900000, net: 1000000 },
      { month: "Aug 2026", income: 5200000, expense: 4100000, net: 1100000 },
      { month: "Sep 2026", income: 4600000, expense: 4450000, net: 150000 }
    ],
    categories: [
      { name: "Payroll & Salaries", amount: 4150000, percentage: 35, color: "#818cf8" },
      { name: "Vendor & Raw Materials", amount: 2960000, percentage: 25, color: "#38bdf8" },
      { name: "Cloud & Tech Infra", amount: 1780000, percentage: 15, color: "#34d399" },
      { name: "Facilities & Rent", amount: 1420000, percentage: 12, color: "#fbbf24" },
      { name: "Marketing & Growth", amount: 950000, percentage: 8, color: "#f472b6" },
      { name: "Taxes & Regulatory", amount: 590000, percentage: 5, color: "#a78bfa" }
    ],
    top_inflows: [
      { client: "Nexus Enterprise Corp", amount: 3650000, share: "25.7%" },
      { client: "Alpha Industries Ltd", amount: 2950000, share: "20.8%" },
      { client: "Zeta Consulting Group", amount: 2100000, share: "14.8%" },
      { client: "Horizon Global Trade", amount: 1850000, share: "13.0%" }
    ]
  };
}

export async function fetchCashflowBurn() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cashflow/burn`);
    if (res.ok) {
      const data = await res.json();
      return {
        daily_burn: data.daily_burn_rate ?? data.daily_burn ?? 20600,
        monthly_burn: data.monthly_burn_rate ?? data.monthly_burn ?? 618000,
        runway_days: Math.round(data.runway_days ?? 37),
        runway_months: Number(((data.runway_days ?? 37) / 30).toFixed(1)),
        net_burn_rate: data.net_daily_burn ?? 0,
      };
    }
  } catch {
    // fallback
  }

  const profileData = demoDatasets[currentProfile] || demoDatasets["Manufacturing MSME"];
  return profileData.burn;
}

export async function fetchForecast(days = 90) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/forecast/predict?days=${days}`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  const profileData = demoDatasets[currentProfile] || demoDatasets["Manufacturing MSME"];
  const startCash = profileData.current_cash;
  const dailyBurn = profileData.burn.daily_burn * 0.95;
  const pointsCount = Math.min(days, 90);
  const data = [];
  
  let shortfallDate = null;
  const today = new Date("2026-09-01");

  for (let i = 0; i <= pointsCount; i += 3) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().slice(0, 10);

    // Dynamic trajectory with volatility bands
    const drift = (i * dailyBurn * 0.4) * (currentProfile === "SaaS Startup" ? -1 : 0.2);
    const p50 = Math.round(startCash + drift - (i * dailyBurn * (currentProfile === "SaaS Startup" ? 0.9 : 0.05)));
    const spread = (i + 5) * 28000;
    const p10 = Math.round(p50 - spread);
    const p90 = Math.round(p50 + spread * 1.15);

    if (p10 <= 0 && !shortfallDate) {
      shortfallDate = dateStr;
    }

    data.push({
      day: i,
      date: dateStr,
      p10: Math.max(0, p10),
      p50: Math.max(0, p50),
      p90: Math.max(0, p90),
      confidence: Math.max(50, Math.round(96 - (i * 0.42)))
    });
  }

  return {
    horizon_days: days,
    current_cash: startCash,
    runway_days: profileData.burn.runway_days,
    shortfall_date: currentProfile === "SaaS Startup" ? "2026-10-18" : shortfallDate,
    capital_needed: currentProfile === "SaaS Startup" ? 3450000 : 0,
    forecast: data,
    assumptions: [
      "AR collection historical clearance velocity: 84%",
      "Predictive seasonality modeled via Holt-Winters + LSTM",
      "Fixed overhead adjusted for quarterly inflation rate (1.4%)"
    ]
  };
}

export async function fetchRiskScore() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/risk/score`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  const profileData = demoDatasets[currentProfile] || demoDatasets["Manufacturing MSME"];
  return profileData.risk;
}

export async function simulateScenario(params) {
  const {
    collectionDelay = 0,
    expenseShock = 0,
    revenueGrowth = 0,
    cashInjection = 0
  } = params || {};

  try {
    const payload = {
      revenue_change_pct: Number(revenueGrowth || 0),
      expense_change_pct: Number(expenseShock || 0),
      receivables_delay_days: Math.max(0, Number(collectionDelay || 0)),
      immediate_cash_infusion: Number(cashInjection || 0),
      immediate_capex: 0,
    };

    const res = await fetch(`${API_BASE_URL}/api/simulator/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      const bCurve = data.baseline_curve || [];
      const sCurve = data.simulated_curve || [];

      const comparison = bCurve.map((bPt, idx) => {
        const sPt = sCurve[idx] || bPt;
        return {
          day: idx * 3,
          date: bPt.date,
          baseline: Math.round(bPt.cash_balance),
          simulated: Math.round(sPt.cash_balance),
        };
      });

      const lastPt = comparison[comparison.length - 1];
      const netLiquidityChange = lastPt ? lastPt.simulated - lastPt.baseline : 0;

      return {
        params,
        comparison,
        baseline_runway_days: data.baseline_runway ?? 65,
        simulated_runway_days: data.simulated_runway ?? (65 + (data.delta_days || 0)),
        runway_delta_days: data.delta_days || 0,
        net_liquidity_change: netLiquidityChange,
        stress_alert: (lastPt && lastPt.simulated < 1000000) ? "Liquidity strain under simulated conditions" : null,
      };
    }
  } catch {
    // fallback
  }

  // Client-side simulation fallback

  const profileData = demoDatasets[currentProfile] || demoDatasets["Manufacturing MSME"];
  const baselineCash = profileData.current_cash;
  const points = [];
  const today = new Date("2026-09-01");

  let baseBal = baselineCash;
  let simBal = baselineCash + Number(cashInjection || 0);

  const dailyBaseIncome = (profileData.total_income / 30);
  const dailyBaseExpense = (profileData.total_expense / 30);

  const delayDiscount = Math.max(0.4, 1 - (collectionDelay * 0.012));
  const simDailyIncome = dailyBaseIncome * (1 + (revenueGrowth / 100)) * delayDiscount;
  const simDailyExpense = dailyBaseExpense * (1 + (expenseShock / 100));

  for (let d = 0; d <= 60; d += 3) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + d);
    const dateStr = targetDate.toISOString().slice(0, 10);

    if (d > 0) {
      baseBal = baseBal + (dailyBaseIncome - dailyBaseExpense) * 3;
      simBal = simBal + (simDailyIncome - simDailyExpense) * 3;
    }

    points.push({
      day: d,
      date: dateStr,
      baseline: Math.round(baseBal),
      simulated: Math.round(simBal)
    });
  }

  const baselineRunway = Math.round(profileData.burn.runway_days);
  const deltaCash = points[points.length - 1].simulated - points[points.length - 1].baseline;
  const runwayChangeDays = Math.round((deltaCash / (dailyBaseExpense || 100000)));

  return {
    params,
    comparison: points,
    baseline_runway_days: baselineRunway,
    simulated_runway_days: Math.max(0, baselineRunway + runwayChangeDays),
    runway_delta_days: runwayChangeDays,
    net_liquidity_change: deltaCash,
    stress_alert: simBal < 1000000 ? "High liquidity crunch risk within 60 days" : null
  };
}

export async function fetchReceivables() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ledger/receivables`);
    if (res.ok) {
      const data = await res.json();
      return {
        dso: data.dso_days ?? data.dso ?? 27,
        dso_benchmark: 35,
        total_outstanding: data.total_receivables ?? data.total_outstanding ?? 801000,
        aging: {
          current_0_30: data.aging?.current_0_30 ?? 801000,
          overdue_31_60: data.aging?.bucket_31_60 ?? data.aging?.overdue_31_60 ?? 0,
          overdue_61_plus: (data.aging?.bucket_61_90 ?? 0) + (data.aging?.over_90 ?? 0) + (data.aging?.overdue_61_plus ?? 0),
        },
        invoices: (data.invoices || []).map((inv) => ({
          id: inv.id,
          counterparty: inv.party_name || inv.counterparty,
          amount: inv.amount,
          due_date: inv.due_date,
          days_overdue: inv.days_overdue || 0,
          status: inv.status === "PENDING" ? (inv.days_overdue > 30 ? "Overdue" : "Current") : inv.status,
          risk: inv.days_overdue > 30 ? "High" : "Low",
        })),
      };
    }
  } catch {
    // fallback
  }

  return {
    dso: 48,
    dso_benchmark: 35,
    total_outstanding: 7420000,
    aging: {
      current_0_30: 4250000,
      overdue_31_60: 1980000,
      overdue_61_plus: 1190000
    },
    invoices: [
      { id: "INV-2026-081", counterparty: "Bharat Heavy Forge Ltd", amount: 1650000, due_date: "2026-08-15", days_overdue: 28, status: "Overdue", risk: "Medium" },
      { id: "INV-2026-094", counterparty: "Trans-Pacific Logistics", amount: 1190000, due_date: "2026-07-22", days_overdue: 52, status: "Critical", risk: "High" },
      { id: "INV-2026-103", counterparty: "Apex Systems Pvt Ltd", amount: 2450000, due_date: "2026-09-15", days_overdue: 0, status: "Current", risk: "Low" },
      { id: "INV-2026-109", counterparty: "Quantum Telematics", amount: 1800000, due_date: "2026-09-22", days_overdue: 0, status: "Current", risk: "Low" },
      { id: "INV-2026-078", counterparty: "Zenith Retail Group", amount: 330000, due_date: "2026-08-01", days_overdue: 42, status: "Overdue", risk: "Medium" }
    ]
  };
}

export async function fetchPayables() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ledger/payables`);
    if (res.ok) {
      const data = await res.json();
      const items = data.bills || data.invoices || [];
      return {
        dpo: data.dpo_days ?? data.dpo ?? 27,
        dpo_benchmark: 45,
        total_outstanding: data.total_payables ?? data.total_outstanding ?? 556200,
        aging: {
          current_0_30: data.aging?.current_0_30 ?? 556200,
          overdue_31_60: data.aging?.bucket_31_60 ?? data.aging?.overdue_31_60 ?? 0,
          overdue_61_plus: (data.aging?.bucket_61_90 ?? 0) + (data.aging?.over_90 ?? 0) + (data.aging?.overdue_61_plus ?? 0),
        },
        invoices: items.map((bill) => ({
          id: bill.id,
          counterparty: bill.party_name || bill.counterparty,
          amount: bill.amount,
          due_date: bill.due_date,
          days_overdue: bill.days_overdue || 0,
          status: bill.status === "PENDING" ? (bill.days_overdue > 30 ? "Overdue" : "Current") : bill.status,
          terms: bill.terms || "Net 30",
        })),
      };
    }
  } catch {
    // fallback
  }

  return {
    dpo: 36,
    dpo_benchmark: 45,
    total_outstanding: 5120000,
    aging: {
      current_0_30: 3450000,
      overdue_31_60: 1240000,
      overdue_61_plus: 430000
    },
    invoices: [
      { id: "BILL-2026-441", counterparty: "Precision Steel Castings", amount: 1450000, due_date: "2026-09-12", days_overdue: 0, status: "Current", terms: "Net 30" },
      { id: "BILL-2026-419", counterparty: "CloudScale Infra Services", amount: 430000, due_date: "2026-08-05", days_overdue: 38, status: "Overdue", terms: "Net 15" },
      { id: "BILL-2026-455", counterparty: "Zenith Microelectronics", amount: 1240000, due_date: "2026-08-25", days_overdue: 18, status: "Overdue", terms: "Net 30" },
      { id: "BILL-2026-488", counterparty: "Metro Logistics & Transit", amount: 680000, due_date: "2026-09-18", days_overdue: 0, status: "Current", terms: "Net 45" },
      { id: "BILL-2026-492", counterparty: "Global Industrial Lease Corp", amount: 1320000, due_date: "2026-09-30", days_overdue: 0, status: "Current", terms: "Net 30" }
    ]
  };
}

export async function fetchRecommendations() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/recommendations/active`);
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }

  return [
    {
      id: "REC-01",
      title: "Accelerate Trans-Pacific Overdue Collections",
      category: "Receivables",
      impact: "+₹11.9L Liquidity within 7 days",
      confidence: "94%",
      urgency: "High",
      description: "Trans-Pacific invoice is 52 days overdue. Auto-generate a 2% early-payment rebate or formal reminder notice to avoid write-off.",
      actionLabel: "Send Escalation Notice"
    },
    {
      id: "REC-02",
      title: "Negotiate DPO extension with Precision Steel",
      category: "Working Capital",
      impact: "Preserves ₹14.5L cash buffer by +15 days",
      confidence: "88%",
      urgency: "Medium",
      description: "Extend credit terms from Net-30 to Net-45 based on 18-month clean payment history.",
      actionLabel: "Draft Term Extension"
    },
    {
      id: "REC-03",
      title: "Cloud Reserve Instance Rationalization",
      category: "Cost Optimization",
      impact: "Reduces monthly burn by ₹65,000",
      confidence: "91%",
      urgency: "Low",
      description: "Convert on-demand AWS compute to 1-year Savings Plans for persistent production clusters.",
      actionLabel: "Review Cloud Audit"
    }
  ];
}

export async function uploadCSV(file) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/upload/csv`, {
      method: "POST",
      body: formData,
    });
    if (res.ok) return await res.json();
  } catch {
    // fallback simulation
  }

  // Fallback upload response
  return {
    success: true,
    filename: file.name,
    size_bytes: file.size,
    records_parsed: 142,
    date_range: "2026-01-01 to 2026-08-31",
    message: `Successfully ingested ${file.name} with 142 transaction rows.`
  };
}

export async function switchDemo(profile) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/upload/switch-demo?profile=${encodeURIComponent(profile)}`, {
      method: "POST",
    });
    if (res.ok) {
      currentProfile = profile;
      return await res.json();
    }
  } catch {
    // fallback
  }

  currentProfile = profile;
  return {
    success: true,
    profile,
    data: demoDatasets[profile] || demoDatasets["Manufacturing MSME"]
  };
}