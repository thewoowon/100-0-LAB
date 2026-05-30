"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  api,
  VideoDetail,
  VideoFeedItem,
  VoteResult,
  MyVote,
  TagListResponse,
  CaseStatusResponse,
  CommentItem,
  CommentListResponse,
} from "@/lib/api";
import type { MapPin } from "@/components/AccidentMap";
import Image from "next/image";

const AccidentMap = dynamic(() => import("@/components/AccidentMap"), {
  ssr: false,
  loading: () => (
    <div
      className="w-full h-40 rounded-lg flex items-center justify-center"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-4 h-4 border-2 rounded-full animate-spin"
        style={{ borderColor: "var(--border)", borderTopColor: "var(--text)" }}
      />
    </div>
  ),
});

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ??
  "http://localhost:8000";

const VOTE_OPTIONS = ["100:0", "90:10", "80:20", "70:30", "60:40", "50:50"];

const CASE_STATUS_ORDER = [
  "사고_발생",
  "경찰_신고접수",
  "보험사_협의중",
  "보험_처리완료",
  "조사_진행중",
  "검찰_송치",
  "재판_진행중",
  "판결_완료",
  "합의_완료",
];

const CASE_STATUS_LABEL: Record<string, string> = {
  사고_발생: "사고 발생",
  경찰_신고접수: "경찰 신고 접수",
  보험사_협의중: "보험사 협의 중",
  보험_처리완료: "보험 처리 완료",
  조사_진행중: "조사 진행 중",
  검찰_송치: "검찰 송치",
  재판_진행중: "재판 진행 중",
  판결_완료: "판결 완료",
  합의_완료: "합의 완료",
  알_수_없음: "알 수 없음",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isLoggedIn() {
  try {
    return !!localStorage.getItem("access_token");
  } catch {
    return false;
  }
}
function getCurrentUserId(): number | null {
  try {
    const raw = localStorage.getItem("user_id");
    return raw ? parseInt(raw) : null;
  } catch {
    return null;
  }
}

// ── 대시보드 패널 섹션 래퍼 ────────────────────────────────────────
function PanelSection({
  label,
  action,
  children,
}: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          {label}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [voteResult, setVoteResult] = useState<VoteResult | null>(null);
  const [myVote, setMyVote] = useState<MyVote | null>(null);
  const [tags, setTags] = useState<TagListResponse | null>(null);
  const [caseStatus, setCaseStatus] = useState<CaseStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [mapPin, setMapPin] = useState<MapPin | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedActualRatio, setSelectedActualRatio] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");

  const [relatedVideos, setRelatedVideos] = useState<VideoFeedItem[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isParty, setIsParty] = useState(false);
  const [partyRole, setPartyRole] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setCurrentUserId(getCurrentUserId());
  }, []);

  useEffect(() => {
    api
      .get<VideoDetail>(`/videos/${id}`)
      .then((v) => {
        setVideo(v);
        // 위치 있으면 geocoding
        if (v.filmed_location) {
          api
            .get<
              {
                lat: number | null;
                lng: number | null;
                filmed_location: string;
              }[]
            >(`/videos/locations`)
            .then((locs) => {
              const loc = locs.find(
                (l) => l.filmed_location === v.filmed_location
              );
              if (loc?.lat && loc?.lng) {
                setMapPin({
                  id: Number(id),
                  title: v.title,
                  lat: loc.lat,
                  lng: loc.lng,
                  thumbnail_url: v.thumbnail_url,
                  views: v.views,
                  filmed_location: v.filmed_location,
                });
              }
            })
            .catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
    api
      .get<VoteResult>(`/videos/${id}/votes`)
      .then(setVoteResult)
      .catch(() => {});
    api
      .get<TagListResponse>(`/videos/${id}/tags`)
      .then(setTags)
      .catch(() => {});
    api
      .get<CaseStatusResponse>(`/videos/${id}/case-status`)
      .then(setCaseStatus)
      .catch(() => {});
    api
      .get<CommentListResponse>(`/videos/${id}/comments`)
      .then((r) => setComments(r.comments))
      .catch(() => {});
    api
      .get<VideoFeedItem[]>(`/videos/${id}/related`)
      .then(setRelatedVideos)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!loggedIn) return;
    api
      .get<MyVote>(`/videos/${id}/votes/me`)
      .then(setMyVote)
      .catch(() => {});
  }, [id, loggedIn]);

  async function handleVote(ratio: string) {
    if (!loggedIn) return setShowLoginModal(true);
    setVoting(true);
    try {
      await api.post(`/videos/${id}/votes`, { ratio });
      const [result, mine] = await Promise.all([
        api.get<VoteResult>(`/videos/${id}/votes`),
        api.get<MyVote>(`/videos/${id}/votes/me`),
      ]);
      setVoteResult(result);
      setMyVote(mine);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "투표 실패");
    } finally {
      setVoting(false);
    }
  }

  async function handleAddTag() {
    if (!newTag.trim()) return;
    setAddingTag(true);
    const name = newTag.trim().startsWith("#")
      ? newTag.trim()
      : `#${newTag.trim()}`;
    try {
      await api.post(`/videos/${id}/tags`, { name });
      const result = await api.get<TagListResponse>(`/videos/${id}/tags`);
      setTags(result);
      setNewTag("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "태그 추가 실패");
    } finally {
      setAddingTag(false);
    }
  }

  async function handleDeleteTag(tagId: number) {
    try {
      await api.delete(`/videos/${id}/tags/${tagId}`);
      const result = await api.get<TagListResponse>(`/videos/${id}/tags`);
      setTags(result);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "태그 삭제 실패");
    }
  }

  async function handleStatusUpdate() {
    if (!selectedStatus) return;
    try {
      const result = await api.put<CaseStatusResponse>(
        `/videos/${id}/case-status`,
        {
          status: selectedStatus,
          actual_ratio: selectedActualRatio || null,
          resolution_note: resolutionNote || null,
        }
      );
      setCaseStatus(result);
      setEditingStatus(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "상태 업데이트 실패");
    }
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    if (!loggedIn) return setShowLoginModal(true);
    setSubmittingComment(true);
    try {
      await api.post<CommentItem>(`/videos/${id}/comments`, {
        content: commentText.trim(),
        is_party: isParty,
        party_role: isParty ? partyRole || null : null,
      });
      const result = await api.get<CommentListResponse>(
        `/videos/${id}/comments`
      );
      setComments(result.comments);
      setCommentText("");
      setIsParty(false);
      setPartyRole("");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "댓글 작성 실패");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await api.delete(`/videos/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    }
  }

  async function handleVerifyParty(commentId: number) {
    try {
      const updated = await api.post<CommentItem>(
        `/videos/${id}/comments/${commentId}/verify-party`,
        {}
      );
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? updated : c))
      );
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "인증 실패");
    }
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center py-40 text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        영상을 불러올 수 없습니다.
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center py-40">
        <div
          className="w-5 h-5 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--text)",
          }}
        />
      </div>
    );
  }

  const isOwner = currentUserId === video.user_id;
  const currentStatus = caseStatus?.status ?? "알_수_없음";
  const currentStatusIdx = CASE_STATUS_ORDER.indexOf(currentStatus);
  const dominantVote = voteResult?.options.reduce(
    (a, b) => (a.count > b.count ? a : b),
    { ratio: "—", count: 0, percentage: 0 }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {showLoginModal && <LoginRequiredModal onClose={() => setShowLoginModal(false)} />}
      {/* 2컬럼: 랩탑은 좌우, 태블릿 이하는 상하 */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ── 왼쪽: 영상 + 기본 정보 ──────────────────────────────── */}
        <div className="w-full lg:flex-1 min-w-0">
          {/* Result Reveal 배너 */}
          {caseStatus?.actual_ratio && (
            <div
              className="rounded-lg px-4 py-3 mb-4 flex items-center gap-3"
              style={{ background: "var(--text)", color: "var(--bg)" }}
            >
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-0.5">
                  공식 과실 비율 공개
                </div>
                <div className="text-2xl font-bold tracking-tight">
                  {caseStatus.actual_ratio}
                </div>
                {caseStatus.resolution_note && (
                  <div className="text-xs opacity-60 mt-0.5">
                    {caseStatus.resolution_note}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 플레이어 */}
          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video
              controls
              className="w-full h-full"
              src={video.video_url.startsWith("http") ? video.video_url : `${API_BASE}/${video.video_url}`}
              poster={
                video.thumbnail_url
                  ? (video.thumbnail_url.startsWith("http") ? video.thumbnail_url : `${API_BASE}/${video.thumbnail_url}`)
                  : undefined
              }
            />
          </div>

          {/* 태그 */}
          {tags && tags.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  {tag.name}
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="ml-0.5 opacity-40 hover:opacity-100 cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* 제목 */}
          <h1
            className="text-xl font-semibold mb-2"
            style={{ color: "var(--text)" }}
          >
            {video.title}
          </h1>

          {/* 메타 */}
          <div
            className="flex flex-wrap items-center gap-2 text-xs mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            <span>조회 {video.views.toLocaleString()}</span>
            <span>·</span>
            <span>{formatDate(video.created_at)}</span>
            {video.filmed_date && (
              <>
                <span>·</span>
                <span>촬영 {video.filmed_date}</span>
              </>
            )}
            {video.filmed_location && (
              <>
                <span>·</span>
                <span>{video.filmed_location}</span>
              </>
            )}
            <span>·</span>
            <Link
              href={`/user/${video.user_id}`}
              className="hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              업로더 #{video.user_id}
            </Link>
          </div>

          {/* 설명 */}
          {video.description && (
            <p
              className="text-sm whitespace-pre-wrap leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {video.description}
            </p>
          )}

          {/* 태그 추가 — 모바일/태블릿에서는 하단에 */}
          <div className="lg:hidden mt-6">
            <TagAddSection
              loggedIn={loggedIn}
              newTag={newTag}
              setNewTag={setNewTag}
              handleAddTag={handleAddTag}
              addingTag={addingTag}
            />
          </div>

          {/* ── 댓글 섹션 ────────────────────────────── */}
          <div className="mt-8">
            <h2
              className="text-sm font-semibold mb-4"
              style={{ color: "var(--text)" }}
            >
              댓글 {comments.length}
            </h2>

            {/* 작성 폼 */}
            {loggedIn ? (
              <div className="mb-6">
                {/* 당사자 등판 토글 */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => {
                      setIsParty(!isParty);
                      setPartyRole("");
                    }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all cursor-pointer font-medium"
                    style={{
                      background: isParty ? "var(--text)" : "var(--card)",
                      color: isParty ? "var(--bg)" : "var(--text-muted)",
                      border: `1px solid ${
                        isParty ? "var(--text)" : "var(--border)"
                      }`,
                    }}
                  >
                    <span>{isParty ? "⚡" : "👤"}</span>
                    {isParty ? "당사자로 댓글 작성 중" : "당사자입니까?"}
                  </button>
                  {isParty && (
                    <div className="flex gap-1">
                      {["가해자", "피해자", "목격자"].map((role) => (
                        <button
                          key={role}
                          onClick={() => setPartyRole(role)}
                          className="text-xs px-2.5 py-1 rounded-full cursor-pointer transition-all"
                          style={{
                            background:
                              partyRole === role
                                ? "var(--text)"
                                : "var(--card)",
                            color:
                              partyRole === role
                                ? "var(--bg)"
                                : "var(--text-muted)",
                            border: `1px solid ${
                              partyRole === role
                                ? "var(--text)"
                                : "var(--border)"
                            }`,
                          }}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 items-end">
                  <textarea
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitComment();
                      }
                    }}
                    placeholder={
                      isParty
                        ? "당사자 입장에서 상황을 설명해주세요..."
                        : "댓글을 입력하세요..."
                    }
                    rows={2}
                    className="flex-1 text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
                    style={{
                      background: "var(--card)",
                      border: `1.5px solid ${
                        isParty ? "var(--text)" : "var(--border)"
                      }`,
                      color: "var(--text)",
                      minHeight: 60,
                      maxHeight: 160,
                    }}
                  />
                  <button
                    onClick={handleSubmitComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="text-xs px-3 py-2.5 rounded-lg cursor-pointer disabled:opacity-40 font-medium shrink-0"
                    style={{ background: "var(--text)", color: "var(--bg)" }}
                  >
                    {submittingComment ? "..." : "등록"}
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="text-xs mb-6"
                style={{ color: "var(--text-muted)" }}
              >
                <Link href="/auth/login" className="underline">
                  로그인
                </Link>
                하면 댓글을 작성할 수 있습니다.
              </p>
            )}

            {/* 댓글 목록 */}
            <div className="space-y-4">
              {comments.length === 0 && (
                <p
                  className="text-sm py-6 text-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  첫 번째 댓글을 남겨보세요
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3">
                  {/* 아바타 */}
                  <div
                    className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold overflow-hidden"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {c.profile_image ? (
                      <Image
                        src={c.profile_image}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (c.nickname?.[0] ?? "?").toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 헤더 */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--text)" }}
                      >
                        {c.nickname ?? `사용자 #${c.user_id}`}
                      </span>

                      {/* 당사자 배지 */}
                      {c.is_party && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{
                            background: c.party_verified
                              ? "var(--text)"
                              : "var(--card)",
                            color: c.party_verified
                              ? "var(--bg)"
                              : "var(--text-muted)",
                            border: `1px solid ${
                              c.party_verified ? "var(--text)" : "var(--border)"
                            }`,
                          }}
                        >
                          {c.party_verified ? "⚡" : "👤"}{" "}
                          {c.party_role ?? "당사자"}
                          {c.party_verified && " 인증됨"}
                        </span>
                      )}

                      {/* 업로더 인증 버튼 */}
                      {isOwner && c.is_party && !c.party_verified && (
                        <button
                          onClick={() => handleVerifyParty(c.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer hover:opacity-80"
                          style={{
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          인증
                        </button>
                      )}

                      <span
                        className="text-[11px]"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(c.created_at).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      {/* 삭제 */}
                      {(currentUserId === c.user_id || isOwner) && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="text-[11px] opacity-30 hover:opacity-70 cursor-pointer ml-auto"
                          style={{ color: "var(--text-muted)" }}
                        >
                          삭제
                        </button>
                      )}
                    </div>

                    <p
                      className="text-sm whitespace-pre-wrap leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {c.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 오른쪽: 대시보드 패널 ────────────────────────────────── */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-3">
          {/* 사건 현황 요약 카드 */}
          <div
            className="rounded-lg p-4"
            style={{ background: "var(--text)", color: "var(--bg)" }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-widest opacity-50 mb-2">
              사건 현황
            </div>
            <div className="text-2xl font-bold mb-1">
              {CASE_STATUS_LABEL[currentStatus]}
            </div>
            {caseStatus?.actual_ratio ? (
              <div className="text-sm opacity-70">
                공식 과실 비율{" "}
                <span className="font-bold opacity-100">
                  {caseStatus.actual_ratio}
                </span>
                {caseStatus.resolution_note && (
                  <span className="opacity-50">
                    {" "}
                    · {caseStatus.resolution_note}
                  </span>
                )}
              </div>
            ) : voteResult && voteResult.total > 0 ? (
              <div className="text-sm opacity-60">
                시민 {voteResult.total}명 중{" "}
                {dominantVote?.percentage.toFixed(0)}%가{" "}
                <span className="font-semibold opacity-90">
                  {dominantVote?.ratio}
                </span>{" "}
                과실 판단
              </div>
            ) : null}
          </div>

          {/* 과실 투표 */}
          <PanelSection
            label="과실 비율 투표"
            action={
              voteResult && voteResult.total > 0 ? (
                <span
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {voteResult.total}명 참여
                </span>
              ) : undefined
            }
          >
            {/* 투표 버튼 */}
            <div className="grid grid-cols-3 gap-1.5 mb-4">
              {VOTE_OPTIONS.map((ratio) => {
                const isMyVote = myVote?.ratio === ratio;
                return (
                  <button
                    key={ratio}
                    onClick={() => handleVote(ratio)}
                    disabled={voting}
                    className="py-1.5 text-xs font-medium rounded transition-all cursor-pointer disabled:opacity-50"
                    style={{
                      background: isMyVote ? "var(--text)" : "transparent",
                      color: isMyVote ? "var(--bg)" : "var(--text-muted)",
                      border: `1px solid ${
                        isMyVote ? "var(--text)" : "var(--border)"
                      }`,
                    }}
                  >
                    {ratio}
                  </button>
                );
              })}
            </div>

            {/* 결과 바 */}
            {voteResult && voteResult.total > 0 ? (
              <div className="space-y-2">
                {voteResult.options
                  .filter((o) => o.count > 0)
                  .sort((a, b) => b.count - a.count)
                  .map((opt) => {
                    const isWinner = opt === dominantVote;
                    return (
                      <div key={opt.ratio}>
                        <div
                          className="flex justify-between text-[11px] mb-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          <span
                            style={{
                              color: isWinner ? "var(--text)" : undefined,
                              fontWeight: isWinner ? 600 : 400,
                            }}
                          >
                            {opt.ratio}
                          </span>
                          <span>{opt.percentage.toFixed(1)}%</span>
                        </div>
                        <div
                          className="w-full h-1 rounded-full overflow-hidden"
                          style={{ background: "var(--border)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${opt.percentage}%`,
                              background: "var(--text)",
                              opacity: isWinner ? 1 : 0.4,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p
                className="text-xs text-center py-2"
                style={{ color: "var(--text-muted)" }}
              >
                첫 번째로 투표해보세요
              </p>
            )}
          </PanelSection>

          {/* 사건 진행 상태 */}
          <PanelSection
            label="사건 진행"
            action={
              isOwner && !editingStatus ? (
                <button
                  onClick={() => {
                    setSelectedStatus(currentStatus);
                    setSelectedActualRatio(caseStatus?.actual_ratio ?? "");
                    setResolutionNote(caseStatus?.resolution_note ?? "");
                    setEditingStatus(true);
                  }}
                  className="text-[11px] cursor-pointer hover:underline"
                  style={{ color: "var(--text-muted)" }}
                >
                  수정
                </button>
              ) : undefined
            }
          >
            {editingStatus ? (
              <div className="flex flex-col gap-2">
                <label
                  className="text-[11px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  사건 진행 단계
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded border outline-none w-full"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  {[...CASE_STATUS_ORDER, "합의_완료", "알_수_없음"].map(
                    (s) => (
                      <option key={s} value={s}>
                        {CASE_STATUS_LABEL[s]}
                      </option>
                    )
                  )}
                </select>

                <label
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  공식 과실 비율{" "}
                  <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                    (결과 공개)
                  </span>
                </label>
                <select
                  value={selectedActualRatio}
                  onChange={(e) => setSelectedActualRatio(e.target.value)}
                  className="text-xs px-2 py-1.5 rounded border outline-none w-full"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                >
                  <option value="">미공개</option>
                  {VOTE_OPTIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <label
                  className="text-[11px] mt-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  결론 메모 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 보험사 합의로 종결"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="text-xs px-2.5 py-1.5 rounded outline-none w-full"
                  style={{
                    background: "var(--bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                  }}
                />

                <div className="flex gap-2 mt-1">
                  <button
                    onClick={handleStatusUpdate}
                    className="flex-1 text-xs py-1.5 rounded cursor-pointer font-medium"
                    style={{ background: "var(--text)", color: "var(--bg)" }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setEditingStatus(false)}
                    className="flex-1 text-xs py-1.5 rounded cursor-pointer"
                    style={{
                      border: "1px solid var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {CASE_STATUS_ORDER.map((status, idx) => {
                  const isPast = idx < currentStatusIdx;
                  const isCurrent = idx === currentStatusIdx;
                  const isFuture = idx > currentStatusIdx;
                  return (
                    <div key={status} className="flex items-center gap-2.5">
                      <div
                        className="flex flex-col items-center"
                        style={{ width: 12 }}
                      >
                        <div
                          className="rounded-full shrink-0"
                          style={{
                            width: isCurrent ? 10 : 7,
                            height: isCurrent ? 10 : 7,
                            background: isFuture
                              ? "var(--border)"
                              : "var(--text)",
                            opacity: isPast ? 0.35 : 1,
                            outline: isCurrent
                              ? "2px solid var(--text)"
                              : "none",
                            outlineOffset: 2,
                          }}
                        />
                        {idx < CASE_STATUS_ORDER.length - 1 && (
                          <div
                            style={{
                              width: 1,
                              height: 10,
                              background: isPast
                                ? "var(--text)"
                                : "var(--border)",
                              opacity: isPast ? 0.25 : 1,
                            }}
                          />
                        )}
                      </div>
                      <span
                        className="text-xs"
                        style={{
                          color: isFuture ? "var(--text-muted)" : "var(--text)",
                          fontWeight: isCurrent ? 600 : 400,
                          opacity: isPast ? 0.45 : 1,
                        }}
                      >
                        {CASE_STATUS_LABEL[status]}
                      </span>
                    </div>
                  );
                })}
                {currentStatus === "알_수_없음" && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    진행 상태 정보 없음
                  </p>
                )}
              </div>
            )}
          </PanelSection>

          {/* 사고 위치 지도 */}
          {(mapPin || video.filmed_location) && (
            <PanelSection label="사고 위치">
              {mapPin ? (
                <div style={{ height: 180 }}>
                  <AccidentMap
                    pins={[mapPin]}
                    height="180px"
                    singlePin
                    zoom={14}
                  />
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {video.filmed_location}
                </p>
              )}
            </PanelSection>
          )}

          {/* 연관 영상 */}
          {relatedVideos.length > 0 && (
            <PanelSection label="연관 영상">
              <div className="space-y-2">
                {relatedVideos.map((v) => (
                  <Link key={v.id} href={`/video/${v.id}`} className="flex gap-2.5 group">
                    <div className="relative w-20 h-12 rounded overflow-hidden shrink-0 bg-neutral-100">
                      {v.thumbnail_url && (
                        <Image src={v.thumbnail_url} alt={v.title} fill className="object-cover group-hover:opacity-75 transition-opacity" unoptimized />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 leading-snug" style={{ color: "var(--text)" }}>{v.title}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>조회 {v.views.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </PanelSection>
          )}

          {/* 태그 추가 — 데스크탑만 */}
          <div className="hidden lg:block">
            <PanelSection label="사고 태그">
              <TagAddSection
                loggedIn={loggedIn}
                newTag={newTag}
                setNewTag={setNewTag}
                handleAddTag={handleAddTag}
                addingTag={addingTag}
              />
            </PanelSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function TagAddSection({
  loggedIn,
  newTag,
  setNewTag,
  handleAddTag,
  addingTag,
}: {
  loggedIn: boolean;
  newTag: string;
  setNewTag: (v: string) => void;
  handleAddTag: () => void;
  addingTag: boolean;
}) {
  if (!loggedIn) {
    return (
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        <Link href="/auth/login" className="underline">
          로그인
        </Link>
        하면 태그를 추가할 수 있습니다.
      </p>
    );
  }
  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="#신호위반"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
        className="flex-1 text-xs px-2.5 py-1.5 rounded outline-none"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          color: "var(--text)",
        }}
      />
      <button
        onClick={handleAddTag}
        disabled={addingTag || !newTag.trim()}
        className="text-xs px-3 py-1.5 rounded cursor-pointer disabled:opacity-40 font-medium"
        style={{ background: "var(--text)", color: "var(--bg)" }}
      >
        추가
      </button>
    </div>
  );
}
