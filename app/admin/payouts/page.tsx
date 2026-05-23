"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const STATUS_LABELS: Record<string, string> = {
  PAYOUT_PENDING: "지급 대기",
  PAYOUT_PROCESSING: "처리 중",
  PAID: "지급 완료",
  PAYOUT_FAILED: "실패",
  PAYOUT_HOLD: "보류",
  CANCELLED: "취소",
};

const STATUS_COLORS: Record<string, string> = {
  PAYOUT_PENDING: "#f59e0b",
  PAID: "#10b981",
  PAYOUT_FAILED: "#ef4444",
  PAYOUT_HOLD: "#6b7280",
};

interface Payout {
  id: number;
  submission_id: number;
  amount: number;
  currency: string;
  status: string;
  approved_at: string | null;
  paid_at: string | null;
  payment_reference: string | null;
  memo: string | null;
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [markTarget, setMarkTarget] = useState<number | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { router.push("/auth/login"); return; }
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    setLoading(true);
    try {
      const data = await api.get<Payout[]>("/submissions/admin/payouts");
      setPayouts(data);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid(payoutId: number) {
    setSubmitting(true);
    try {
      await api.post(`/submissions/admin/payouts/${payoutId}/mark-paid`, {
        payment_reference: paymentReference || null,
        memo: memo || null,
      });
      setMarkTarget(null);
      setPaymentReference("");
      setMemo("");
      fetchPayouts();
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
    width: "100%",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold" style={{ color: "var(--text)" }}>지급 관리</h1>
        <button
          onClick={() => router.push("/admin/submissions")}
          className="text-sm px-3 py-1.5"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          ← 제출 관리
        </button>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>불러오는 중...</p>
      ) : payouts.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>지급 내역이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {payouts.map((p) => (
            <div key={p.id} className="p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>제출 #{p.submission_id}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {p.amount.toLocaleString()}원
                  </p>
                  {p.approved_at && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      승인: {new Date(p.approved_at).toLocaleString("ko-KR")}
                    </p>
                  )}
                  {p.paid_at && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      지급: {new Date(p.paid_at).toLocaleString("ko-KR")}
                    </p>
                  )}
                  {p.payment_reference && (
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>ref: {p.payment_reference}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs px-2 py-0.5"
                    style={{ background: STATUS_COLORS[p.status] ?? "var(--border)", color: "#fff" }}
                  >
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                  {p.status === "PAYOUT_PENDING" && (
                    <button
                      onClick={() => setMarkTarget(p.id)}
                      className="text-xs px-2 py-1"
                      style={{ border: "1px solid var(--border)", color: "var(--text)" }}
                    >
                      지급완료 처리
                    </button>
                  )}
                </div>
              </div>

              {markTarget === p.id && (
                <div className="mt-4 flex flex-col gap-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  <input
                    style={inputStyle}
                    placeholder="이체 레퍼런스 (예: manual-20260523-001)"
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                  />
                  <input
                    style={inputStyle}
                    placeholder="메모 (선택)"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkPaid(p.id)}
                      disabled={submitting}
                      className="text-sm px-4 py-1.5 disabled:opacity-40"
                      style={{ background: "var(--text)", color: "var(--bg)" }}
                    >
                      {submitting ? "처리 중..." : "지급완료 확인"}
                    </button>
                    <button
                      onClick={() => setMarkTarget(null)}
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
