const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail ?? res.statusText);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  postForm: <T>(path: string, form: FormData) =>
    request<T>(path, { method: "POST", body: form }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// 타입 정의
export interface VideoFeedItem {
  id: number;
  user_id: number;
  title: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
}

export interface VideoDetail {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  filmed_date: string | null;
  filmed_location: string | null;
  created_at: string;
}

export interface VideoFeedResponse {
  videos: VideoFeedItem[];
  next_cursor: number | null;
  has_more: boolean;
}

export interface UserProfile {
  id: number;
  email: string;
  nickname: string | null;
  profile_image: string | null;
  created_at: string;
}

// 투표
export interface VoteOption {
  ratio: string;
  count: number;
  percentage: number;
}

export interface VoteResult {
  total: number;
  options: VoteOption[];
}

export interface MyVote {
  ratio: string | null;
}

// 태그
export interface TagResponse {
  id: number;
  video_id: number;
  name: string;
  created_at: string;
}

export interface TagListResponse {
  tags: TagResponse[];
}

// 사건 진행 상태
export interface CaseStatusResponse {
  video_id: number;
  status: string;
  actual_ratio: string | null;
  resolution_note: string | null;
  updated_at: string | null;
}

// 댓글
export interface CommentItem {
  id: number;
  video_id: number;
  user_id: number;
  content: string;
  is_party: boolean;
  party_role: string | null;
  party_verified: boolean;
  created_at: string;
  nickname: string | null;
  profile_image: string | null;
}

export interface CommentListResponse {
  comments: CommentItem[];
  total: number;
}
