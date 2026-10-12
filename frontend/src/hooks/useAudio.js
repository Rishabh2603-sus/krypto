import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Web Audio synthetic tactile audio engine
 * Replicates the exact sound design from Rishabh's portfolio:
 * - hover: 1000Hz -> 1200Hz sine micro-shimmer
 * - click: 300Hz -> 100Hz triangle punch
 * - type: 120Hz square click
 * - success: 600Hz -> 960Hz harmonic sweep
 * - error: 400Hz -> 180Hz sawtooth alert
 * - ambient: 55Hz (A1) warm drone + 110.5Hz binaural harmonic shimmer
 */
export function useAudio() {
  const [isMuted, setIsMuted] = useState(() => {
    try {
      if (typeof window !== "undefined") {
        return localStorage.getItem("krypto_audio_muted") === "true";
      }
      return false;
    } catch {
      return false;
    }
  });

  const ctxRef = useRef(null);
  const ambientNodeRef = useRef(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  const initAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctxRef.current = new AudioCtx();
      }
    }
    if (ctxRef.current && ctxRef.current.state === "suspended") {
      ctxRef.current.resume().catch(() => {});
    }
    return ctxRef.current;
  }, []);

  // Unlock audio on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      initAudio();
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("keydown", handleGesture);
    };
    document.addEventListener("click", handleGesture, { once: true });
    document.addEventListener("keydown", handleGesture, { once: true });
    return () => {
      document.removeEventListener("click", handleGesture);
      document.removeEventListener("keydown", handleGesture);
    };
  }, [initAudio]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("krypto_audio_muted", String(next));
      } catch {}
      if (next && ambientNodeRef.current) {
        try {
          ambientNodeRef.current.osc1.stop();
          ambientNodeRef.current.osc2.stop();
        } catch {}
        ambientNodeRef.current = null;
        setIsAmbientPlaying(false);
      }
      return next;
    });
  }, []);

  // Micro-sine hover haptic
  const playHover = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.03);

      gain.gain.setValueAtTime(0.003, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }, [isMuted, initAudio]);

  // Triangle punch click haptic (from portfolio)
  const playClick = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.07);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }, [isMuted, initAudio]);

  // Rising dual-harmonic success chord
  const playSuccess = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(960, now + 0.12);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }, [isMuted, initAudio]);

  // Descending sawtooth warning alert
  const playError = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = initAudio();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);

      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }, [isMuted, initAudio]);

  // Navigation tab sweep
  const playNavigation = useCallback(() => {
    playHover();
  }, [playHover]);

  // Ambient binaural shimmer drone (optional background depth)
  const toggleAmbient = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudio();
    if (!ctx) return;

    if (ambientNodeRef.current) {
      // Fade out
      try {
        const { osc1, osc2, gain } = ambientNodeRef.current;
        gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
        setTimeout(() => {
          try {
            osc1.stop();
            osc2.stop();
          } catch {}
        }, 1100);
      } catch {}
      ambientNodeRef.current = null;
      setIsAmbientPlaying(false);
    } else {
      // Fade in 55Hz + 110.5Hz
      try {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(55, ctx.currentTime);

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(110.5, ctx.currentTime);

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.003, ctx.currentTime + 3.0);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        ambientNodeRef.current = { osc1, osc2, gain };
        setIsAmbientPlaying(true);
      } catch {}
    }
  }, [isMuted, initAudio]);

  return {
    playHover,
    playClick,
    playSuccess,
    playError,
    playNavigation,
    isMuted,
    toggleMute,
    isAmbientPlaying,
    toggleAmbient,
  };
}
