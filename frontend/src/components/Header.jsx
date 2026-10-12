import { useState } from "react";

export default function Header({
  title = "Dashboard Overview",
  subtitle = "Cash Flow Intelligence",
  onRefresh,
  isRefreshing = false,
  onOpenCommandPalette,
  onOpenMobileMenu,
  playClick,
  playHover,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const notifications = [
    { id: 1, title: "Trans-Pacific invoice overdue 52d", time: "10m ago", type: "critical" },
    { id: 2, title: "Forecast updated with latest GST batch", time: "1h ago", type: "info" },
    { id: 3, title: "Precision Steel term extension proposed", time: "3h ago", type: "success" },
  ];

  const handleRefreshClick = () => {
    if (playClick) playClick();
    if (onRefresh) onRefresh();
  };

  const handlePaletteClick = () => {
    if (playClick) playClick();
    if (onOpenCommandPalette) onOpenCommandPalette();
  };

  return (
    <header
      className="krypto-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--sp-6)",
        position: "relative",
        zIndex: 20,
      }}
    >
      {/* Title & Mobile Hamburger */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-4)" }}>
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open mobile navigation"
          className="mobile-hamburger-btn"
          style={{
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "rgba(255, 255, 255, 0.03)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 500,
              color: "var(--accent-primary)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 3,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                boxShadow: "0 0 8px var(--accent-primary)",
              }}
            />
            {subtitle}
          </div>
          <h1
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 22,
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Right controls: Command Palette ⌘K, Notifications, Refresh, Profile */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        {/* Command Palette Trigger Button */}
        <button
          id="btn-command-palette-trigger"
          onClick={handlePaletteClick}
          onMouseEnter={playHover}
          className="cmd-palette-btn glow-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--sp-2)",
            padding: "6px 12px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "rgba(18, 20, 26, 0.6)",
            color: "var(--text-secondary)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12.5,
            transition: "all var(--duration-fast) var(--ease-out)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span className="search-label" style={{ marginRight: 6 }}>Search or command…</span>
          <kbd
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              padding: "2px 5px",
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
              fontWeight: 500,
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            id="btn-notifications"
            onClick={() => {
              if (playClick) playClick();
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            onMouseEnter={playHover}
            aria-label="View notifications"
            className="glow-card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              background: showNotifications ? "rgba(255, 255, 255, 0.08)" : "rgba(18, 20, 26, 0.6)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span
              style={{
                position: "absolute",
                top: 7,
                right: 7,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent-primary)",
                boxShadow: "0 0 6px var(--accent-primary)",
              }}
            />
          </button>

          {showNotifications && (
            <div
              className="glow-card"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 310,
                padding: "var(--sp-4)",
                zIndex: 60,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
                border: "1px solid var(--border-medium)",
                background: "rgba(10, 12, 16, 0.95)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>
                  Intelligence Alerts
                </span>
                <span style={{ fontSize: 11, color: "var(--accent-primary)", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
                  MARK ALL READ
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid rgba(255, 255, 255, 0.04)",
                      fontSize: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <div style={{ color: "var(--text-primary)", fontWeight: 500 }}>{n.title}</div>
                    <div style={{ color: "var(--text-tertiary)", fontSize: 10.5, fontFamily: "var(--font-mono)" }}>
                      {n.time}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Refresh button */}
        <button
          id="btn-refresh"
          onClick={handleRefreshClick}
          onMouseEnter={playHover}
          disabled={isRefreshing}
          aria-label="Refresh data"
          title="Refresh real-time data"
          className="glow-card"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-subtle)",
            background: "rgba(18, 20, 26, 0.6)",
            color: "var(--text-secondary)",
            cursor: isRefreshing ? "wait" : "pointer",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              animation: isRefreshing ? "spin 1s linear infinite" : "none",
            }}
          >
            <polyline points="23,4 23,10 17,10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
        </button>

        {/* Profile Avatar */}
        <div style={{ position: "relative" }}>
          <div
            onClick={() => {
              if (playClick) playClick();
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            onMouseEnter={playHover}
            title="Account profile"
            className="glow-card"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-md)",
              background: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--border-medium)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              color: "var(--text-primary)",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            RS
          </div>

          {showProfileMenu && (
            <div
              className="glow-card"
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 8px)",
                width: 210,
                padding: "var(--sp-3)",
                zIndex: 60,
                boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6)",
                border: "1px solid var(--border-medium)",
                background: "rgba(10, 12, 16, 0.95)",
                backdropFilter: "blur(24px)",
              }}
            >
              <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--border-subtle)", marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Rishabh Sharma</div>
                <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                  CHIEF FINANCIAL OFFICER
                </div>
              </div>
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  borderRadius: 4,
                  transition: "color 150ms ease",
                }}
              >
                Workspace Settings
              </div>
              <div
                style={{
                  padding: "6px 8px",
                  fontSize: 12,
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  borderRadius: 4,
                  transition: "color 150ms ease",
                }}
              >
                API Keys & Telemetry
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
