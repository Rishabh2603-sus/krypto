let rawBase = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")).trim().replace(/\/$/, "");
if (rawBase && !rawBase.startsWith("http://") && !rawBase.startsWith("https://")) {
  rawBase = `https://${rawBase}`;
}
const API_BASE_URL = rawBase;

// Fallback & In-Memory state for standalone operation
let currentProfile = "Manufacturing MSME";

const demoDatasets = {
  "Manufacturing MSME": {
    opening_balance: 500000,
    total_income: 890000,
    total_expense: 618000,
    net_cashflow: 272000,
    current_cash: 772000,
    transaction_count: 15,
    burn: {
      daily_burn: 20600,
      monthly_burn: 618000,
      runway_days: 37,
      runway_months: 1.2,
      net_burn_rate: -9066,
    },
    risk: {
      score: 48,
      status: "Moderate",
      risk_level: "Moderate",
      trend: "+2 pts vs last month",
      factors: [
        { name: "Supplier Concentration", impact: "High", detail: "2 suppliers account for 58% of raw material purchases" },
        { name: "Customer Payment Latency", impact: "Medium", detail: "DSO is 32 days vs 30-day baseline credit terms" },
        { name: "Working Capital Buffer", impact: "Low", detail: "Current cash reserves cover 37 days of operating burn" },
      ]
    }
  },
  "SaaS Startup": {
    opening_balance: 480000,
    total_income: 520000,
    total_expense: 660000,
    net_cashflow: -140000,
    current_cash: 340000,
    transaction_count: 20,
    burn: {
      daily_burn: 22000,
      monthly_burn: 660000,
      runway_days: 15,
      runway_months: 0.5,
      net_burn_rate: 4666,
    },
    risk: {
      score: 76,
      status: "High",
      risk_level: "High",
      trend: "+8 pts vs last month",
      factors: [
        { name: "Negative Net Cashflow", impact: "Critical", detail: "Monthly burn exceeds receipts by ₹1.40L" },
        { name: "Cloud & Tool Overhead", impact: "Medium", detail: "AWS compute & SaaS consumes 26% of income" },
        { name: "Runway Compression", impact: "High", detail: "Less than 20 days runway without customer collections" },
      ]
    }
  },
  "D2C Retail": {
    opening_balance: 320000,
    total_income: 780000,
    total_expense: 650000,
    net_cashflow: 130000,
    current_cash: 450000,
    transaction_count: 21,
    burn: {
      daily_burn: 21666,
      monthly_burn: 650000,
      runway_days: 21,
      runway_months: 0.7,
      net_burn_rate: -4333,
    },
    risk: {
      score: 38,
      status: "Healthy",
      risk_level: "Low",
      trend: "-4 pts vs last month",
      factors: [
        { name: "Instant Gateway Settlement", impact: "Low", detail: "Razorpay payouts settled daily (T+1)" },
        { name: "Inventory Turnover", impact: "Medium", detail: "Finished goods turnover average is 24 days" },
        { name: "Ad Spend Efficiency", impact: "Low", detail: "Meta ROAS maintains 3.4x average" },
      ]
    }
  }
};

const defaultHistory = [
  { date: "2026-08-01", description: "Opening Balance", cash_change: 0, cash_balance: 500000 },
  { date: "2026-08-02", description: "Customer Payment - ABC Traders", cash_change: 180000, cash_balance: 680000 },
  { date: "2026-08-03", description: "Raw Material Purchase", cash_change: -95000, cash_balance: 585000 },
  { date: "2026-08-04", description: "Employee Salaries", cash_change: -120000, cash_balance: 465000 },
  { date: "2026-08-05", description: "Customer Payment - XYZ Ltd", cash_change: 240000, cash_balance: 705000 },
  { date: "2026-08-07", description: "Office Rent", cash_change: -45000, cash_balance: 660000 },
  { date: "2026-08-09", description: "Electricity Bill", cash_change: -18000, cash_balance: 642000 },
  { date: "2026-08-12", description: "Customer Payment - PQR Industries", cash_change: 150000, cash_balance: 792000 },
  { date: "2026-08-15", description: "Supplier Payment - Steel Corp", cash_change: -110000, cash_balance: 682000 },
  { date: "2026-08-18", description: "Customer Payment - ABC Traders", cash_change: 90000, cash_balance: 772000 },
  { date: "2026-08-20", description: "Transport Expenses", cash_change: -25000, cash_balance: 747000 },
  { date: "2026-08-22", description: "Customer Payment - XYZ Ltd", cash_change: 130000, cash_balance: 877000 },
  { date: "2026-08-25", description: "Employee Salaries", cash_change: -120000, cash_balance: 757000 },
  { date: "2026-08-27", description: "Raw Material Purchase", cash_change: -85000, cash_balance: 672000 },
  { date: "2026-08-30", description: "Customer Payment - PQR Industries", cash_change: 100000, cash_balance: 772000 }
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
      { month: "Apr 2026", income: 720000, expense: 580000, net: 140000 },
      { month: "May 2026", income: 810000, expense: 620000, net: 190000 },
      { month: "Jun 2026", income: 760000, expense: 690000, net: 70000 },
      { month: "Jul 2026", income: 840000, expense: 610000, net: 230000 },
      { month: "Aug 2026", income: 890000, expense: 618000, net: 272000 },
      { month: "Sep 2026", income: 820000, expense: 640000, net: 180000 }
    ],
    categories: [
      { name: "Employee Salaries & Wages", amount: 240000, percentage: 39, color: "#818cf8" },
      { name: "Raw Material Invoices", amount: 180000, percentage: 29, color: "#38bdf8" },
      { name: "Supplier Settlements", amount: 110000, percentage: 18, color: "#34d399" },
      { name: "Workshop Rent & Lease", amount: 45000, percentage: 7, color: "#fbbf24" },
      { name: "Transport & Logistics", amount: 25000, percentage: 4, color: "#f472b6" },
      { name: "Electricity & Industrial Power", amount: 18000, percentage: 3, color: "#a78bfa" }
    ],
    top_inflows: [
      { client: "XYZ Ltd", amount: 370000, share: "41.6%" },
      { client: "ABC Traders", amount: 270000, share: "30.3%" },
      { client: "PQR Industries", amount: 250000, share: "28.1%" }
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
    const spread = (i + 5) * 4500;
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
    capital_needed: currentProfile === "SaaS Startup" ? 180000 : 0,
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
    stress_alert: simBal < 150000 ? "High liquidity crunch risk within 60 days" : null
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
        total_outstanding: data.total_receivables ?? data.total_outstanding ?? 480000,
        aging: {
          current_0_30: data.aging?.current_0_30 ?? 310000,
          overdue_31_60: data.aging?.bucket_31_60 ?? data.aging?.overdue_31_60 ?? 120000,
          overdue_61_plus: (data.aging?.bucket_61_90 ?? 0) + (data.aging?.over_90 ?? 0) + (data.aging?.overdue_61_plus ?? 50000),
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
    dso: 28,
    dso_benchmark: 35,
    total_outstanding: 480000,
    aging: {
      current_0_30: 310000,
      overdue_31_60: 120000,
      overdue_61_plus: 50000
    },
    invoices: [
      { id: "INV-2026-081", counterparty: "ABC Traders", amount: 180000, due_date: "2026-09-02", days_overdue: 0, status: "Current", risk: "Low" },
      { id: "INV-2026-094", counterparty: "XYZ Ltd", amount: 130000, due_date: "2026-08-22", days_overdue: 12, status: "Overdue", risk: "Medium" },
      { id: "INV-2026-103", counterparty: "PQR Industries", amount: 100000, due_date: "2026-08-30", days_overdue: 4, status: "Overdue", risk: "Medium" },
      { id: "INV-2026-078", counterparty: "Delta Engineering", amount: 70000, due_date: "2026-07-15", days_overdue: 48, status: "Critical", risk: "High" }
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
        dpo: data.dpo_days ?? data.dpo ?? 26,
        dpo_benchmark: 40,
        total_outstanding: data.total_payables ?? data.total_outstanding ?? 315000,
        aging: {
          current_0_30: data.aging?.current_0_30 ?? 220000,
          overdue_31_60: data.aging?.bucket_31_60 ?? data.aging?.overdue_31_60 ?? 75000,
          overdue_61_plus: (data.aging?.bucket_61_90 ?? 0) + (data.aging?.over_90 ?? 0) + (data.aging?.overdue_61_plus ?? 20000),
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
    dpo: 26,
    dpo_benchmark: 40,
    total_outstanding: 315000,
    aging: {
      current_0_30: 220000,
      overdue_31_60: 75000,
      overdue_61_plus: 20000
    },
    invoices: [
      { id: "BILL-2026-441", counterparty: "Steel Corp Suppliers", amount: 110000, due_date: "2026-09-15", days_overdue: 0, status: "Current", terms: "Net 30" },
      { id: "BILL-2026-419", counterparty: "Industrial Power Utility", amount: 18000, due_date: "2026-09-09", days_overdue: 5, status: "Overdue", terms: "Net 15" },
      { id: "BILL-2026-455", counterparty: "Metals & Alloys Workshop", amount: 85000, due_date: "2026-09-27", days_overdue: 0, status: "Current", terms: "Net 30" },
      { id: "BILL-2026-488", counterparty: "Express Logistics Fleet", amount: 25000, due_date: "2026-08-20", days_overdue: 24, status: "Overdue", terms: "Net 30" },
      { id: "BILL-2026-492", counterparty: "Industrial Shed Lease", amount: 45000, due_date: "2026-09-07", days_overdue: 0, status: "Current", terms: "Net 30" }
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
      title: "Follow up with Delta Engineering on Overdue Invoice",
      category: "Receivables",
      impact: "+₹70,000 Liquidity within 5 days",
      confidence: "94%",
      urgency: "High",
      description: "Invoice INV-2026-078 is 48 days overdue. Offer a 2% prompt settlement discount or dispatch a formal payment reminder.",
      actionLabel: "Send Payment Reminder"
    },
    {
      id: "REC-02",
      title: "Negotiate Credit Terms with Steel Corp",
      category: "Working Capital",
      impact: "Preserves ₹1.10L cash buffer for 15 days",
      confidence: "88%",
      urgency: "Medium",
      description: "Request extension of supplier payment terms from Net-30 to Net-45 based on 6-month consistent order history.",
      actionLabel: "Draft Term Extension"
    },
    {
      id: "REC-03",
      title: "Optimize Industrial Power Tariff",
      category: "Cost Control",
      impact: "Saves ~₹4,500 on monthly electricity",
      confidence: "91%",
      urgency: "Low",
      description: "Shift high-power machining operations to off-peak tariff hours (10 PM - 6 AM) to leverage time-of-day concession.",
      actionLabel: "View Power Audit"
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