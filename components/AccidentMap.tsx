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
  gpsEnabled?: boolean;
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

const MARKER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="5" fill="#0a0a0a" stroke="white" stroke-width="2.5"/></svg>'
)}`;

export default function AccidentMap({
  pins,
  center,
  zoom = 8,
  height = "100%",
  onPinClick,
  singlePin = false,
  gpsEnabled = false,
}: AccidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  function gotoUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const kakao = window.kakao;
        if (!mapInstanceRef.current || !kakao?.maps) return;
        const latlng = new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        (mapInstanceRef.current as { setCenter: (l: unknown) => void; setLevel: (l: number) => void }).setCenter(latlng);
        (mapInstanceRef.current as { setCenter: (l: unknown) => void; setLevel: (l: number) => void }).setLevel(5);
      },
      () => {}
    );
  }

  useEffect(() => {
    if (!mapRef.current || pins.length === 0) return;

    let cancelled = false;

    function init() {
      if (cancelled || !mapRef.current) return;

      const kakao = window.kakao;
      if (!kakao?.maps) return;

      // 기존 마커 제거
      markersRef.current.forEach((m: unknown) => {
        (m as { setMap: (map: null) => void }).setMap(null);
      });
      markersRef.current = [];

      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
        mapRef.current!.innerHTML = "";
      }

      const defaultCenter = center
        ? new kakao.maps.LatLng(center[0], center[1])
        : pins.length === 1
        ? new kakao.maps.LatLng(pins[0].lat, pins[0].lng)
        : new kakao.maps.LatLng(36.5, 127.8);

      const level = pins.length === 1 ? 4 : zoom;

      const map = new kakao.maps.Map(mapRef.current, {
        center: defaultCenter,
        level,
        draggable: true,
        scrollwheel: !singlePin,
      });

      mapInstanceRef.current = map;

      // 위치 권한 요청 후 지도 중심 이동
      if (gpsEnabled && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            map.setCenter(new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
            map.setLevel(7);
          },
          () => {}
        );
      }

      const markerImage = new kakao.maps.MarkerImage(
        MARKER_SVG,
        new kakao.maps.Size(16, 16),
        { offset: new kakao.maps.Point(8, 8) }
      );

      pins.forEach((pin) => {
        const position = new kakao.maps.LatLng(pin.lat, pin.lng);
        const marker = new kakao.maps.Marker({ position, image: markerImage, map });
        markersRef.current.push(marker);

        if (!singlePin) {
          const infoContent = `
            <div style="padding:12px 14px;min-width:170px;font-family:sans-serif;border-radius:10px;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.12);">
              <p style="font-size:12px;font-weight:600;margin:0 0 4px;line-height:1.4;color:#0a0a0a;">${pin.title}</p>
              ${pin.filmed_location ? `<p style="font-size:11px;color:#888;margin:0 0 4px;">${pin.filmed_location}</p>` : ""}
              <p style="font-size:11px;color:#888;margin:0 0 8px;">조회 ${formatViews(pin.views)}</p>
              <a href="/video/${pin.id}" style="font-size:11px;color:#0a0a0a;font-weight:600;text-decoration:underline;">영상 보기 →</a>
            </div>
          `;
          const infowindow = new kakao.maps.InfoWindow({ content: infoContent, removable: true, zIndex: 10 });
          kakao.maps.event.addListener(marker, "click", () => {
            infowindow.open(map, marker);
            onPinClick?.(pin);
          });
        } else {
          kakao.maps.event.addListener(marker, "click", () => onPinClick?.(pin));
        }
      });
    }

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
  }, [pins]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div style={{ height, width: "100%", position: "relative" }}>
      <div
        ref={mapRef}
        style={{ height: "100%", width: "100%", borderRadius: "8px", overflow: "hidden" }}
      />
      {gpsEnabled && (
        <button
          onClick={gotoUserLocation}
          title="내 위치로"
          style={{
            position: "absolute",
            bottom: "12px",
            right: "12px",
            zIndex: 10,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#fff",
            border: "1px solid #e5e5e5",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "16px",
          }}
        >
          ◎
        </button>
      )}
    </div>
  );
}
