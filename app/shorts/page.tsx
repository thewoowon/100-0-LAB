"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { api, VideoFeedResponse, VideoDetail, VoteResult, MyVote } from "@/lib/api";

const VOTE_OPTIONS = ["100:0", "90:10", "80:20", "70:30", "60:40", "50:50"];
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function formatViews(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}천`;
  return String(v);
}

interface ShortItem {
  id: number;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  filmed_location: string | null;
  tags: string[];
  votes: VoteResult | null;
  myVote: string | null;
}

export default function ShortsPage() {
  const [items, setItems] = useState<ShortItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [votingId, setVotingId] = useState<number | null>(null);
  const [showVote, setShowVote] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const loadedIds = useRef<Set<number>>(new Set());

  // 피드 로드
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const params = cursor ? `?cursor=${cursor}` : "";
      const data = await api.get<VideoFeedResponse>(`/videos/feed${params}`);
      const fresh = data.videos.filter((v) => !loadedIds.current.has(v.id));
      if (fresh.length === 0) { setHasMore(false); return; }

      // 각 영상 상세 + 투표 병렬 로드
      const details = await Promise.all(
        fresh.map(async (v) => {
          try {
            const [detail, votes, tags] = await Promise.all([
              api.get<VideoDetail>(`/videos/${v.id}`),
              api.get<VoteResult>(`/videos/${v.id}/votes`),
              api.get<{ tags: { name: string }[] }>(`/videos/${v.id}/tags`),
            ]);
            let myVote: string | null = null;
            try {
              const mv = await api.get<MyVote>(`/videos/${v.id}/votes/me`);
              myVote = mv.ratio;
            } catch { /* 비로그인 */ }

            loadedIds.current.add(v.id);
            return {
              id: v.id,
              title: detail.title,
              video_url: detail.video_url.startsWith("http") ? detail.video_url : `${BASE_URL.replace("/api/v1", "")}${detail.video_url}`,
              thumbnail_url: detail.thumbnail_url,
              views: detail.views,
              filmed_location: detail.filmed_location,
              tags: tags.tags.map((t) => t.name),
              votes,
              myVote,
            } as ShortItem;
          } catch { return null; }
        })
      );

      setItems((prev) => [...prev, ...details.filter(Boolean) as ShortItem[]]);
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, hasMore, loadingMore]);

  useEffect(() => { loadMore(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 인덱스 변경시 영상 재생/정지
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === currentIdx) {
        v.play().catch(() => {});
      } else {
        v.pause();
        v.currentTime = 0;
      }
    });
    // 마지막 2개 남으면 추가 로드
    if (items.length - currentIdx <= 2) loadMore();
  }, [currentIdx, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // 스와이프/스크롤 핸들러
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let startY = 0;
    let isDragging = false;
    let lastWheel = 0;

    function onTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      isDragging = true;
    }
    function onTouchEnd(e: TouchEvent) {
      if (!isDragging) return;
      const dy = startY - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) {
        if (dy > 0) setCurrentIdx((i) => Math.min(i + 1, items.length - 1));
        else setCurrentIdx((i) => Math.max(i - 1, 0));
      }
      isDragging = false;
    }
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel < 400) return; // 쿨다운
      if (Math.abs(e.deltaY) < 5) return;
      lastWheel = now;
      if (e.deltaY > 0) setCurrentIdx((i) => Math.min(i + 1, items.length - 1));
      else setCurrentIdx((i) => Math.max(i - 1, 0));
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
    };
  }, [items.length]);

  // 키보드
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") setCurrentIdx((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowUp") setCurrentIdx((i) => Math.max(i - 1, 0));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  async function handleVote(videoId: number, ratio: string) {
    setVotingId(videoId);
    try {
      const result = await api.post<VoteResult>(`/videos/${videoId}/votes`, { ratio });
      setItems((prev) =>
        prev.map((it) => it.id === videoId ? { ...it, votes: result, myVote: ratio } : it)
      );
      setShowVote(false);
    } catch { /* 비로그인 등 */ }
    finally { setVotingId(null); }
  }

  const current = items[currentIdx];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ top: 0 }}
    >
      {/* 닫기 / 홈으로 */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center justify-center rounded-full"
          style={{ width: 36, height: 36, background: "rgba(0,0,0,0.5)", color: "#fff" }}
        >
          ←
        </Link>
        <span className="text-white text-xs font-medium opacity-70">쇼츠</span>
      </div>

      {/* 인덱스 표시 */}
      <div className="absolute top-4 right-4 z-50 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
        {currentIdx + 1} / {items.length}{hasMore ? "+" : ""}
      </div>

      {/* 영상 슬롯들 (현재 ±1만 렌더) */}
      {items.map((item, i) => {
        if (Math.abs(i - currentIdx) > 1) return null;
        const offset = (i - currentIdx) * 100;
        return (
          <div
            key={item.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translateY(${offset}%)`,
              transition: "transform 0.35s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* 480px 영상 컨테이너 */}
            <div className="relative h-full" style={{ width: "100%", maxWidth: 480 }}>
            <video
              ref={(el) => { videoRefs.current[i] = el; }}
              src={item.video_url}
              poster={item.thumbnail_url ?? undefined}
              loop
              playsInline
              muted={false}
              className="w-full h-full"
              style={{ objectFit: "contain" }}
              onClick={() => {
                const v = videoRefs.current[i];
                if (!v) return;
                v.paused ? v.play() : v.pause();
              }}
            />

            {/* 그라데이션 오버레이 */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 45%)" }}
            />

            {/* 하단 정보 */}
            {i === currentIdx && (
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pointer-events-none">
                <Link
                  href={`/video/${item.id}`}
                  className="block mb-2 pointer-events-auto"
                  style={{ color: "#fff" }}
                >
                  <p className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</p>
                  {item.filmed_location && (
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>📍 {item.filmed_location}</p>
                  )}
                </Link>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pointer-events-auto">
                    {item.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 우측 액션 패널 */}
            {i === currentIdx && (
              <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5">
                {/* 조회수 */}
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.15)" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>{formatViews(item.views)}</span>
                </div>

                {/* 투표 버튼 */}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={() => setShowVote((v) => !v)}
                    className="flex items-center justify-center rounded-full cursor-pointer transition-all"
                    style={{
                      width: 44, height: 44,
                      background: item.myVote ? "rgba(196,28,28,0.8)" : "rgba(255,255,255,0.15)",
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                  </button>
                  <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>
                    {item.myVote ?? "투표"}
                  </span>
                </div>

                {/* 상세 보기 */}
                <div className="flex flex-col items-center gap-1">
                  <Link
                    href={`/video/${item.id}`}
                    className="flex items-center justify-center rounded-full"
                    style={{ width: 44, height: 44, background: "rgba(255,255,255,0.15)" }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                  </Link>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>상세</span>
                </div>
              </div>
            )}
            </div>{/* /480px wrapper */}
          </div>
        );
      })}

      {/* 투표 패널 */}
      {showVote && current && (
        <div
          className="absolute bottom-0 left-0 right-0 z-50 rounded-t-2xl p-5"
          style={{ background: "rgba(20,20,20,0.96)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-semibold text-sm">과실 비율 투표</p>
            <button onClick={() => setShowVote(false)} style={{ color: "rgba(255,255,255,0.5)" }} className="cursor-pointer text-lg">✕</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {VOTE_OPTIONS.map((opt) => {
              const voteData = current.votes?.options.find((o) => o.ratio === opt);
              const isMyVote = current.myVote === opt;
              return (
                <button
                  key={opt}
                  onClick={() => handleVote(current.id, opt)}
                  disabled={votingId === current.id}
                  className="rounded-xl py-3 flex flex-col items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                  style={{
                    background: isMyVote ? "rgba(196,28,28,0.8)" : "rgba(255,255,255,0.1)",
                    border: isMyVote ? "1px solid rgba(196,28,28,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <span className="text-white font-bold text-sm">{opt}</span>
                  {voteData && (
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                      {voteData.percentage.toFixed(0)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {current.votes && (
            <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
              총 {current.votes.total}표
            </p>
          )}
        </div>
      )}

      {/* 초기 로딩 */}
      {items.length === 0 && (loadingMore || hasMore) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* 빈 상태 */}
      {items.length === 0 && !loadingMore && !hasMore && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 10 4.553-2.069A1 1 0 0 1 21 8.87v6.26a1 1 0 0 1-1.447.894L15 14"/>
              <rect x="2" y="6" width="13" height="12" rx="2"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold text-lg mb-2">
              아직 쇼츠 영상이 없습니다
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
              블랙박스 영상을 제보하면<br />
              여기서 쇼츠로 즐길 수 있어요
            </p>
          </div>
          <Link
            href="/upload"
            className="px-6 py-2.5 text-sm font-medium rounded-full"
            style={{ background: "rgba(255,255,255,0.12)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
          >
            첫 번째 제보하기 →
          </Link>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            채택 시 건당 5,000원 지급
          </p>
        </div>
      )}

      {/* 세로 진행 인디케이터 */}
      {items.length > 0 && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col gap-1" style={{ zIndex: 40 }}>
          {items.slice(Math.max(0, currentIdx - 3), currentIdx + 4).map((_, relIdx) => {
            const absIdx = Math.max(0, currentIdx - 3) + relIdx;
            return (
              <div
                key={absIdx}
                style={{
                  width: 3,
                  height: absIdx === currentIdx ? 20 : 6,
                  borderRadius: 2,
                  background: absIdx === currentIdx ? "#fff" : "rgba(255,255,255,0.3)",
                  transition: "all 0.25s",
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
