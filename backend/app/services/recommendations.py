from typing import Dict, Any, List


def generate_recommendations(
    cashflow_data: Dict[str, Any],
    risk_data: Dict[str, Any],
) -> List[Dict[str, Any]]:
    """
    Generate contextual, high-impact cash flow optimization recommendations
    based on cashflow health, burn rate, receivables cycle, and concentration risks.

    Returns a list of 4-6 action items with format:
    {
        "priority": "HIGH" | "MEDIUM" | "LOW",
        "action": str,
        "reason": str,
        "impact": float (estimated INR saved/gained/freed up)
    }
    """
    recommendations: List[Dict[str, Any]] = []

    current_cash = float(cashflow_data.get("current_cash", 0.0))
    total_expense = float(cashflow_data.get("total_expense", 0.0))
    total_income = float(cashflow_data.get("total_income", 0.0))
    runway_days = cashflow_data.get("runway_days")
    daily_burn = float(cashflow_data.get("daily_burn_rate", 0.0))
    if daily_burn == 0 and total_expense > 0:
        daily_burn = total_expense / 30.0

    risk_score = float(risk_data.get("risk_score", 45.0))
    concentration = float(risk_data.get("customer_concentration_ratio", 0.35))
    dso = float(risk_data.get("dso", 42.0))
    dpo = float(risk_data.get("dpo", 25.0))

    # 1. Runway & Emergency Buffer check
    if runway_days is not None and runway_days < 45:
        impact_est = round(daily_burn * 20, 2)
        recommendations.append({
            "priority": "HIGH",
            "action": "Trigger Immediate Discretionary Spend Freeze & Defer Non-Essential Capex",
            "reason": f"Runway is critically compressed at {int(runway_days)} days. Immediate cash conservation required.",
            "impact": impact_est,
        })
    elif runway_days is not None and runway_days < 90:
        impact_est = round(daily_burn * 14, 2)
        recommendations.append({
            "priority": "MEDIUM",
            "action": "Tighten Operational Expenditure & Renegotiate Contractor Retainers",
            "reason": f"Runway stands at {int(runway_days)} days, below the recommended 90-day liquidity buffer.",
            "impact": impact_est,
        })

    # 2. Customer Concentration Risk
    if concentration >= 0.30:
        impact_est = round(total_income * 0.15, 2)
        recommendations.append({
            "priority": "HIGH" if concentration > 0.45 else "MEDIUM",
            "action": "Implement Milestone-Based Billing & Broaden Client Acquisition Funnel",
            "reason": f"Top client accounts for {round(concentration * 100, 1)}% of total revenues. Client churn would severely impair liquidity.",
            "impact": max(impact_est, 75000.0),
        })

    # 3. DSO / Overdue Receivables Acceleration
    if dso > 35:
        accelerated_cash = round((total_income / 30.0) * (dso - 30), 2)
        recommendations.append({
            "priority": "HIGH" if dso > 45 else "MEDIUM",
            "action": "Offer 2/10 Net 30 Early Settlement Discounts on Enterprise Invoices",
            "reason": f"Days Sales Outstanding (DSO) is elevated at {round(dso, 1)} days vs 30-day industry benchmark.",
            "impact": max(accelerated_cash, 50000.0),
        })
    else:
        recommendations.append({
            "priority": "LOW",
            "action": "Automate Electronic Invoicing & Pre-Due Payment Reminders via WhatsApp/Email",
            "reason": f"DSO is currently healthy at {round(dso, 1)} days; automated dunning preserves prompt collection hygiene.",
            "impact": round(total_income * 0.03, 2),
        })

    # 4. Vendor Payables / DPO Optimization
    if dpo < 35:
        preservation = round((total_expense / 30.0) * 15, 2)
        recommendations.append({
            "priority": "MEDIUM",
            "action": "Negotiate 45-Day Payment Terms with Top Tier-1 Suppliers",
            "reason": f"Days Payable Outstanding (DPO) of {round(dpo, 1)} days is trailing collections cycle, creating working capital friction.",
            "impact": max(preservation, 40000.0),
        })
    else:
        recommendations.append({
            "priority": "LOW",
            "action": "Consolidate Vendor Contracts for Volume Rebates",
            "reason": "Existing supplier credit terms are stable; volume bundling can secure tier discounts.",
            "impact": round(total_expense * 0.05, 2),
        })

    # 5. Operational Cost Rationalization
    if total_expense > 0:
        ops_savings = round(total_expense * 0.08, 2)
        recommendations.append({
            "priority": "MEDIUM" if risk_score > 60 else "LOW",
            "action": "Audit Unused Cloud Infrastructure, SaaS Subscriptions, and Marketing Spend",
            "reason": "Variable operating costs and recurring tech stack subscriptions present immediate rationalization opportunity.",
            "impact": max(ops_savings, 25000.0),
        })

    # 6. Idle Working Capital Sweep (if cash buffer is healthy)
    if current_cash > 500000 and (runway_days is None or runway_days > 75):
        interest_gain = round(current_cash * 0.065 * (30 / 365), 2)
        recommendations.append({
            "priority": "LOW",
            "action": "Activate Overnight Treasury Sweeps / Auto-Sweep Fixed Deposits",
            "reason": "Substantial liquid cash reserves can generate risk-free yield without impacting liquidity.",
            "impact": max(interest_gain, 12000.0),
        })

    # Ensure 4-6 items
    return recommendations[:6]
