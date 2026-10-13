import React, { useState, useRef, useCallback, useMemo } from "react";

interface HangingLampProps {
  isLightOn: boolean;
  onToggle: () => void;
}

export const HangingLamp: React.FC<HangingLampProps> = ({ isLightOn, onToggle }) => {
  const [pullY, setPullY] = useState(0);
  const [pullX, setPullX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasToggledThisPull, setHasToggledThisPull] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const currentPullYRef = useRef(0);
  const currentPullXRef = useRef(0);
  const hasToggledRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  const moveRafRef = useRef<number | null>(null);

  // Web Audio API: Realistic mechanical pull-switch ratchet dual-click
  const playClickSound = useCallback((turningOn: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // 1. Initial metallic tension spring trip
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(turningOn ? 980 : 740, now);
      osc1.frequency.exponentialRampToValueAtTime(240, now + 0.035);
      gain1.gain.setValueAtTime(0.24, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.035);

      // 2. Heavy mechanical ratchet snap
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(turningOn ? 1420 : 1080, now + 0.024);
      osc2.frequency.exponentialRampToValueAtTime(360, now + 0.075);
      gain2.gain.setValueAtTime(0.2, now + 0.024);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.024);
      osc2.stop(now + 0.075);
    } catch {
      // Audio autoplay policy fallback
    }
  }, []);

  // 2D Damped Harmonic Oscillation Spring Simulation
  const runSpringAnimation = useCallback((initialY: number, initialX: number = 0) => {
    if (Math.abs(initialY) < 1.5 && Math.abs(initialX) < 1.5) {
      setPullY(0);
      setPullX(0);
      return;
    }

    let startTime: number | null = null;
    const duration = 650; // ms
    const stiffness = 30;
    const damping = 8.5;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      const decay = Math.exp(-damping * elapsed);
      const dispY = initialY * decay * Math.cos(stiffness * elapsed);
      const dispX = initialX * decay * Math.cos(stiffness * 0.75 * elapsed);

      setPullY(dispY);
      setPullX(dispX);

      if (elapsed * 1000 < duration) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        setPullY(0);
        setPullX(0);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasInteracted(true);
    setHasToggledThisPull(false);
    hasToggledRef.current = false;
    startYRef.current = e.clientY;
    startXRef.current = e.clientX;
    currentPullYRef.current = 0;
    currentPullXRef.current = 0;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();

    const rawDeltaY = e.clientY - startYRef.current;
    const rawDeltaX = e.clientX - startXRef.current;

    // Elastic limit (Y up to 75px down, X up to +/- 45px)
    const clampedY = Math.max(-5, Math.min(75, rawDeltaY));
    const clampedX = Math.max(-45, Math.min(45, rawDeltaX * 0.8));

    currentPullYRef.current = clampedY;
    currentPullXRef.current = clampedX;

    // Immediate toggle check on threshold crossing
    if (clampedY >= 20 && !hasToggledRef.current) {
      hasToggledRef.current = true;
      setHasToggledThisPull(true);
      playClickSound(!isLightOn);
      onToggle();
    }

    // RAF-throttled visual update (syncs with 60/120Hz display refresh, eliminates lag)
    if (!moveRafRef.current) {
      moveRafRef.current = requestAnimationFrame(() => {
        setPullY(currentPullYRef.current);
        setPullX(currentPullXRef.current);
        moveRafRef.current = null;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    if (moveRafRef.current) {
      cancelAnimationFrame(moveRafRef.current);
      moveRafRef.current = null;
    }

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Fallback
    }

    if (!hasToggledRef.current && currentPullYRef.current < 18) {
      playClickSound(!isLightOn);
      onToggle();
      runSpringAnimation(24, 0);
    } else {
      runSpringAnimation(currentPullYRef.current, currentPullXRef.current);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isDragging || hasToggledThisPull) return;
    setHasInteracted(true);
    playClickSound(!isLightOn);
    onToggle();
    runSpringAnimation(24, 0);
  };

  // Rope coordinates: top anchor is PERMANENTLY at Y=0 (the ceiling)
  // Scaled down to sleek, refined proportions
  const ropeRig = useMemo(() => {
    const P0 = { x: 104, y: 0 }; // Permanently anchored at ceiling
    const restHeight = 158;
    const P2 = { x: 104 + pullX, y: restHeight + pullY }; // Bottom whipping handle
    const P1 = { x: 104 + pullX * 0.38, y: (restHeight + pullY) * 0.52 }; // Dynamic catenary mid-point

    // Tangent angle at bottom for whipping handle
    const endDx = 2 * (P2.x - P1.x);
    const endDy = 2 * (P2.y - P1.y);
    const handleAngle = (Math.atan2(endDy, endDx) * 180) / Math.PI - 90;

    return {
      pathD: `M ${P0.x} ${P0.y} Q ${P1.x} ${P1.y} ${P2.x} ${P2.y}`,
      handleX: P2.x,
      handleY: P2.y,
      handleAngle
    };
  }, [pullX, pullY]);

  return (
    <div
      className={`gym-ceiling-lamp-rig ${isLightOn ? "lamp-state-on" : "lamp-state-off"}`}
      aria-label="Interactive Ceiling Edison Bulb and Braided Hemp Rope"
    >
      {/* Floor illumination pool on dark gym floor only - NO duplicate bulb or bloom */}
      <div className={`volumetric-ambient-emission ${isLightOn ? "active" : "dormant"}`} aria-hidden="true">
        <div className="emission-floor-pool" />
      </div>

      <div className="ceiling-lamp-assembly">
        {/* --- 1. PHOTOREALISTIC EDISON BULB (EXACT USER PHOTO, REFINED SCALE) --- */}
        <div className="photorealistic-bulb-wrapper" aria-hidden="true">
          <img
            src="/edison-bulb-lit.png"
            alt="Edison Bulb Lit"
            className="bulb-photo-layer bulb-layer-lit"
            style={{ opacity: isLightOn ? 1 : 0 }}
          />
          <img
            src="/edison-bulb-unlit.png"
            alt="Edison Bulb Unlit"
            className="bulb-photo-layer bulb-layer-unlit"
            style={{ opacity: isLightOn ? 0 : 1 }}
          />
          {/* Subtle warm filament glow aura on bulb when ON */}
          {isLightOn && <div className="bulb-filament-aura" />}
        </div>

        {/* --- 2. PHOTOREALISTIC BRAIDED HEMP ROPE (ALWAYS ATTACHED AT CEILING Y=0) --- */}
        <svg
          className="photorealistic-rope-canvas"
          viewBox="0 0 160 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            {/* Natural Hemp Rope Fiber Gradient */}
            <linearGradient id="hempTwistGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#785025" />
              <stop offset="28%" stopColor="#d5a268" />
              <stop offset="65%" stopColor="#e4bd8b" />
              <stop offset="85%" stopColor="#b48249" />
              <stop offset="100%" stopColor="#623f1b" />
            </linearGradient>
          </defs>

          {/* Continuous core rope spine */}
          <path
            d={ropeRig.pathD}
            stroke="url(#hempTwistGrad)"
            strokeWidth="8.5"
            strokeLinecap="round"
          />

          {/* Realistic helical rope twist shadow pattern */}
          <path
            d={ropeRig.pathD}
            stroke="#45270a"
            strokeWidth="8.5"
            strokeDasharray="4 5"
            strokeDashoffset="1"
            strokeLinecap="butt"
            opacity="0.55"
          />

          {/* Authentic braided hemp highlight strands */}
          <path
            d={ropeRig.pathD}
            stroke="#fbe4c3"
            strokeWidth="2.4"
            strokeDasharray="4 5"
            strokeDashoffset="2.2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Authentic photographed whipping knot handle at bottom of rope */}
          <g
            transform={`translate(${ropeRig.handleX}, ${ropeRig.handleY}) rotate(${ropeRig.handleAngle})`}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <image
              href="/hemp-rope-handle.png"
              x="-8"
              y="-2"
              width="16"
              height="28"
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
        </svg>

        {/* --- 3. CURSOR DRAG TRIGGER BOUND TO THE WHIPPING HANDLE --- */}
        <div
          className={`rope-handle-trigger ${isDragging ? "dragging" : ""}`}
          style={{
            transform: `translate(${ropeRig.handleX}px, ${ropeRig.handleY}px)`
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              playClickSound(!isLightOn);
              onToggle();
              runSpringAnimation(24, 0);
            }
          }}
          title={`Click or drag the rope to toggle light ${isLightOn ? "OFF" : "ON"}`}
          aria-label={`Interactive ceiling rope: Light is currently ${isLightOn ? "ON" : "OFF"}`}
        >
          {!hasInteracted && (
            <div className="rope-hint-pill" aria-hidden="true">
              <span>Pull to switch</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
