"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, VideoFeedItem, VideoFeedResponse } from "@/lib/api";
import SplashScreen from "@/components/SplashScreen";
import OnboardingOverlay from "@/components/OnboardingOverlay";

const PLACEHOLDERS = [
  "흰색 차가 신호등을 들이받는 영상",
  "고속도로에서 끼어들기 사고",
  "빗길에 미끄러져서 중앙선 넘은 차",
  "스쿨존 과속 아이 튀어나오는 영상",
  "역주행 정면충돌 직전",
  "신호위반 교차로 충돌",
  "보복운전 칼치기 블랙박스",
  "주차장 긁고 도망간 차",
];

function formatViews(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}천`;
  return String(v);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function VideoCard({ video }: { video: VideoFeedItem }) {
  return (
    <Link href={`/video/${video.id}`} className="block group">
      <div
        className="overflow-hidden rounded-lg transition-all duration-200 group-hover:-translate-y-0.5"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="relative aspect-video bg-neutral-100">
          {video.thumbnail_url ? (
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              fill
              className="object-cover group-hover:opacity-80 transition-opacity"
              unoptimized
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ color: "var(--text-muted)", fontSize: 12 }}>No thumbnail</span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-1" style={{ color: "var(--text)", minHeight: "2.5rem" }}>
            {video.title}
          </p>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
            <span>조회 {formatViews(video.views)}</span>
            <span>·</span>
            <span>{formatDate(video.created_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function TopVideoRow({ video, rank }: { video: VideoFeedItem; rank: number }) {
  return (
    <Link href={`/video/${video.id}`} className="flex items-center gap-3 group py-2 px-1 rounded-lg hover:bg-neutral-50 transition-colors">
      <span
        className="text-sm w-6 shrink-0 text-center tabular-nums"
        style={{
          color: rank <= 3 ? "var(--accent)" : "var(--text-muted)",
          fontWeight: rank <= 3 ? 700 : 400,
        }}
      >
        {rank}
      </span>
      <div className="relative w-16 h-10 rounded overflow-hidden shrink-0 bg-neutral-100">
        {video.thumbnail_url && (
          <Image src={video.thumbnail_url} alt={video.title} fill className="object-cover group-hover:opacity-80 transition-opacity" unoptimized />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium line-clamp-2 leading-snug" style={{ color: "var(--text)" }}>
          {video.title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          조회 {formatViews(video.views)}
        </p>
      </div>
    </Link>
  );
}

// Typewriter placeholder hook
function useTypewriter(texts: string[]) {
  const [display, setDisplay] = useState("");
  const stateRef = useRef({ textIdx: 0, charIdx: 0, deleting: false, paused: false });

  useEffect(() => {
    function tick() {
      const s = stateRef.current;
      const current = texts[s.textIdx];
      if (s.paused) {
        s.paused = false;
        timer = setTimeout(tick, 1800);
        return;
      }
      if (!s.deleting) {
        if (s.charIdx < current.length) {
          s.charIdx++;
          setDisplay(current.slice(0, s.charIdx));
          timer = setTimeout(tick, 45);
        } else {
          s.paused = true;
          s.deleting = true;
          timer = setTimeout(tick, 0);
        }
      } else {
        if (s.charIdx > 0) {
          s.charIdx--;
          setDisplay(current.slice(0, s.charIdx));
          timer = setTimeout(tick, 22);
        } else {
          s.deleting = false;
          s.textIdx = (s.textIdx + 1) % texts.length;
          timer = setTimeout(tick, 100);
        }
      }
    }
    let timer = setTimeout(tick, 400);
    return () => clearTimeout(timer);
  }, [texts]);

  return display;
}

interface SearchResult {
  id: number;
  user_id: number;
  title: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
  score: number;
}

const ONBOARDING_KEY = "100lab_onboarded";
const SPLASH_KEY = "100lab_splash_seen";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [videos, setVideos] = useState<VideoFeedItem[]>([]);
  const [topVideos, setTopVideos] = useState<VideoFeedItem[]>([]);
  const [controversialVideos, setControversialVideos] = useState<VideoFeedItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const loadedIds = useRef<Set<number>>(new Set());
  const didLoad = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const placeholder = useTypewriter(PLACEHOLDERS);

  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 이미 본 적 있으면 마운트 직후 스플래시 스킵
  useEffect(() => {
    if (localStorage.getItem(SPLASH_KEY)) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashDone = useCallback(() => {
    localStorage.setItem(SPLASH_KEY, "1");
    setShowSplash(false);
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingDone = useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShowOnboarding(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const params = cursor ? `?cursor=${cursor}` : "";
      const data = await api.get<VideoFeedResponse>(`/videos/feed${params}`);
      const fresh = data.videos.filter((v) => !loadedIds.current.has(v.id));
      fresh.forEach((v) => loadedIds.current.add(v.id));
      setVideos((prev) => [...prev, ...fresh]);
      setCursor(data.next_cursor);
      setHasMore(data.has_more);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    loadMore();
    // 인기 + 논란 영상 로드
    api.get<VideoFeedItem[]>("/videos/top?limit=10").then(setTopVideos).catch(() => {});
    api.get<VideoFeedItem[]>("/videos/controversial?limit=4").then(setControversialVideos).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    inputRef.current?.blur();
    try {
      const data = await api.get<{ query: string; results: SearchResult[] }>(
        `/videos/search?q=${encodeURIComponent(q)}&top_k=12`
      );
      setSearchResults(data.results);
    } catch {
      setSearchResults(
        videos.filter((v) => v.title.toLowerCase().includes(q.toLowerCase())).map((v) => ({ ...v, score: 1 }))
      );
    } finally {
      setSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSearch();
    }
  }

  function clearSearch() {
    setQuery("");
    setSearchResults(null);
  }

  const showSearch = searchResults !== null;

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      <div className="relative max-w-6xl mx-auto px-4">
        {showOnboarding && <OnboardingOverlay onDone={handleOnboardingDone} />}

      {/* ── 검색 영역 ── */}
      <div id="onboarding-search" className="py-10 pb-8">
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-200"
          style={{
            background: "var(--card)",
            border: `1px solid ${inputFocused ? "var(--text)" : "var(--border)"}`,
            boxShadow: inputFocused ? "0 0 0 3px rgba(17,17,17,0.06)" : "none",
          }}
        >
          <div className="flex gap-3 px-5 pt-4 pb-3 items-start">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" style={{ color: inputFocused ? "var(--text)" : "var(--text-muted)", transition: "color .2s" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                rows={1}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed"
                style={{ color: "var(--text)", minHeight: "24px", maxHeight: "120px", overflow: "hidden" }}
              />
              {!query && (
                <div className="absolute top-0 left-0 text-sm leading-relaxed pointer-events-none select-none" style={{ color: "var(--text-muted)" }}>
                  {placeholder}
                  <span className="inline-block w-px h-4 ml-px align-middle" style={{ background: "var(--text-muted)", animation: "blink 1s step-end infinite" }} />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {query && (
                <button onClick={clearSearch} className="text-xs cursor-pointer opacity-40 hover:opacity-80 transition-opacity" style={{ color: "var(--text)" }}>✕</button>
              )}
              <button onClick={handleSearch} disabled={!query.trim() || searching} className="px-3 py-1 text-xs font-medium rounded-lg cursor-pointer disabled:opacity-30 transition-all" style={{ background: "var(--text)", color: "var(--bg)" }}>
                {searching ? "..." : "검색"}
              </button>
            </div>
          </div>
          {!inputFocused && !query && (
            <div className="px-5 pb-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
              영상 내용을 자연어로 설명하면 AI가 찾아드립니다 · Enter로 검색
            </div>
          )}
        </div>

        {showSearch && (
          <div className="flex items-center justify-between mt-5 mb-1">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              <span style={{ color: "var(--text)", fontWeight: 500 }}>&ldquo;{query}&rdquo;</span>{" "}검색 결과 {searchResults!.length}개
            </p>
            <button onClick={clearSearch} className="text-xs cursor-pointer hover:underline" style={{ color: "var(--text-muted)" }}>전체 목록으로</button>
          </div>
        )}
      </div>

      {/* ── 검색 결과 ── */}
      {showSearch ? (
        <>
          {searchResults!.length === 0 ? (
            <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>검색 결과가 없습니다</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
              {searchResults!.map((v) => <VideoCard key={v.id} video={v} />)}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── TOP 10 + 논란 영상 ── */}
          {(topVideos.length > 0 || controversialVideos.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
              {/* TOP 10 */}
              {topVideos.length > 0 && (
                <div id="onboarding-top" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>인기 영상 TOP 10</h2>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>조회수 기준</span>
                  </div>
                  <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 340, scrollbarWidth: "none" }}>
                    {topVideos.map((v, i) => (
                      <TopVideoRow key={v.id} video={v} rank={i + 1} />
                    ))}
                  </div>
                </div>
              )}

              {/* 논란 영상 */}
              {controversialVideos.length > 0 && (
                <div id="onboarding-controversial" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                      아직 결론 안 난 사건들
                    </h2>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>투표 팽팽</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {controversialVideos.map((v) => <VideoCard key={v.id} video={v} />)}
                  </div>
                  {controversialVideos.length === 0 && (
                    <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>투표가 쌓이면 여기에 나타납니다</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── 전체 피드 ── */}
          <div id="onboarding-feed" className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>최신 영상</h2>
          </div>

          {videos.length === 0 && !loading && (
            <div className="py-20 flex flex-col items-center text-center gap-6">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                📹
              </div>
              <div>
                <p className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>
                  현재 첫 번째 제보를 기다리고 있습니다
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  블랙박스 영상을 제보해주세요.<br />
                  운영팀 검수 후 채택 시 건당 <span style={{ color: "var(--text)", fontWeight: 600 }}>5,000원</span>이 지급됩니다.
                </p>
              </div>
              <Link
                href="/upload"
                className="px-5 py-2.5 text-sm font-medium"
                style={{ background: "var(--text)", color: "var(--bg)" }}
              >
                제보하기 →
              </Link>
              <div
                className="mt-2 px-5 py-4 rounded-xl max-w-sm w-full text-left"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--text)" }}>
                  AI 자연어 검색
                </p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  영상이 쌓이면 위 검색창에서 &ldquo;흰색 차가 신호등 들이받는 영상&rdquo;처럼 상황을 설명하면 AI가 관련 영상을 찾아드립니다.
                </p>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((v) => <VideoCard key={v.id} video={v} />)}
          </div>
          <div ref={loaderRef} className="flex justify-center py-8">
            {loading && (
              <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--text)" }} />
            )}
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
      </div>
    </>
  );
}
