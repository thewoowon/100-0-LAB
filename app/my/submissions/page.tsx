"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "검수 대기",
  NEEDS_MORE_INFO: "추가 확인 요청",
  APPROVED: "채택",
  REJECTED: "반려",
  DUPLICATE: "중복",
  RIGHTS_RISK: "권리 검토 중",
  PROCESSING_PRIVACY: "비식별 처리 중",
  READY_TO_PUBLISH: "공개 준비",
  PUBLISHED: "공개됨",
  ARCHIVED: "보관",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "#f59e0b",
  NEEDS_MORE_INFO: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  DUPLICATE: "#6b7280",
  RIGHTS_RISK: "#f97316",
  PROCESSING_PRIVACY: "#8b5cf6",
  PUBLISHED: "#10b981",
};

interface Submission {
  id: number;
  submission_no: string;
  status: string;
  incident_type: string;
  region_sido: string;
  title: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export default function MySubmissionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    api.get<Submission[]>("/submissions/my")
      .then(setSubmissions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, authLoading, router]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--text)" }}>
        내 제보 내역
      </h1>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>불러오는 중...</p>
      ) : submissions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>제보한 영상이 없습니다.</p>
          <button
            onClick={() => router.push("/upload")}
            className="text-sm px-4 py-2"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            영상 제보하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <div key={s.id} className="p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.submission_no}</p>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                    {s.title || s.incident_type} · {s.region_sido}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.created_at).toLocaleDateString("ko-KR")}
                  </p>
                  {s.rejection_reason && (
                    <p className="text-xs mt-2 px-2 py-1" style={{ background: "#fee2e2", color: "#dc2626" }}>
                      반려 사유: {s.rejection_reason}
                    </p>
                  )}
                </div>
                <span
                  className="text-xs px-2 py-0.5 shrink-0"
                  style={{ background: STATUS_COLORS[s.status] ?? "var(--border)", color: "#fff" }}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
