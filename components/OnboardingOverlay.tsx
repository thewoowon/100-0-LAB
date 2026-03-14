"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    id: "onboarding-search",
    bubble: "🔍 영상 내용을 자연어로 검색해보세요.\n\"흰색 차가 신호등 들이받는 영상\" 같이 설명하면 AI가 찾아드립니다.",
    pos: "bottom" as const,
  },
  {
    id: "onboarding-top",
    bubble: "🔥 지금 가장 많이 본 사고 영상 TOP 10입니다.\n어떤 사건이 화제인지 한눈에 볼 수 있어요.",
    pos: "bottom" as const,
  },
  {
    id: "onboarding-controversial",
    bubble: "⚖️ 아직 과실 비율 결론이 안 난 사건들이에요.\n영상을 보고 투표로 의견을 남겨보세요.",
    pos: "bottom" as const,
  },
  {
    id: "onboarding-feed",
    bubble: "🎬 최신 블랙박스 영상 피드입니다.\n스크롤하면 계속 불러옵니다.",
    pos: "top" as const,
  },
];

interface ViewportRect { top: number; left: number; width: number; height: number; }

function getViewportRect(id: string): ViewportRect | null {
  const el = document.getElementById(id);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const PAD = 10;

export default function OnboardingOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<ViewportRect | null>(null);
  const [visible, setVisible] = useState(false);

  const current = STEPS[step];

  useEffect(() => {
    setVisible(false);

    // 해당 엘리먼트가 없는 스텝은 자동으로 건너뜀
    const el = document.getElementById(current.id);
    if (!el) {
      const nextStep = step + 1;
      if (nextStep < STEPS.length) {
        setStep(nextStep);
      } else {
        onDone();
      }
      return;
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // 스크롤 완료 후 위치 계산
    const t = setTimeout(() => {
      const r = getViewportRect(current.id);
      setRect(r);
      setVisible(true);
    }, 450);

    return () => clearTimeout(t);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onDone();
    }
  }

  if (!rect) return null;

  const isLast = step === STEPS.length - 1;
  const { pos } = current;

  // 하이라이트: fixed, viewport 기준
  const hTop = rect.top - PAD;
  const hLeft = rect.left - PAD;
  const hWidth = rect.width + PAD * 2;
  const hHeight = rect.height + PAD * 2;

  // 말풍선 위치
  const cx = rect.left + rect.width / 2;
  const bubbleLeft = Math.max(8, Math.min(cx - 160, window.innerWidth - 336));
  const bubbleTop = pos === "bottom"
    ? rect.top + rect.height + PAD + 16
    : rect.top - PAD - 16 - 130;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9980, pointerEvents: "none" }}>
      {/* 딤 배경 — 하이라이트 구멍은 clip-path로 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          // clip-path으로 하이라이트 영역 구멍
          clipPath: `polygon(
            0% 0%, 100% 0%, 100% 100%, 0% 100%,
            0% ${hTop}px,
            ${hLeft}px ${hTop}px,
            ${hLeft}px ${hTop + hHeight}px,
            ${hLeft + hWidth}px ${hTop + hHeight}px,
            ${hLeft + hWidth}px ${hTop}px,
            0% ${hTop}px
          )`,
        }}
      />

      {/* 하이라이트 테두리 */}
      <div
        style={{
          position: "absolute",
          top: hTop,
          left: hLeft,
          width: hWidth,
          height: hHeight,
          borderRadius: 10,
          border: "2px solid rgba(255,255,255,0.4)",
          opacity: visible ? 1 : 0,
          transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
          pointerEvents: "none",
        }}
      />

      {/* 말풍선 */}
      <div
        style={{
          position: "fixed",
          top: bubbleTop,
          left: bubbleLeft,
          width: 320,
          background: "#fff",
          borderRadius: 12,
          padding: "14px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease 0.1s",
          pointerEvents: "auto",
          zIndex: 9995,
        }}
      >
        {/* 꼬리 */}
        <div
          style={{
            position: "absolute",
            width: 0,
            height: 0,
            ...(pos === "bottom"
              ? { top: -8, left: 28, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderBottom: "8px solid #fff" }
              : { bottom: -8, left: 28, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: "8px solid #fff" }),
          }}
        />

        <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text)", marginBottom: 12 }}>
          {current.bubble}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === step ? "var(--text)" : "var(--border)",
                  transition: "all 0.25s",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={onDone} className="text-xs cursor-pointer" style={{ color: "var(--text-muted)" }}>
              건너뛰기
            </button>
            <button
              onClick={next}
              className="text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              {isLast ? "시작하기" : "다음 →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
