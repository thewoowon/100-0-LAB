"use client";

import { useRouter } from "next/navigation";

interface Props {
  onClose: () => void;
}

export default function LoginRequiredModal({ onClose }: Props) {
  const router = useRouter();

  function handleLogin() {
    router.push("/auth/login");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm p-6 flex flex-col gap-5"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            로그인이 필요한 서비스입니다
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            투표와 댓글은 로그인 후 이용할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleLogin}
            className="flex-1 py-2 text-sm font-medium"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            로그인
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm"
            style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
