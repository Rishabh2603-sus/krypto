import { useState, useMemo, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import CommandPalette from "./components/CommandPalette";

import OverviewView from "./views/OverviewView";
import CashflowView from "./views/CashflowView";
import ForecastView from "./views/ForecastView";
import LedgerView from "./views/LedgerView";
import SimulatorView from "./views/SimulatorView";
import UploadView from "./views/UploadView";

import CustomCursor from "./components/CustomCursor";
import { useAudio } from "./hooks/useAudio";
import { useCommandPalette } from "./hooks/useCommandPalette";
import { switchDemo } from "./api";
import "./App.css";

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    playHover,
    playClick,
    playSuccess,
    playError,
    playNavigation,
    isMuted,
    toggleMute,
    isAmbientPlaying,
    toggleAmbient,
  } = useAudio();

  // Handle global refresh action
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => {
      setIsRefreshing(false);
      playSuccess();
    }, 600);
  }, [playSuccess]);

  // Navigate view handler
  const handleViewChange = useCallback((viewId) => {
    setActiveView(viewId);
  }, []);

  // Command palette configuration
  const commands = useMemo(
    () => [
      // Navigation
      {
        id: "nav-overview",
        label: "Jump to Overview Dashboard",
        category: "Navigation",
        description: "Hero cash metrics, balance curve & AI directives",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
        ),
        action: () => handleViewChange("dashboard"),
      },
      {
        id: "nav-cashflow",
        label: "Open Cash Flow Analytics",
        category: "Navigation",
        description: "Burn rates, monthly inflows/outflows & category spend",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        ),
        action: () => handleViewChange("cashflow"),
      },
      {
        id: "nav-forecast",
        label: "View 90-Day Predictive Forecast",
        category: "Navigation",
        description: "Monte Carlo p10/p50/p90 confidence bands & shortfall dates",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
        ),
        action: () => handleViewChange("forecast"),
      },
      {
        id: "nav-ledger",
        label: "Inspect Aging Ledger (AR & AP)",
        category: "Navigation",
        description: "Receivables & payables aging buckets, DSO/DPO benchmarks",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <path d="M1 10h22" />
          </svg>
        ),
        action: () => handleViewChange("ledger"),
      },
      {
        id: "nav-simulator",
        label: "Launch What-If Sandbox Simulator",
        category: "Navigation",
        description: "Stress test debtor lags, inflation shocks & cash injections",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        ),
        action: () => handleViewChange("simulator"),
      },
      {
        id: "nav-upload",
        label: "Data Ingestion & CSV Import",
        category: "Navigation",
        description: "Upload bank statements or switch demo benchmark sets",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        ),
        action: () => handleViewChange("upload"),
      },
      // Actions
      {
        id: "action-refresh",
        label: "Sync Real-Time Financial Ledger",
        category: "Actions",
        description: "Re-fetch latest transactions from backend / storage",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,4 23,10 17,10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        ),
        action: handleRefresh,
      },
      {
        id: "action-toggle-audio",
        label: isMuted ? "Enable Audio Micro-Haptics" : "Mute Audio Micro-Haptics",
        category: "Actions",
        description: "Toggle synthetic Web Audio feedback on clicks and transitions",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ),
        action: toggleMute,
      },
      // Data Scenarios
      {
        id: "demo-msme",
        label: "Load Scenario: Manufacturing MSME",
        category: "Data Scenarios",
        description: "Benchmark: ₹45.0L cash, Net-45 credit, 52d runway",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ),
        action: async () => {
          await switchDemo("Manufacturing MSME");
          handleRefresh();
        },
      },
      {
        id: "demo-saas",
        label: "Load Scenario: SaaS Startup",
        category: "Data Scenarios",
        description: "Benchmark: ₹1.20Cr cash, high burn velocity, runway crunch",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
          </svg>
        ),
        action: async () => {
          await switchDemo("SaaS Startup");
          handleRefresh();
        },
      },
      {
        id: "demo-d2c",
        label: "Load Scenario: D2C Retail Brand",
        category: "Data Scenarios",
        description: "Benchmark: Fast inventory turnover, T+1 card settlements",
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        ),
        action: async () => {
          await switchDemo("D2C Retail");
          handleRefresh();
        },
      },
    ],
    [handleViewChange, handleRefresh, isMuted, toggleMute]
  );

  const {
    isOpen: isCommandPaletteOpen,
    open: openCommandPalette,
    close: closeCommandPalette,
    query,
    setQuery,
    filteredCommands,
  } = useCommandPalette(commands);

  // View titles & subtitles
  const viewMeta = {
    dashboard: {
      title: "Dashboard Overview",
      subtitle: "Cash Flow Intelligence",
    },
    cashflow: {
      title: "Cash Flow & Burn Analytics",
      subtitle: "Periodic Liquidity Reconciliation",
    },
    forecast: {
      title: "90-Day Predictive Forecast",
      subtitle: "Probabilistic Monte Carlo Engine",
    },
    ledger: {
      title: "Aging Ledger Analysis",
      subtitle: "Maturities & Working Capital Cycle",
    },
    simulator: {
      title: "What-If Scenario Sandbox",
      subtitle: "Capital & Operational Stress Modeling",
    },
    upload: {
      title: "Data Ingestion & Benchmark Hub",
      subtitle: "CSV Data Pipeline & Scenarios",
    },
  };

  const currentMeta = viewMeta[activeView] || viewMeta.dashboard;

  return (
    <div className="krypto-app-layout">
      {/* Precision magnetic follower cursor */}
      <CustomCursor />

      {/* Subtle top ambient glow from Portfolio */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: "-15%",
          left: "-10%",
          width: "120%",
          height: "45%",
          background: "radial-gradient(ellipse at top, rgba(56, 211, 159, 0.05) 0%, rgba(0, 0, 0, 0) 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* High-fidelity SVG noise grain overlay from Portfolio */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 99990,
          opacity: 0.035,
          mixBlendMode: "overlay",
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        activeView={activeView}
        onViewChange={handleViewChange}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isAmbientPlaying={isAmbientPlaying}
        onToggleAmbient={toggleAmbient}
        playNavigation={playNavigation}
        playHover={playHover}
      />

      {/* Main Content Area */}
      <main className="krypto-main-content">
        <Header
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenCommandPalette={openCommandPalette}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          playClick={playClick}
        />

        {/* View Component Switcher */}
        <div key={refreshKey} className="view-wrapper">
          {activeView === "dashboard" && (
            <OverviewView playClick={playClick} playSuccess={playSuccess} />
          )}
          {activeView === "cashflow" && (
            <CashflowView playClick={playClick} playSuccess={playSuccess} />
          )}
          {activeView === "forecast" && (
            <ForecastView playClick={playClick} playSuccess={playSuccess} />
          )}
          {activeView === "ledger" && (
            <LedgerView playClick={playClick} playSuccess={playSuccess} />
          )}
          {activeView === "simulator" && (
            <SimulatorView playClick={playClick} playSuccess={playSuccess} />
          )}
          {activeView === "upload" && (
            <UploadView
              onDatasetSwitch={handleRefresh}
              playClick={playClick}
              playSuccess={playSuccess}
              playError={playError}
            />
          )}
        </div>
      </main>

      {/* ⌘K Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={closeCommandPalette}
        query={query}
        setQuery={setQuery}
        commands={filteredCommands}
        playClick={playClick}
      />
    </div>
  );
}