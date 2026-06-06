import { useEffect, useState } from "react";
import { api } from "./api";

export interface RecentPayout {
  region: string;
  amount: number;
  paid_at: string | null;
}

export function useRecentPayouts() {
  const [payouts, setPayouts] = useState<RecentPayout[]>([]);

  useEffect(() => {
    api.get<RecentPayout[]>("/submissions/recent-payouts").then(setPayouts).catch(() => {});
  }, []);

  return payouts;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "오늘";
  if (d === 1) return "어제";
  if (d < 8) return `${d}일 전`;
  return `${Math.floor(d / 7)}주 전`;
}
