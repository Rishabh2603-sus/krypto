import { useState, useEffect, useRef } from "react";

export const formatINR = (n) => {
  const num = Number(n) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "−" : "";
  if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  if (abs >= 1000) return `${sign}₹${(abs / 1000).toFixed(1)}K`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
};

export default function AnimatedNumber({
  value,
  formatter = formatINR,
  duration = 750,
  className = "",
  style = {},
}) {
  const [display, setDisplay] = useState(Number(value) || 0);
  const prevValRef = useRef(Number(value) || 0);

  useEffect(() => {
    const target = Number(value) || 0;
    const startVal = prevValRef.current;
    const startTime = performance.now();
    let animId;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * eased;
      setDisplay(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        prevValRef.current = target;
        setDisplay(target);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [value, duration]);

  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>
      {formatter(display)}
    </span>
  );
}
