"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import LogoIcon from "./icons/LogoIcon";
import { useAuth } from "@/lib/useAuth";
import { useRecentPayouts, timeAgo } from "@/lib/useRecentPayouts";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const recentPayouts = useRecentPayouts();
  const [tickerIdx, setTickerIdx] = useState(0);

  useEffect(() => {
    if (recentPayouts.length < 2) return;
    const t = setInterval(() => setTickerIdx((i) => (i + 1) % recentPayouts.length), 3500);
    return () => clearInterval(t);
  }, [recentPayouts.length]);

  if (pathname.startsWith("/shorts")) return null;

  function handleUpload() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/auth/login");
    } else {
      router.push("/upload");
    }
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <header
      style={{
        background: "#000",
        borderBottom: "1px solid var(--border)",
      }}
      className="sticky top-0 z-50"
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link
          href="/"
          className="flex flex-row items-center leading-none"
          style={{
            color: "var(--card)",
            fontFamily: "var(--font-pretendard), sans-serif",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            gap: "8px",
          }}
        >
          <LogoIcon width={32} height={33}/>
          100:0 LAB
        </Link>

        <div className="flex-1" />

        <Link
          href="/shorts"
          className="px-3 py-1.5 text-sm"
          style={{ color: "var(--card)" }}
        >
          쇼츠
        </Link>

        <Link
          href="/map"
          className="px-3 py-1.5 text-sm"
          style={{ color: "var(--card)" }}
        >
          지도
        </Link>

        <button
          onClick={handleUpload}
          className="px-3 py-1.5 text-sm font-medium cursor-pointer"
          style={{
            border: "1px solid var(--border)",
            color: "var(--card)",
            background: "transparent",
          }}
        >
          + 업로드
        </button>

        {!loading && user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
          <Link
            href="/admin/submissions"
            className="px-3 py-1.5 text-xs font-medium"
            style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            관리자
          </Link>
        )}

        {!loading && (
          user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/my/submissions"
                className="text-xs px-2 py-1"
                style={{ color: "rgba(255,255,255,0.55)" }}
              >
                내 제보
              </Link>
              <Link
                href="/user/me"
                className="flex items-center gap-2 px-2 py-1 rounded-full transition-colors"
                style={{ color: "var(--card)" }}
              >
                {user.profile_image ? (
                  <Image
                    src={user.profile_image}
                    alt={user.nickname ?? "프로필"}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                    style={{ border: "1px solid rgba(255,255,255,0.2)" }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      width: 28,
                      height: 28,
                      background: "rgba(255,255,255,0.15)",
                      color: "#fff",
                    }}
                  >
                    {(user.nickname ?? user.email)[0].toUpperCase()}
                  </div>
                )}
                <span className="text-sm max-w-20 truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                  {user.nickname ?? user.email.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs px-2 py-1 cursor-pointer"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="px-3 py-1.5 text-sm"
              style={{ color: "var(--card)" }}
            >
              로그인
            </Link>
          )
        )}
      </div>

      {recentPayouts.length > 0 && (
        <div
          className="flex items-center justify-center gap-2 py-1 text-xs overflow-hidden"
          style={{ background: "#111", borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span style={{ color: "#10b981" }}>✓</span>
          <span style={{ color: "rgba(255,255,255,0.7)" }}>
            {recentPayouts[tickerIdx].region} · {recentPayouts[tickerIdx].amount.toLocaleString()}원 지급 완료
          </span>
          <span style={{ color: "rgba(255,255,255,0.3)" }}>{timeAgo(recentPayouts[tickerIdx].paid_at)}</span>
        </div>
      )}
    </header>
  );
}
