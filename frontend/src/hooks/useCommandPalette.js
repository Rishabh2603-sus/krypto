import { useState, useEffect, useMemo, useCallback } from "react";

/**
 * Hook for Command Palette keyboard shortcut and search filtering
 */
export function useCommandPalette(commands = []) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Listen for ⌘K / Ctrl+K and Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery("");
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;

    return commands.filter((cmd) => {
      const labelMatch = cmd.label?.toLowerCase().includes(q);
      const catMatch = cmd.category?.toLowerCase().includes(q);
      const descMatch = cmd.description?.toLowerCase().includes(q);
      return labelMatch || catMatch || descMatch;
    });
  }, [commands, query]);

  const open = useCallback(() => {
    setIsOpen(true);
    setQuery("");
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    query,
    setQuery,
    filteredCommands,
  };
}
