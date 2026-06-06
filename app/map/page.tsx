"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { api } from "@/lib/api";
import type { MapPin } from "@/components/AccidentMap";
import Image from "next/image";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

const AccidentMap = dynamic(() => import("@/components/AccidentMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-full rounded-lg flex items-center justify-center"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-5 h-5 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--text)" }}
      />
    </div>
  ),
});

interface VideoLocation {
  id: number;
  title: string;
  filmed_location: string | null;
  lat: number | null;
  lng: number | null;
  thumbnail_url: string | null;
  views: number;
}

function formatViews(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}천`;
  return String(v);
}

export default function MapPage() {
  const [locations, setLocations] = useState<VideoLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapPin | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<VideoLocation[]>("/videos/locations")
      .then(setLocations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const pins: MapPin[] = locations
    .filter((l) => l.lat !== null && l.lng !== null)
    .map((l) => ({
      id: l.id,
      title: l.title,
      lat: l.lat!,
      lng: l.lng!,
      thumbnail_url: l.thumbnail_url,
      views: l.views,
      filmed_location: l.filmed_location,
    }));

  const noLocation = locations.filter((l) => !l.lat);

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)]">
      {/* ── 지도 영역 ────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "var(--card)" }}
          >
            <div
              className="w-5 h-5 border-2 rounded-full animate-spin"
              style={{
                borderColor: "var(--border)",
                borderTopColor: "var(--text)",
              }}
            />
          </div>
        ) : pins.length === 0 ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-5 text-center px-8"
            style={{ background: "var(--card)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              🗺️
            </div>
            <div>
              <p className="text-sm font-semibold mb-1.5" style={{ color: "var(--text)" }}>
                아직 지도에 표시된 사고가 없습니다
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                블랙박스 영상과 함께 촬영 위치를 제보하면<br />
                이 지도에 사고 위치가 표시됩니다
              </p>
            </div>
            <Link
              href="/upload"
              className="px-5 py-2 text-xs font-medium"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              제보하기 →
            </Link>
          </div>
        ) : (
          <AccidentMap
            pins={pins}
            zoom={7}
            center={[36.5, 127.8]}
            height="100%"
            gpsEnabled
            onPinClick={(pin) => {
              setSelected(pin);
            }}
          />
        )}

        {/* 선택된 핀 카드 */}
        {selected && (
          <div
            className="absolute bottom-4 left-4 right-4 lg:left-4 lg:right-auto lg:w-72 p-4 rounded-xl z-1000"
            style={{
              background: "#fff",
              boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-xs opacity-40 hover:opacity-80 cursor-pointer"
            >
              ✕
            </button>
            {selected.thumbnail_url && (
              <div className="aspect-video relative rounded-lg overflow-hidden mb-3 bg-neutral-100">
                <Image
                  src={selected.thumbnail_url.startsWith("http") ? selected.thumbnail_url : `${API_BASE}/${selected.thumbnail_url}`}
                  alt={selected.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <p
              className="text-sm font-semibold mb-1 pr-4 leading-snug"
              style={{ color: "var(--text)" }}
            >
              {selected.title}
            </p>
            {selected.filmed_location && (
              <p
                className="text-xs mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {selected.filmed_location}
              </p>
            )}
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              조회 {formatViews(selected.views)}
            </p>
            <Link
              href={`/video/${selected.id}`}
              className="block text-center text-xs font-semibold py-2 rounded-lg"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              영상 보기 →
            </Link>
          </div>
        )}

        {/* 핀 수 배지 */}
        {!loading && (
          <div
            className="absolute top-3 right-3 z-1000 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text-muted)",
            }}
          >
            사고 {pins.length}건
          </div>
        )}
      </div>

      {/* ── 오른쪽 목록 ────────────────────────────────────────── */}
      <div
        className="w-full lg:w-72 xl:w-80 shrink-0 overflow-y-auto"
        style={{ borderLeft: "1px solid var(--border)" }}
        ref={listRef}
      >
        <div
          className="p-4 sticky top-0 z-10"
          style={{
            background: "var(--bg)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--text)" }}
          >
            사고 지도
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {loading
              ? "로딩 중..."
              : `총 ${locations.length}건 중 ${pins.length}건 위치 확인`}
          </p>
        </div>

        {!loading && locations.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-4 px-6 py-12">
            <p className="text-xs font-medium" style={{ color: "var(--text)" }}>
              제보된 영상이 없습니다
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
              블랙박스 영상을 제보하면<br />촬영 위치가 여기 나타납니다
            </p>
            <Link
              href="/upload"
              className="text-[11px] underline"
              style={{ color: "var(--text-muted)" }}
            >
              제보하기 →
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {pins.map((pin) => (
              <button
                key={pin.id}
                onClick={() => setSelected(selected?.id === pin.id ? null : pin)}
                className="w-full text-left px-4 py-3 transition-colors cursor-pointer"
                style={{
                  background:
                    selected?.id === pin.id ? "var(--card)" : "transparent",
                }}
              >
                <p
                  className="text-xs font-medium line-clamp-2 mb-0.5"
                  style={{ color: "var(--text)" }}
                >
                  {pin.title}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {pin.filmed_location}
                </p>
              </button>
            ))}

            {noLocation.length > 0 && (
              <div className="px-4 py-3">
                <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                  위치 미확인 {noLocation.length}건
                </p>
                {noLocation.map((v) => (
                  <Link
                    key={v.id}
                    href={`/video/${v.id}`}
                    className="block text-[11px] py-1 hover:underline truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {v.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
