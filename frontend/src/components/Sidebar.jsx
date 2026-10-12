import React from "react";

const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Overview",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
    badge: null,
  },
  {
    id: "cashflow",
    label: "Cash Flow",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    badge: null,
  },
  {
    id: "forecast",
    label: "90-Day Forecast",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
      </svg>
    ),
    badge: "AI",
  },
  {
    id: "ledger",
    label: "Aging Ledger",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
    badge: null,
  },
  {
    id: "simulator",
    label: "What-If Simulator",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
    badge: "MC",
  },
  {
    id: "upload",
    label: "Data Ingestion",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    badge: null,
  },
];

export default function Sidebar({
  activeView,
  onViewChange,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  isMuted = false,
  onToggleMute,
  isAmbientPlaying = false,
  onToggleAmbient,
  playNavigation,
  playHover,
}) {
  const handleItemClick = (id) => {
    if (playNavigation) playNavigation();
    onViewChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 45,
            animation: "fadeIn 200ms ease",
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`krypto-sidebar ${isMobileOpen ? "mobile-open" : ""} ${isCollapsed ? "collapsed" : ""}`}
        style={{
          width: isCollapsed ? "var(--sidebar-collapsed)" : "var(--sidebar-width)",
          flexShrink: 0,
          background: "rgba(10, 11, 14, 0.8)",
          backdropFilter: "blur(24px)",
          borderRight: "1px solid var(--border-subtle)",
          padding: isCollapsed ? "var(--sp-6) var(--sp-2)" : "var(--sp-6) var(--sp-4)",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100dvh",
          zIndex: 50,
          overflow: "hidden auto",
          transition: "width 220ms cubic-bezier(0.16, 1, 0.3, 1), transform 250ms ease",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: isCollapsed ? "var(--sp-2) 0" : "var(--sp-2) var(--sp-2)",
            marginBottom: "var(--sp-6)",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
          }}
        >
          <div
            onClick={() => handleItemClick("dashboard")}
            onMouseEnter={playHover}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--sp-3)",
              cursor: "pointer",
            }}
          >
            {/* Minimalist Monogram Badge */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(56, 211, 159, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(56, 211, 159, 0.12)",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: "var(--accent-primary)",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                K
              </span>
            </div>

            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 700,
                    fontSize: 15,
                    letterSpacing: "0.04em",
                    color: "var(--text-primary)",
                    lineHeight: 1.1,
                  }}
                >
                  KRYPTO
                </span>
                <span
                  style={{
                    fontSize: 9.5,
                    letterSpacing: "0.12em",
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-tertiary)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                  }}
                >
                  CASHFLOW OS
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              onMouseEnter={playHover}
              aria-label="Collapse sidebar"
              className="sidebar-collapse-btn"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-tertiary)",
                cursor: "pointer",
                padding: 4,
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "color 150ms ease",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="11 19 4 12 11 5" />
                <polyline points="18 19 11 12 18 5" />
              </svg>
            </button>
          )}
        </div>

        {/* Collapsed Expand Button */}
        {isCollapsed && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--sp-4)" }}>
            <button
              onClick={onToggleCollapse}
              onMouseEnter={playHover}
              aria-label="Expand sidebar"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                width: 28,
                height: 28,
                borderRadius: "var(--radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="13 19 20 12 13 5" />
                <polyline points="6 19 13 12 6 5" />
              </svg>
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {!isCollapsed && (
            <div
              style={{
                padding: "var(--sp-2) var(--sp-3)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.14em",
                fontFamily: "var(--font-mono)",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: 2,
              }}
            >
              SYSTEM MODULES
            </div>
          )}

          {NAV_ITEMS.map((item) => {
            const active = item.id === activeView;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={playHover}
                title={isCollapsed ? item.label : undefined}
                className="glow-card"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  gap: "var(--sp-3)",
                  padding: isCollapsed ? "10px 0" : "9px 12px",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  border: active ? "1px solid rgba(56, 211, 159, 0.25)" : "1px solid transparent",
                  background: active ? "rgba(56, 211, 159, 0.06)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  fontFamily: "inherit",
                  transition: "all var(--duration-fast) var(--ease-out)",
                  textAlign: "left",
                  width: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "20%",
                      bottom: "20%",
                      width: 2.5,
                      borderRadius: "0 2px 2px 0",
                      background: "var(--accent-primary)",
                      boxShadow: "0 0 10px var(--accent-primary)",
                    }}
                  />
                )}

                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: active ? "var(--accent-primary)" : "inherit",
                  }}
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: 9.5,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 600,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(56, 211, 159, 0.12)",
                      color: "var(--accent-primary)",
                      border: "1px solid rgba(56, 211, 159, 0.2)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Controls: Audio haptics & Ambient drone */}
        <div style={{ marginTop: "auto", paddingTop: "var(--sp-6)" }}>
          {/* Audio micro-haptics button */}
          <button
            onClick={onToggleMute}
            onMouseEnter={playHover}
            title={isMuted ? "Unmute micro-haptics" : "Mute micro-haptics"}
            className="glow-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              width: "100%",
              padding: isCollapsed ? "8px 0" : "8px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: "rgba(255, 255, 255, 0.02)",
              color: isMuted ? "var(--text-tertiary)" : "var(--accent-primary)",
              cursor: "pointer",
              fontSize: 11.5,
              fontFamily: "inherit",
              marginBottom: 6,
              transition: "all 150ms ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              {isMuted ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
              {!isCollapsed && <span>Haptics</span>}
            </div>

            {!isCollapsed && (
              <span
                style={{
                  fontSize: 9.5,
                  fontFamily: "var(--font-mono)",
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: isMuted ? "rgba(255,255,255,0.04)" : "rgba(56, 211, 159, 0.12)",
                }}
              >
                {isMuted ? "OFF" : "ON"}
              </span>
            )}
          </button>

          {/* Ambient Synthesizer Drone toggle */}
          {onToggleAmbient && (
            <button
              onClick={onToggleAmbient}
              onMouseEnter={playHover}
              title={isAmbientPlaying ? "Stop ambient drone" : "Start binaural ambient drone"}
              className="glow-card"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "space-between",
                width: "100%",
                padding: isCollapsed ? "8px 0" : "8px 10px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "rgba(255, 255, 255, 0.02)",
                color: isAmbientPlaying ? "var(--accent-primary)" : "var(--text-tertiary)",
                cursor: "pointer",
                fontSize: 11.5,
                fontFamily: "inherit",
                marginBottom: 10,
                transition: "all 150ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12a4 4 0 0 1 8 0" />
                </svg>
                {!isCollapsed && <span>Drone</span>}
              </div>

              {!isCollapsed && (
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: "var(--font-mono)",
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: isAmbientPlaying ? "rgba(56, 211, 159, 0.12)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  {isAmbientPlaying ? "55Hz" : "OFF"}
                </span>
              )}
            </button>
          )}

          {/* Terminal Model Telemetry Status */}
          {!isCollapsed && (
            <div
              className="glow-card"
              style={{
                padding: "8px 10px",
                borderRadius: "var(--radius-md)",
                background: "rgba(255, 255, 255, 0.015)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--accent-primary)" }}>
                  ENGINE LIVE
                </span>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "var(--income-color)",
                    boxShadow: "0 0 6px var(--income-color)",
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                PORTFOLIO CORE v2.4
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
