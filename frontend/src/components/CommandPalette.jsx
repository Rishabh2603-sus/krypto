import { useState, useEffect, useRef, useCallback } from "react";

export default function CommandPalette({
  isOpen,
  onClose,
  query,
  setQuery,
  commands = [],
  onExecute,
  playClick,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const executeCommand = useCallback(
    (cmd) => {
      if (playClick) playClick();
      if (cmd.action) cmd.action();
      if (onExecute) onExecute(cmd);
      onClose();
    },
    [playClick, onExecute, onClose]
  );

  // Handle arrow key navigation & Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (commands.length ? (prev + 1) % commands.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (commands.length ? (prev - 1 + commands.length) % commands.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (commands[selectedIndex]) {
          executeCommand(commands[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, commands, selectedIndex, executeCommand]);

  if (!isOpen) return null;

  // Safe selected index bounded by current list
  const safeIndex = Math.min(selectedIndex, Math.max(0, commands.length - 1));

  // Group commands by category
  const categories = Array.from(new Set(commands.map((c) => c.category || "General")));

  let globalIndexCounter = 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 11, 15, 0.75)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        zIndex: 100,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        paddingLeft: "var(--sp-4)",
        paddingRight: "var(--sp-4)",
        animation: "fadeIn 150ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: 600,
          background: "rgba(17, 19, 24, 0.94)",
          border: "1px solid var(--border-medium)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(56, 211, 159, 0.12)",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          animation: "fadeInUp 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "var(--sp-4) var(--sp-5)",
            borderBottom: "1px solid var(--border-subtle)",
            gap: "var(--sp-3)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent-primary)" }}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or jump to view..."
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: 16,
              color: "var(--text-primary)",
              fontFamily: "inherit",
            }}
          />
          <kbd
            style={{
              fontSize: 11,
              padding: "2px 7px",
              borderRadius: 4,
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-tertiary)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          style={{
            maxHeight: 380,
            overflowY: "auto",
            padding: "var(--sp-3) var(--sp-2)",
          }}
        >
          {commands.length === 0 ? (
            <div
              style={{
                padding: "var(--sp-8)",
                textAlign: "center",
                color: "var(--text-tertiary)",
                fontSize: 14,
              }}
            >
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            categories.map((category) => {
              const catCommands = commands.filter((c) => (c.category || "General") === category);
              if (catCommands.length === 0) return null;

              return (
                <div key={category} style={{ marginBottom: "var(--sp-3)" }}>
                  <div
                    style={{
                      padding: "4px 12px",
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "var(--text-tertiary)",
                    }}
                  >
                    {category}
                  </div>
                  {catCommands.map((cmd) => {
                    const currentIndex = globalIndexCounter++;
                    const isSelected = currentIndex === safeIndex;

                    return (
                      <div
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          cursor: "pointer",
                          background: isSelected ? "var(--accent-dim)" : "transparent",
                          color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                          transition: "background 100ms ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {cmd.icon && (
                            <span
                              style={{
                                color: isSelected ? "var(--accent-primary)" : "var(--text-tertiary)",
                                display: "flex",
                              }}
                            >
                              {cmd.icon}
                            </span>
                          )}
                          <div>
                            <div style={{ fontSize: 14, fontWeight: isSelected ? 500 : 400 }}>
                              {cmd.label}
                            </div>
                            {cmd.description && (
                              <div style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>
                                {cmd.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--accent-primary)" }}>
                            <span>Select</span>
                            <kbd
                              style={{
                                fontSize: 10,
                                padding: "2px 5px",
                                borderRadius: 3,
                                background: "rgba(56, 211, 159, 0.15)",
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              ↵
                            </kbd>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div
          style={{
            padding: "8px 16px",
            borderTop: "1px solid var(--border-subtle)",
            background: "rgba(0, 0, 0, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--text-tertiary)",
          }}
        >
          <div style={{ display: "flex", gap: 16 }}>
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
            <span>ESC to close</span>
          </div>
          <span>KRYPTO Command Center</span>
        </div>
      </div>
    </div>
  );
}
