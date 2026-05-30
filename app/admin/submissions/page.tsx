"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/useAuth";

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: "검수 대기",
  APPROVED: "승인",
  REJECTED: "반려",
  DUPLICATE: "중복",
  RIGHTS_RISK: "권리 리스크",
  NEEDS_MORE_INFO: "추가 확인",
  PROCESSING_PRIVACY: "처리 중",
  PUBLISHED: "공개",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: "#f59e0b",
  APPROVED: "#10b981",
  REJECTED: "#ef4444",
  DUPLICATE: "#6b7280",
  RIGHTS_RISK: "#f97316",
  NEEDS_MORE_INFO: "#3b82f6",
};

interface Submission {
  id: number;
  submission_no: string;
  status: string;
  incident_type: string;
  region_sido: string;
  title: string | null;
  created_at: string;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // 원시값으로 추출 — 객체 참조 변경에 영향받지 않음
  const userRole = user?.role;

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  // Effect 1: auth 체크만. user/role 실제 변경 시에만 실행
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") { router.push("/"); return; }
  }, [user, userRole, authLoading, router]);

  // Effect 2: 데이터 페치만. statusFilter 변경 시 실행 (auth 재검사 없음)
  useEffect(() => {
    if (authLoading || !userRole) return;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return;

    let active = true;
    const url = statusFilter
      ? `/submissions/admin?status=${statusFilter}`
      : "/submissions/admin";

    api.get<Submission[]>(url)
      .then((data) => { if (active) setSubmissions(data); })
      .catch((e) => console.error("fetchSubmissions error:", e))
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [statusFilter, userRole, authLoading]);

  // setLoading(true)을 effect 내부가 아닌 이벤트 핸들러에서 호출
  function handleFilterChange(filter: string) {
    setLoading(true);
    setStatusFilter(filter);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>제출 관리</h1>
        <button
          onClick={() => router.push("/admin/payouts")}
          className="text-sm px-3 py-1.5"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          지급 관리 →
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {["", ...Object.keys(STATUS_LABELS)].map((s) => (
          <button
            key={s}
            onClick={() => handleFilterChange(s)}
            className="text-xs px-3 py-1"
            style={{
              background: statusFilter === s ? "var(--text)" : "var(--card)",
              color: statusFilter === s ? "var(--bg)" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
          >
            {s ? STATUS_LABELS[s] : "전체"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>불러오는 중...</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>제출 내역이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/admin/submissions/${s.id}`}
              className="block p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.submission_no}</p>
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                    {s.title || s.incident_type} · {s.region_sido}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
                <span
                  className="text-xs px-2 py-0.5 shrink-0"
                  style={{ background: STATUS_COLORS[s.status] ?? "var(--border)", color: "#fff" }}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
