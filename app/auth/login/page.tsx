"use client";

import { useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI ?? "http://localhost:3000/auth/callback/google";

export default function LoginPage() {
  const router = useRouter();

  function handleGoogle() {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-full max-w-sm p-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h1 className="text-lg font-semibold mb-1" style={{ color: "var(--text)" }}>
          로그인
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          100:0 LAB에 오신 걸 환영합니다
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogle}
            className="w-full py-3 text-sm font-medium cursor-pointer"
            style={{
              background: "var(--text)",
              color: "var(--bg)",
            }}
          >
            Google로 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}
