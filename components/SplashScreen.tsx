"use client";

import { useEffect, useRef, useState } from "react";

// 로고의 4개 타원: cx, cy, rx, ry (viewBox 0 0 705 728)
const ELLIPSES = [
  { cx: 24,    cy: 363.529, rx: 24,    ry: 213.785 },
  { cx: 145.5, cy: 364,     rx: 66.5,  ry: 278.298 },
  { cx: 383,   cy: 364,     rx: 138,   ry: 364 },
  { cx: 627.5, cy: 364,     rx: 77.5,  ry: 249.102 },
];

// 각 타원의 물결 애니메이션 delay (좌→우 순차)
const DELAYS = [0, 0.12, 0.26, 0.42];

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 900);
    const t2 = setTimeout(() => setPhase("out"), 1800);
    const t3 = setTimeout(() => onDoneRef.current(), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "var(--text)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.6s ease" : "opacity 0.4s ease",
      }}
    >
      <div style={{ width: 120, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="120" height="124" viewBox="0 0 705 728" fill="none" style={{ overflow: "visible" }}>
          {ELLIPSES.map((e, i) => (
            <ellipse
              key={i}
              cx={e.cx}
              cy={e.cy}
              rx={e.rx}
              ry={e.ry}
              fill="white"
              style={{
                animation: `wave 1.1s ease-in-out ${DELAYS[i]}s infinite`,
                transformOrigin: `${e.cx}px ${e.cy}px`,
              }}
            />
          ))}
        </svg>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); opacity: 1; }
          40%       { transform: scaleY(0.78); opacity: 0.7; }
          70%       { transform: scaleY(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
