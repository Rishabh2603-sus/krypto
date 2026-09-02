const API_BASE_URL = "http://127.0.0.1:8000";

export async function fetchCashflowSummary() {
    const response = await fetch(`${API_BASE_URL}/api/cashflow/summary`);

    if (!response.ok) {
        throw new Error("Failed to fetch cash-flow summary");
    }

    return response.json();
}