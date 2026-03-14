"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Suspense } from "react";

function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      router.push("/auth/login");
      return;
    }

    api
      .post<{ access_token: string; refresh_token: string; user: { id: number } }>(
        "/auth/google",
        { code }
      )
      .then((data) => {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("user_id", String(data.user.id));
        router.push("/");
      })
      .catch((e) => {
        console.error("Google auth failed:", e);
        router.push("/auth/login");
      });
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div
        className="w-6 h-6 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--text)" }}
      />
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense>
      <GoogleCallbackInner />
    </Suspense>
  );
}
