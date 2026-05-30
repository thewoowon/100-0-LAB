"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const INCIDENT_TYPES = [
  "사고",
  "아찔한 상황",
  "난폭운전",
  "보복운전 의심",
  "주차/접촉",
  "기타",
];

const SIDO_LIST = [
  "서울",
  "부산",
  "대구",
  "인천",
  "광주",
  "대전",
  "울산",
  "세종",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

const AGREEMENTS = [
  {
    key: "is_original_owner",
    label: "[필수] 본인이 직접 촬영했거나 적법하게 제공할 권한을 보유하고 있습니다.",
  },
  {
    key: "is_rights_holder",
    label: "[필수] 해당 영상이 타인의 저작권·초상권·개인정보를 침해하지 않음을 보증합니다.",
  },
  {
    key: "commercial_use_agreed",
    label: "[필수] 100:0연구소가 영상을 편집·가공·블러 처리·게시·홍보 목적으로 이용하는 것에 동의합니다.",
    link: { href: "/policy/terms", text: "이용약관 보기" },
  },
  {
    key: "edit_and_blur_agreed",
    label: "[필수] 영상 내 개인정보 보호를 위한 비식별 처리에 동의합니다.",
  },
  {
    key: "warranty_agreed",
    label: "[필수] 허위 제출 또는 권리 침해로 인한 분쟁 발생 시 본인에게 책임이 있음을 확인합니다.",
  },
  {
    key: "privacy_policy_agreed",
    label: "[필수] 개인정보 수집 및 이용에 동의합니다.",
    link: { href: "/policy/privacy", text: "개인정보처리방침 보기" },
  },
  {
    key: "reward_policy_confirmed",
    label: "[필수] 검수 후 채택된 영상에 한해 건당 5,000원이 지급됨을 확인합니다.",
  },
];

type AgreementKeys =
  | "is_original_owner"
  | "is_rights_holder"
  | "commercial_use_agreed"
  | "edit_and_blur_agreed"
  | "warranty_agreed"
  | "privacy_policy_agreed"
  | "reward_policy_confirmed";

export default function UploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [regionSido, setRegionSido] = useState("");
  const [regionSigungu, setRegionSigungu] = useState("");
  const [approximateAddress, setApproximateAddress] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [agreements, setAgreements] = useState<Record<AgreementKeys, boolean>>({
    is_original_owner: false,
    is_rights_holder: false,
    commercial_use_agreed: false,
    edit_and_blur_agreed: false,
    warranty_agreed: false,
    privacy_policy_agreed: false,
    reward_policy_confirmed: false,
  });
  const [allChecked, setAllChecked] = useState(false);
  const [durationError, setDurationError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ submissionNo: string } | null>(
    null
  );

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      router.push("/auth/login");
    }
  }, [router]);

  function handleFileChange(selected: File | null) {
    setFile(selected);
    setDurationError(null);
    if (!selected) return;
    const url = URL.createObjectURL(selected);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      if (video.duration > 60) {
        setDurationError(
          `영상 길이가 ${Math.round(
            video.duration
          )}초입니다. 1분 이하 영상만 제출할 수 있습니다.`
        );
        setFile(null);
      }
    };
    video.src = url;
  }

  function toggleAll() {
    const next = !allChecked;
    setAllChecked(next);
    setAgreements(
      Object.fromEntries(AGREEMENTS.map((a) => [a.key, next])) as Record<
        AgreementKeys,
        boolean
      >
    );
  }

  function toggleOne(key: AgreementKeys) {
    const next = { ...agreements, [key]: !agreements[key] };
    setAgreements(next);
    setAllChecked(Object.values(next).every(Boolean));
  }

  const allAgreed = Object.values(agreements).every(Boolean);
  const canSubmit =
    file &&
    description.trim() &&
    incidentType &&
    regionSido &&
    bankName &&
    accountNumber &&
    accountHolder &&
    allAgreed;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canSubmit) return;

    const token = localStorage.getItem("access_token");
    const form = new FormData();
    form.append("video_file", file!);
    if (title) form.append("title", title);
    form.append("description", description);
    form.append("incident_type", incidentType);
    form.append("region_sido", regionSido);
    if (regionSigungu) form.append("region_sigungu", regionSigungu);
    if (approximateAddress)
      form.append("approximate_address", approximateAddress);
    form.append("bank_name", bankName);
    form.append("account_number", accountNumber);
    form.append("account_holder", accountHolder);
    Object.entries(agreements).forEach(([k, v]) => form.append(k, String(v)));

    setUploading(true);
    setError(null);
    try {
      const BASE_URL =
        process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
      const res = await fetch(`${BASE_URL}/submissions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "제출 실패" }));
        throw new Error(err.detail ?? "제출 실패");
      }
      const data = await res.json();
      setSubmitted({ submissionNo: data.submission_no });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "제출 실패");
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

  const selectStyle = { ...inputStyle, cursor: "pointer" };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h1
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--text)" }}
        >
          접수 완료
        </h1>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          접수번호:{" "}
          <span style={{ color: "var(--text)" }}>{submitted.submissionNo}</span>
        </p>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          운영팀 검수 후 채택 여부가 결정됩니다.
          <br />
          채택된 영상은 입력하신 계좌로 건당 5,000원이 지급됩니다.
        </p>
        <button
          onClick={() => router.push("/")}
          className="py-2.5 px-6 text-sm font-medium"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div
        className="mb-6 p-4 text-sm"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--text-muted)",
        }}
      >
        블랙박스 영상을 제보해주세요. 운영팀 검수 후 채택 시 영상 1건당{" "}
        <span style={{ color: "var(--text)", fontWeight: 600 }}>5,000원</span>을
        지급합니다.
        <br />
        업로드 즉시 지급되는 것이 아니며, 검수 후 채택된 영상만 지급됩니다.
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* 영상 파일 */}
        <section>
          <p
            className="text-xs font-medium mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            영상 파일 *
          </p>
          <div
            className="flex items-center justify-center h-28 cursor-pointer"
            style={{
              border: "1px dashed var(--border)",
              background: "var(--card)",
            }}
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <span className="text-sm" style={{ color: "var(--text)" }}>
                {file.name}
              </span>
            ) : (
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                mp4 / mov 파일 선택 (최대 300MB)
              </span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".mp4,.mov,video/mp4,video/quicktime,video/webm"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
          {durationError && (
            <p className="text-sm mt-1" style={{ color: "#ff4444" }}>
              {durationError}
            </p>
          )}
        </section>

        {/* 영상 정보 */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            영상 정보
          </p>
          <input
            style={inputStyle}
            placeholder="제목 (선택)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
            placeholder="상황 설명 *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <select
            style={selectStyle}
            value={incidentType}
            onChange={(e) => setIncidentType(e.target.value)}
            required
          >
            <option value="">사고 유형 선택 *</option>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </section>

        {/* 위치 정보 */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            위치 정보
          </p>
          <select
            style={selectStyle}
            value={regionSido}
            onChange={(e) => setRegionSido(e.target.value)}
            required
          >
            <option value="">시/도 선택 *</option>
            {SIDO_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <input
            style={inputStyle}
            placeholder="시/군/구 (선택)"
            value={regionSigungu}
            onChange={(e) => setRegionSigungu(e.target.value)}
          />
          <input
            style={inputStyle}
            placeholder="대략적인 주소 (선택)"
            value={approximateAddress}
            onChange={(e) => setApproximateAddress(e.target.value)}
          />
        </section>

        {/* 지급 계좌 */}
        <section className="flex flex-col gap-3">
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            지급 계좌 *
          </p>
          <input
            style={inputStyle}
            placeholder="은행명 (예: 국민은행)"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            placeholder="계좌번호"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            placeholder="예금주"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            required
          />
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            계좌정보는 채택 시 보상 지급 목적으로만 사용됩니다.
          </p>
        </section>

        {/* 권리 동의 */}
        <section>
          <p
            className="text-xs font-medium mb-2"
            style={{ color: "var(--text-muted)" }}
          >
            권리 동의 *
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAll}
                className="mt-0.5"
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--text)" }}
              >
                전체 동의
              </span>
            </label>
            <div
              style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}
              className="flex flex-col gap-2"
            >
              {AGREEMENTS.map((a) => (
                <label
                  key={a.key}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={agreements[a.key as AgreementKeys]}
                    onChange={() => toggleOne(a.key as AgreementKeys)}
                    className="mt-0.5"
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {a.label}
                    {"link" in a && a.link && (
                      <Link
                        href={a.link.href}
                        target="_blank"
                        className="ml-1.5 underline"
                        style={{ color: "var(--text-muted)" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {a.link.text}
                      </Link>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <p className="text-sm" style={{ color: "#ff4444" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={uploading || !canSubmit}
          className="py-2.5 text-sm font-medium cursor-pointer disabled:opacity-40"
          style={{ background: "var(--text)", color: "var(--bg)" }}
        >
          {uploading ? "제출 중..." : "제보 제출"}
        </button>
      </form>
    </div>
  );
}
