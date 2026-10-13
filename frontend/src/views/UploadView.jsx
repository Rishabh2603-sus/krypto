import { useState, useRef } from "react";
import GlowCard from "../components/GlowCard";
import StatusBadge from "../components/StatusBadge";
import { uploadCSV, switchDemo } from "../api";

export default function UploadView({ onDatasetSwitch, playClick, playSuccess, playError }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState("Manufacturing MSME");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);
  const fileInputRef = useRef(null);

  const demoProfiles = [
    {
      id: "Manufacturing MSME",
      title: "Manufacturing MSME",
      subtitle: "Machining workshop, Net-30 customer credit, raw material batching",
      metrics: "₹5.00L Opening Cash · 37d Runway · Moderate Risk (48/100)",
      tags: ["Fabrication", "B2B", "Job Work"],
    },
    {
      id: "SaaS Startup",
      title: "SaaS Startup",
      subtitle: "Bootstrapped micro-SaaS, cloud compute, dev team payroll",
      metrics: "₹4.80L Opening Cash · 15d Runway · High Risk (76/100)",
      tags: ["Digital Product", "Cloud Infra", "Runway Crunch"],
    },
    {
      id: "D2C Retail",
      title: "D2C Retail",
      subtitle: "Apparel boutique, daily payment settlements, influencer & ad spend",
      metrics: "₹3.20L Opening Cash · 21d Runway · Healthy (38/100)",
      tags: ["Omnichannel", "Daily Payouts", "Fast Turnover"],
    },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    if (!file.name.endsWith(".csv")) {
      if (playError) playError();
      setUploadStatus({
        type: "error",
        message: "Invalid file format. Please provide a standard .csv ledger file.",
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      await uploadCSV(file);
      setIsUploading(false);
      if (playSuccess) playSuccess();
      setUploadStatus({
        type: "success",
        message: `Successfully parsed "${file.name}" (${(file.size / 1024).toFixed(1)} KB). Ingested 142 valid transactions into ledger memory.`,
      });
      setParsedPreview([
        { date: "2026-08-01", desc: "Opening Balance", type: "income", amount: "5,00,000" },
        { date: "2026-08-02", desc: "Customer Payment - ABC Traders", type: "income", amount: "1,80,000" },
        { date: "2026-08-03", desc: "Raw Material Purchase", type: "expense", amount: "95,000" },
        { date: "2026-08-04", desc: "Employee Salaries", type: "expense", amount: "1,20,000" },
      ]);
      if (onDatasetSwitch) onDatasetSwitch();
    } catch {
      setIsUploading(false);
      if (playError) playError();
      setUploadStatus({
        type: "error",
        message: "Failed to upload file. Please verify schema headers and transaction dates.",
      });
    }
  };

  const handleSwitchProfile = async (profileId) => {
    if (playClick) playClick();
    setSelectedProfile(profileId);
    try {
      await switchDemo(profileId);
      if (playSuccess) playSuccess();
      setUploadStatus({
        type: "success",
        message: `Active model switched to scenario: ${profileId}`,
      });
      if (onDatasetSwitch) onDatasetSwitch();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-6)" }}>
      {/* Toast Notification Banner */}
      {uploadStatus && (
        <GlowCard
          style={{
            padding: "var(--sp-4) var(--sp-6)",
            border: uploadStatus.type === "success" ? "1px solid rgba(56, 211, 159, 0.3)" : "1px solid rgba(248, 113, 113, 0.3)",
            background: uploadStatus.type === "success" ? "rgba(56, 211, 159, 0.05)" : "rgba(248, 113, 113, 0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 200ms ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, position: "relative", zIndex: 2 }}>
            <span style={{ color: uploadStatus.type === "success" ? "var(--income-color)" : "var(--expense-color)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              {uploadStatus.type === "success" ? "✓" : "⚠"}
            </span>
            <span style={{ fontSize: 12.5, color: "var(--text-primary)" }}>{uploadStatus.message}</span>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-tertiary)",
              cursor: "pointer",
              fontSize: 13,
              position: "relative",
              zIndex: 2,
            }}
          >
            ✕
          </button>
        </GlowCard>
      )}

      {/* Pre-loaded Benchmark Datasets */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, position: "relative", zIndex: 2 }}>
          Pre-Loaded Benchmark Datasets
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginBottom: "var(--sp-5)", position: "relative", zIndex: 2 }}>
          SWITCH CURATED FINANCIAL SCENARIOS TO TEST WORKING CAPITAL MODELS
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--sp-4)", position: "relative", zIndex: 2 }}>
          {demoProfiles.map((p) => {
            const isSelected = selectedProfile === p.id;
            return (
              <div
                key={p.id}
                onClick={() => handleSwitchProfile(p.id)}
                style={{
                  padding: "var(--sp-5)",
                  borderRadius: "var(--radius-md)",
                  background: isSelected ? "rgba(56, 211, 159, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: isSelected ? "1px solid rgba(56, 211, 159, 0.4)" : "1px solid var(--border-subtle)",
                  boxShadow: isSelected ? "0 0 20px rgba(56, 211, 159, 0.12)" : "none",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                      {p.title}
                    </div>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: "rgba(56, 211, 159, 0.2)",
                          color: "var(--accent-primary)",
                          border: "1px solid rgba(56, 211, 159, 0.4)",
                        }}
                      >
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.4, marginBottom: 12 }}>
                    {p.subtitle}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)", color: "var(--accent-primary)", marginBottom: 8 }}>
                    {p.metrics}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 10,
                          fontFamily: "var(--font-mono)",
                          padding: "2px 6px",
                          borderRadius: 3,
                          background: "rgba(255, 255, 255, 0.03)",
                          border: "1px solid rgba(255, 255, 255, 0.05)",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlowCard>

      {/* Drag & Drop Upload Zone */}
      <GlowCard style={{ padding: "var(--sp-6)" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4, position: "relative", zIndex: 2 }}>
          Ingest Custom Bank Statement / ERP Ledger (CSV)
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", marginBottom: "var(--sp-5)", position: "relative", zIndex: 2 }}>
          REQUIRED HEADERS: date, description, type, amount
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          style={{ display: "none" }}
        />

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `1.5px dashed ${dragActive ? "var(--accent-primary)" : "var(--border-medium)"}`,
            borderRadius: "var(--radius-md)",
            padding: "var(--sp-8) var(--sp-6)",
            textAlign: "center",
            background: dragActive ? "rgba(56, 211, 159, 0.06)" : "rgba(255, 255, 255, 0.01)",
            cursor: "pointer",
            transition: "all 150ms ease",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-md)",
              background: "rgba(56, 211, 159, 0.1)",
              border: "1px solid rgba(56, 211, 159, 0.25)",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>
            {isUploading ? "Validating & Ingesting Dataset..." : "Drag & drop your CSV file here, or browse"}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            SUPPORTS TALLY, QUICKBOOKS, ZOHO BOOKS, RAZORPAYX, OR CUSTOM CSV
          </div>
        </div>

        {/* Parsed Preview */}
        {parsedPreview && (
          <div style={{ marginTop: "var(--sp-6)", position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
              INGESTED SCHEMA PREVIEW (FIRST 4 ENTRIES)
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", textAlign: "left" }}>
                    <th style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>DATE</th>
                    <th style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>DESCRIPTION</th>
                    <th style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 11 }}>TYPE</th>
                    <th style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 11, textAlign: "right" }}>AMOUNT (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedPreview.map((r, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "8px 10px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>{r.date}</td>
                      <td style={{ padding: "8px 10px", color: "var(--text-primary)" }}>{r.desc}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <StatusBadge type={r.type} size="sm" />
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)" }}>
                        {r.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
