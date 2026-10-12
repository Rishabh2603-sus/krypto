import React, { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const cursorDotRef = useRef(null);
  const cursorRingRef = useRef(null);
  const mousePos = useRef({ x: -100, y: -100 });
  const ringPos = useRef({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on devices with fine pointer (mouse/trackpad)
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let rafId;

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target.closest(".glow-card") ||
        target.closest("[data-cursor-hover]") ||
        target.closest("input") ||
        target.closest(".interactive-element")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseover", handleMouseOver, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // 60fps lerp loop for the outer ring follower
    const loop = () => {
      const targetX = mousePos.current.x;
      const targetY = mousePos.current.y;

      ringPos.current.x += (targetX - ringPos.current.x) * 0.22;
      ringPos.current.y += (targetY - ringPos.current.y) * 0.22;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [isVisible]);

  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) {
    return null;
  }

  return (
    <>
      {/* Precision center dot */}
      <div
        ref={cursorDotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: -2.5,
          left: -2.5,
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          pointerEvents: "none",
          zIndex: 99999,
          mixBlendMode: "difference",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 150ms ease",
          willChange: "transform",
        }}
      />

      {/* Smooth magnetic ring follower */}
      <div
        ref={cursorRingRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: isHovering ? -18 : -11,
          left: isHovering ? -18 : -11,
          width: isHovering ? 36 : 22,
          height: isHovering ? 36 : 22,
          borderRadius: "50%",
          border: isHovering ? "1.5px solid rgba(255, 255, 255, 0.9)" : "1px solid rgba(255, 255, 255, 0.4)",
          backgroundColor: isHovering ? "rgba(255, 255, 255, 0.08)" : "transparent",
          backdropFilter: isHovering ? "invert(0.1)" : "none",
          pointerEvents: "none",
          zIndex: 99998,
          mixBlendMode: "difference",
          opacity: isVisible ? 1 : 0,
          transition: "width 220ms cubic-bezier(0.16, 1, 0.3, 1), height 220ms cubic-bezier(0.16, 1, 0.3, 1), top 220ms cubic-bezier(0.16, 1, 0.3, 1), left 220ms cubic-bezier(0.16, 1, 0.3, 1), background-color 200ms ease, opacity 150ms ease",
          willChange: "transform",
        }}
      />
    </>
  );
}

export default CustomCursor;
