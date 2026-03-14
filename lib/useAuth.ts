"use client";

import { useState, useEffect } from "react";
import { api } from "./api";

export interface AuthUser {
  id: number;
  email: string;
  nickname: string | null;
  profile_image: string | null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchMe() {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.get<AuthUser>("/users/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMe();

    // 다른 탭에서 로그인/로그아웃 시 동기화
    function onStorage(e: StorageEvent) {
      if (e.key === "access_token") fetchMe();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_id");
    setUser(null);
  }

  return { user, loading, logout, refetch: fetchMe };
}
