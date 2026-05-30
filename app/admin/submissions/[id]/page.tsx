"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";

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

const DECISION_OPTIONS = [
  { value: "APPROVE", label: "승인" },
  { value: "REJECT", label: "반려" },
  { value: "NEEDS_MORE_INFO", label: "추가 확인 요청" },
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

interface AdminSubmission {
  id: number;
  submission_no: string;
  status: string;
  incident_type: string;
  region_sido: string;
  region_sigungu: string | null;
  approximate_address: string | null;
  title: string | null;
  description: string;
  user_id: number;
  rejection_reason: string | null;
  review_memo: string | null;
  video_id: number | null;
  created_at: string;
}

export default function AdminSubmissionDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const userRole = user?.role;

  const [submission, setSubmission] = useState<AdminSubmission | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [decision, setDecision] = useState("APPROVE");
  const [rejectionReason, setRejectionReason] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewDone, setReviewDone] = useState(false);

  // auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/auth/login"); return; }
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") { router.push("/"); return; }
  }, [user, userRole, authLoading, router]);

  // 데이터 로드
  useEffect(() => {
    if (authLoading || !userRole) return;
    if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") return;

    let active = true;

    Promise.all([
      api.get<AdminSubmission>(`/submissions/admin/${id}`),
      api.get<{ url: string }>(`/submissions/admin/${id}/video-url`).catch(() => null),
    ]).then(([sub, video]) => {
      if (!active) return;
      setSubmission(sub);
      if (video) setVideoUrl(video.url);
    }).catch((e) => console.error(e))
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id, userRole, authLoading]);

  async function handleReview() {
    if (!submission) return;
    setSubmitting(true);
    setReviewError(null);
    try {
      await api.post(`/submissions/admin/${submission.id}/review`, {
        decision,
        rejection_reason: rejectionReason || null,
        memo: memo || null,
      });
      const updated = await api.get<AdminSubmission>(`/submissions/admin/${submission.id}`);
      setSubmission(updated);
      setReviewDone(true);
    } catch (e: unknown) {
      setReviewError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "8px 12px",
    width: "100%",
    fontSize: 13,
    outline: "none",
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>불러오는 중...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>제출 내역을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const canReview = ["PENDING_REVIEW", "NEEDS_MORE_INFO"].includes(submission.status) && !reviewDone;
  const location = [submission.region_sido, submission.region_sigungu, submission.approximate_address]
    .filter(Boolean).join(" ");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => router.push("/admin/submissions")}
          className="text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          ← 목록
        </button>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>{submission.submission_no}</span>
        <span
          className="text-xs px-2 py-0.5"
          style={{ background: STATUS_COLORS[submission.status] ?? "var(--border)", color: "#fff" }}
        >
          {STATUS_LABELS[submission.status] ?? submission.status}
        </span>
      </div>

      {/* 영상 */}
      {videoUrl ? (
        <video
          src={videoUrl}
          controls
          className="w-full mb-6"
          style={{ background: "#000", maxHeight: 420 }}
        />
      ) : (
        <div
          className="mb-6 flex items-center justify-center h-40"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>영상을 불러올 수 없습니다.</p>
        </div>
      )}

      {/* 제출 정보 */}
      <div className="mb-6 p-4 flex flex-col gap-2.5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <InfoRow label="사고 유형" value={submission.incident_type} />
        <InfoRow label="지역" value={location || "-"} />
        {submission.title && <InfoRow label="제목" value={submission.title} />}
        <InfoRow label="상황 설명" value={submission.description} />
        <InfoRow label="접수일" value={new Date(submission.created_at).toLocaleString("ko-KR")} />
        {submission.rejection_reason && (
          <InfoRow label="반려 사유" value={submission.rejection_reason} highlight />
        )}
        {submission.review_memo && (
          <InfoRow label="내부 메모" value={submission.review_memo} />
        )}
      </div>

      {/* 검수 폼 */}
      {canReview && (
        <div className="p-4 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text)" }}>검수 결정</p>

          <select style={inputStyle} value={decision} onChange={(e) => setDecision(e.target.value)}>
            {DECISION_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>

          {decision === "REJECT" && (
            <>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value=""
                onChange={(e) => { if (e.target.value) setRejectionReason(e.target.value); }}
              >
                <option value="">템플릿 선택 (선택 시 자동 입력)</option>
                {REJECTION_TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                style={inputStyle}
                placeholder="반려 사유 (직접 입력 또는 위 템플릿 선택)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </>
          )}

          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 72 }}
            placeholder="내부 메모 (선택 — 제보자에게 표시되지 않음)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          {reviewError && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{reviewError}</p>
          )}

          <button
            onClick={handleReview}
            disabled={submitting}
            className="py-2.5 text-sm font-medium disabled:opacity-40"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            {submitting ? "처리 중..." : "검수 결정 제출"}
          </button>
        </div>
      )}

      {reviewDone && (
        <p className="text-sm mt-2" style={{ color: "#10b981" }}>
          검수 처리 완료 — 상태: {STATUS_LABELS[submission.status] ?? submission.status}
        </p>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex gap-4 items-start">
      <span className="text-xs w-20 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-xs flex-1" style={{ color: highlight ? "#ef4444" : "var(--text)" }}>
        {value}
      </span>
    </div>
  );
}
