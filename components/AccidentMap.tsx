"use client";

import { useEffect, useRef } from "react";

export interface MapPin {
  id: number;
  title: string;
  lat: number;
  lng: number;
  thumbnail_url: string | null;
  views: number;
  filmed_location: string | null;
}

interface AccidentMapProps {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  onPinClick?: (pin: MapPin) => void;
  singlePin?: boolean;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    kakao: any;
  }
}

function formatViews(v: number) {
  if (v >= 10000) return `${(v / 10000).toFixed(1)}만`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}천`;
  return String(v);
}

export default function AccidentMap({
  pins,
  center,
  zoom = 8,
  height = "100%",
  onPinClick,
  singlePin = false,
}: AccidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const overlaysRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

    let cancelled = false;

    function init() {
      if (cancelled || !mapRef.current) return;

      const kakao = window.kakao;
      if (!kakao?.maps) return;

      // 이미 지도가 있으면 제거
      if (mapInstanceRef.current) {
        overlaysRef.current.forEach((o: unknown) => {
          (o as { setMap: (m: null) => void }).setMap(null);
        });
        overlaysRef.current = [];
        mapInstanceRef.current = null;
        mapRef.current!.innerHTML = "";
      }

      const defaultCenter = center
        ? new kakao.maps.LatLng(center[0], center[1])
        : pins.length === 1
        ? new kakao.maps.LatLng(pins[0].lat, pins[0].lng)
        : new kakao.maps.LatLng(36.5, 127.8);

      const kakaoZoom = pins.length === 1 ? 4 : zoom; // 카카오 zoom: 1(가장 가까움)~14(가장 멀리)

      const map = new kakao.maps.Map(mapRef.current, {
        center: defaultCenter,
        level: kakaoZoom,
        draggable: true,
        scrollwheel: !singlePin,
      });

      mapInstanceRef.current = map;

      pins.forEach((pin) => {
        const position = new kakao.maps.LatLng(pin.lat, pin.lng);

        // 커스텀 오버레이 (검정 원 마커)
        const markerEl = document.createElement("div");
        markerEl.style.cssText = `
          width:14px;height:14px;
          background:#0a0a0a;
          border:2px solid #fff;
          border-radius:50%;
          box-shadow:0 1px 6px rgba(0,0,0,0.4);
          cursor:pointer;
        `;

        const overlay = new kakao.maps.CustomOverlay({
          position,
          content: markerEl,
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 3,
        });
        overlay.setMap(map);
        overlaysRef.current.push(overlay);

        // 인포윈도우 (팝업)
        if (!singlePin) {
          const infoContent = `
            <div style="padding:12px 14px;min-width:170px;font-family:sans-serif;border-radius:10px;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
              <p style="font-size:12px;font-weight:600;margin:0 0 4px;line-height:1.4;color:#0a0a0a;">${pin.title}</p>
              ${pin.filmed_location ? `<p style="font-size:11px;color:#888;margin:0 0 4px;">${pin.filmed_location}</p>` : ""}
              <p style="font-size:11px;color:#888;margin:0 0 8px;">조회 ${formatViews(pin.views)}</p>
              <a href="/video/${pin.id}" style="font-size:11px;color:#0a0a0a;font-weight:600;text-decoration:underline;">영상 보기 →</a>
            </div>
          `;

          const infowindow = new kakao.maps.InfoWindow({
            content: infoContent,
            removable: true,
            zIndex: 10,
          });

          markerEl.addEventListener("click", () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            infowindow.open(map, { getPosition: () => position } as any);
            onPinClick?.(pin);
          });

          overlaysRef.current.push(infowindow);
        } else {
          markerEl.addEventListener("click", () => onPinClick?.(pin));
        }
      });
    }

    // SDK가 이미 로드됐으면 바로, 아니면 load 후 실행
    if (window.kakao?.maps) {
      window.kakao.maps.load(init);
    } else {
      const interval = setInterval(() => {
        if (window.kakao?.maps) {
          clearInterval(interval);
          window.kakao.maps.load(init);
        }
      }, 100);
      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (pins.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs rounded-lg"
        style={{ height, background: "var(--card)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
      >
        위치 정보 없음
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%", borderRadius: "8px", overflow: "hidden" }}
    />
  );
}
