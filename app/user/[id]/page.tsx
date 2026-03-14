"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, UserProfile, VideoFeedItem } from "@/lib/api";
import Image from "next/image";

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

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [videos, setVideos] = useState<VideoFeedItem[]>([]);

  useEffect(() => {
    api.get<UserProfile>(`/users/${id}`).then(setUser).catch(console.error);
    api
      .get<VideoFeedItem[]>(`/users/${id}/videos`)
      .then(setVideos)
      .catch(console.error);
  }, [id]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-40">
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--text)",
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div
        className="flex items-center gap-4 pb-6 mb-6"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold"
          style={{ background: "var(--card)", color: "var(--text)" }}
        >
          {user.profile_image ? (
            <Image
              src={user.profile_image}
              alt={user.nickname ?? ""}
              className="w-full h-full object-cover"
            />
          ) : (
            (user.nickname ?? user.email)[0].toUpperCase()
          )}
        </div>
        <div>
          <p className="font-semibold" style={{ color: "var(--text)" }}>
            {user.nickname ?? user.email}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            가입 {formatDate(user.created_at)} · 영상 {videos.length}개
          </p>
        </div>
      </div>

      {videos.length === 0 ? (
        <p
          className="text-sm text-center py-12"
          style={{ color: "var(--text-muted)" }}
        >
          업로드한 영상이 없습니다
        </p>
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
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span
                        style={{ color: "var(--text-muted)", fontSize: 11 }}
                      >
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
                  <p
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
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
