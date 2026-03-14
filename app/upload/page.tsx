"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, VideoDetail } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filmedDate, setFilmedDate] = useState("");
  const [filmedLocation, setFilmedLocation] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/auth/login");
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    if (description) form.append("description", description);
    if (filmedDate) form.append("filmed_date", filmedDate);
    if (filmedLocation) form.append("filmed_location", filmedLocation);

    setUploading(true);
    setError(null);
    try {
      const video = await api.postForm<VideoDetail>("/videos/upload", form);
      router.push(`/video/${video.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  const inputStyle = {
    background: "var(--card)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    padding: "8px 12px",
    width: "100%",
    fontSize: 14,
    outline: "none",
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-lg font-semibold mb-6" style={{ color: "var(--text)" }}>
        영상 업로드
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div
            className="flex items-center justify-center h-32 cursor-pointer"
            style={{ border: "1px dashed var(--border)", background: "var(--card)" }}
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <span className="text-sm" style={{ color: "var(--text)" }}>
                {file.name}
              </span>
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                mp4 / mov 파일 선택
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".mp4,.mov,video/mp4,video/quicktime"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <input
          style={inputStyle}
          placeholder="제목 *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="date"
          style={inputStyle}
          value={filmedDate}
          onChange={(e) => setFilmedDate(e.target.value)}
          placeholder="촬영 날짜 (선택)"
        />

        <input
          style={inputStyle}
          placeholder="촬영 위치 (선택)"
          value={filmedLocation}
          onChange={(e) => setFilmedLocation(e.target.value)}
        />

        {error && (
          <p className="text-sm" style={{ color: "#ff4444" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !file || !title.trim()}
          className="py-2.5 text-sm font-medium cursor-pointer disabled:opacity-40"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          {uploading ? "업로드 중..." : "업로드"}
        </button>
      </form>
    </div>
  );
}
