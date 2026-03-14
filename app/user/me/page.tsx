"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api, VideoFeedItem } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function MyProfilePage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [videos, setVideos] = useState<VideoFeedItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get<VideoFeedItem[]>(`/users/${user.id}/videos`)
      .then(setVideos)
      .catch(console.error)
      .finally(() => setVideosLoading(false));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center py-40">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--text)" }}
        />
      </div>
    );
  }

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* 프로필 헤더 */}
      <div
        className="flex items-center justify-between pb-6 mb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold flex-shrink-0"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            {user.profile_image ? (
              <Image
                src={user.profile_image}
                alt={user.nickname ?? ""}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              (user.nickname ?? user.email)[0].toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold text-lg" style={{ color: "var(--text)" }}>
              {user.nickname ?? user.email.split("@")[0]}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {user.email}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              영상 {videos.length}개
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-sm px-4 py-2 cursor-pointer"
          style={{
            border: "1px solid var(--border)",
            color: "var(--text-muted)",
            background: "transparent",
          }}
        >
          로그아웃
        </button>
      </div>

      {/* 업로드한 영상 */}
      <p className="text-sm font-medium mb-4" style={{ color: "var(--text)" }}>
        업로드한 영상
      </p>

      {videosLoading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: "var(--border)", borderTopColor: "var(--text)" }}
          />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
            아직 업로드한 영상이 없어요
          </p>
          <Link
            href="/upload"
            className="text-sm px-4 py-2 inline-block"
            style={{
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            첫 영상 업로드하기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {videos.map((v) => (
            <Link key={v.id} href={`/video/${v.id}`} className="block group">
              <div
                className="overflow-hidden"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="aspect-video" style={{ background: "#1a1a1a" }}>
                  {v.thumbnail_url ? (
                    <Image
                      src={`${API_BASE}/${v.thumbnail_url}`}
                      alt={v.title}
                      width={400}
                      height={225}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
                        No thumbnail
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p
                    className="text-xs font-medium line-clamp-2"
                    style={{ color: "var(--text)" }}
                  >
                    {v.title}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    조회 {v.views.toLocaleString()}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
