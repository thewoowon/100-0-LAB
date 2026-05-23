"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const STATUS_COLORS: Record<string, string> = {
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

const DECISION_OPTIONS = [
  { value: "APPROVE", label: "승인" },
  { value: "REJECT", label: "반려" },
  { value: "NEEDS_MORE_INFO", label: "추가 확인" },
  { value: "DUPLICATE", label: "중복" },
  { value: "RIGHTS_RISK", label: "권리 리스크" },
];

const REJECTION_TEMPLATES = [
  "영상 품질이 낮아 편집이 불가능합니다.",
  "촬영 각도로 인해 사고 상황이 명확하게 확인되지 않습니다.",
  "영상 내 사고 장면이 포함되어 있지 않습니다.",
  "1분을 초과하는 영상입니다.",
  "동일한 사고 영상이 이미 제출되어 있습니다.",
  "개인정보(얼굴·번호판 외) 처리가 불가능한 영상입니다.",
  "뉴스·방송에서 이미 공개된 영상으로 판단됩니다.",
  "저작권 또는 초상권 침해 우려가 있어 반려합니다.",
];

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const [decision, setDecision] = useState("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") { router.push("/"); return; }
    fetchSubmissions();
  }, [statusFilter, user, authLoading]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const url = statusFilter ? `/submissions/admin?status=${statusFilter}` : "/submissions/admin";
      const data = await api.get<Submission[]>(url);
      setSubmissions(data);
    } catch (e: unknown) {
      console.error("fetchSubmissions error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(submissionId: number) {
    setSubmitting(true);
    try {
      await api.post(`/submissions/admin/${submissionId}/review`, {
        decision,
        rejection_reason: rejectionReason || null,
        memo: memo || null,
      });
      setReviewTarget(null);
      setDecision("APPROVE");
      setRejectionReason("");
      setMemo("");
      fetchSubmissions();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "오류");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "6px 10px",
    fontSize: 13,
    outline: "none",
  };

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
            onClick={() => setStatusFilter(s)}
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
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{s.submission_no}</p>
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                    {s.title || s.incident_type} · {s.region_sido}
                  </p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.created_at).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{
                      background: STATUS_COLORS[s.status] ?? "var(--border)",
                      color: "#fff",
                    }}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  {["PENDING_REVIEW", "NEEDS_MORE_INFO"].includes(s.status) && (
                    <button
                      onClick={() => setReviewTarget(s.id)}
                      className="text-xs px-2 py-1"
                      style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                      검수
                    </button>
                  )}
                </div>
              </div>

              {reviewTarget === s.id && (
                <div className="mt-4 flex flex-col gap-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <select style={{ ...inputStyle, width: "100%" }} value={decision} onChange={(e) => setDecision(e.target.value)}>
                    {DECISION_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                  {decision === "REJECT" && (
                    <>
                      <select
                        style={{ ...inputStyle, width: "100%", cursor: "pointer" }}
                        value=""
                        onChange={(e) => { if (e.target.value) setRejectionReason(e.target.value); }}
                      >
                        <option value="">템플릿 선택 (선택 시 자동 입력)</option>
                        {REJECTION_TEMPLATES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      <input
                        style={{ ...inputStyle, width: "100%" }}
                        placeholder="반려 사유 (직접 입력 또는 위 템플릿 선택)"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </>
                  )}
                  <textarea
                    style={{ ...inputStyle, width: "100%", resize: "vertical", minHeight: 60 }}
                    placeholder="내부 메모 (선택)"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(s.id)}
                      disabled={submitting}
                      className="text-sm px-4 py-1.5 disabled:opacity-40"
                      style={{ background: "var(--text)", color: "var(--bg)" }}
                    >
                      {submitting ? "처리 중..." : "확인"}
                    </button>
                    <button
                      onClick={() => setReviewTarget(null)}
                      className="text-sm px-4 py-1.5"
                      style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
