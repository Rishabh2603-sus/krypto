import React from "react";
import { useGlowCard } from "../hooks/useGlowCard";

export function GlowCard({ children, className = "", style = {}, onClick, dataCursorHover = true, ...props }) {
  const { cardRef, handleMouseMove, handleMouseLeave } = useGlowCard();

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`glow-card ${className}`}
      style={style}
      data-cursor-hover={dataCursorHover ? "true" : undefined}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlowCard;
