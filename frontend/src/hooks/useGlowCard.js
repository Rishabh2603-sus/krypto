import { useRef, useCallback } from "react";

/**
 * Returns a ref to attach to a card element and a mouse move handler.
 * On mouse move, updates the element's --glow-x, --glow-y, and --glow-opacity
 * CSS variables, driving dynamic radial spotlight and 1px border shimmer.
 */
export function useGlowCard() {
  const cardRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty("--glow-x", `${x}px`);
    card.style.setProperty("--glow-y", `${y}px`);
    card.style.setProperty("--glow-opacity", "1");
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty("--glow-opacity", "0");
  }, []);

  return { cardRef, handleMouseMove, handleMouseLeave };
}
