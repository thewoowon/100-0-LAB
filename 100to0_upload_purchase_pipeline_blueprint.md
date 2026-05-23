# 100:0연구소 블랙박스 영상 업로드·매입·검수·정산 파이프라인 요구사항서

## 0. 프로젝트 개요

- 서비스명: 100:0연구소
- 도메인: www.100to0lab.com
- 현재 상태: 단순 MVP 배포 완료, 기본 업로드 기능 존재
- 이번 목표: 기존 업로드 기능을 “영상 매입 → 권리 동의 → 관리자 검수 → 승인 → 5,000원 정액 지급 → 비식별 처리 → 공개”의 완성형 운영 프로세스로 구조화한다.

본 문서는 Claude Code가 실제 구현을 진행할 수 있도록 기능 요구사항, 데이터 모델, 상태 전이, 화면 구조, API, 관리자 기능, 보안/개인정보 처리 기준을 상세히 정의한다.

---

## 1. 핵심 비즈니스 규칙

### 1.1 지급 정책

- 영상 1건당 지급 금액은 고정 5,000원이다.
- 단, “업로드 즉시 지급”이 아니라 “관리자 승인 후 지급”이어야 한다.
- 지급 조건:
  1. 사용자가 영상을 업로드한다.
  2. 필수 권리 동의 및 보증에 체크한다.
  3. 관리자 검수 대기 큐에 들어간다.
  4. 관리자가 채택/승인한다.
  5. 승인된 영상만 지급 대상이 된다.
  6. 지급 처리 후 지급 상태를 기록한다.

### 1.2 지급 기준 문구

사용자에게 반드시 아래 취지를 명확히 노출한다.

> 영상 업로드만으로 보상이 지급되는 것은 아닙니다.  
> 100:0연구소 운영팀의 검수 후 채택된 영상에 한해 건당 5,000원의 보상이 지급됩니다.

### 1.3 권리 확보 원칙

사용자는 업로드 시 다음을 보증해야 한다.

- 본인이 직접 촬영한 영상임.
- 해당 영상에 대한 적법한 이용 권한을 보유함.
- 타인의 영상을 무단으로 가져온 것이 아님.
- 100:0연구소가 영상을 편집, 가공, 블러 처리, 게시, 서비스 운영 및 홍보 목적으로 사용할 수 있음.
- 허위 제출 또는 권리 침해 발생 시 제출자 본인이 책임을 부담함.

### 1.4 공개 기준

- 승인된 영상이라도 바로 공개하지 않는다.
- 얼굴, 차량번호, 음성, 위치정보 등 개인정보/식별 가능 정보 처리 후 공개한다.
- 지도 위치는 실제 좌표가 아니라 노이즈가 적용된 대략 위치만 사용한다.
- 시간 정보는 공개하지 않는다.

---

## 2. 전체 사용자 플로우

### STEP 1. 커뮤니티/외부 유입

사용자는 커뮤니티, SNS, 검색, 직접 방문 등을 통해 업로드 페이지로 들어온다.

예상 유입 문구:

> 직접 촬영한 블랙박스 영상을 제보해주세요.  
> 검수 후 채택 시 영상 1건당 5,000원을 지급합니다.

### STEP 2. 업로드 페이지 진입

권장 라우트:

```txt
/upload
/upload/blackbox
/submit
```

업로드 페이지에서 아래 내용을 명확히 보여준다.

- 채택 시 5,000원 지급
- 업로드 즉시 지급 아님
- 직접 촬영 영상만 가능
- 얼굴/차량번호 등 개인정보는 블러 처리
- 관리자 검수 후 공개
- 권리 침해 영상은 반려될 수 있음

### STEP 3. 영상 파일 업로드

필수 입력값:

- 영상 파일
- 영상 제목 또는 간단 설명
- 사고/상황 유형
- 대략적인 발생 위치
- 촬영자 본인 여부
- 직접 촬영 여부
- 권리 보유 여부
- 연락처
- 지급 계좌 정보

권장 영상 제한:

- 길이: 최대 1분
- 파일 형식: mp4, mov, webm 우선
- 파일 크기: MVP 기준 300MB 이하 권장
- 해상도: 제한하지 않되, 너무 저화질은 반려 가능

### STEP 4. 권리 동의/전자계약

업로드 제출 직전에 전자 동의 섹션을 둔다.

필수 체크박스:

```txt
[필수] 본인은 해당 영상을 직접 촬영했거나, 적법하게 제공할 권한을 보유하고 있습니다.
[필수] 본인은 해당 영상이 타인의 저작권, 초상권, 개인정보, 기타 권리를 침해하지 않음을 보증합니다.
[필수] 본인은 100:0연구소가 해당 영상을 서비스 내 게시, 편집, 가공, 블러 처리, 배포, 홍보 목적으로 이용하는 것에 동의합니다.
[필수] 본인은 허위 제출 또는 권리 침해로 인한 분쟁 발생 시 본인에게 책임이 있음을 확인합니다.
[필수] 업로드한 영상은 운영팀 검수 후 채택된 경우에만 5,000원이 지급됨을 확인합니다.
[필수] 개인정보 수집 및 이용에 동의합니다.
```

선택 체크박스:

```txt
[선택] 향후 추가 영상 제보 또는 이벤트 안내를 받겠습니다.
```

전자 동의 로그로 반드시 저장할 값:

- user_id 또는 submitter_id
- submission_id
- agreement_version
- agreed_at
- ip_address
- user_agent
- checked_items
- uploaded_file_hash
- seller_name
- seller_contact
- payout_account_id

### STEP 5. 제출 완료 및 큐 진입

사용자에게 제출 완료 화면을 보여준다.

문구 예시:

> 영상 제보가 접수되었습니다.  
> 운영팀 검수 후 채택 여부가 결정됩니다.  
> 채택 시 입력하신 계좌로 건당 5,000원이 지급됩니다.

제출 후 상태:

```txt
PENDING_REVIEW
```

### STEP 6. 관리자 검수

관리자는 Admin 페이지에서 제출된 영상을 검수한다.

검수 항목:

- 영상 재생 가능 여부
- 1분 이하 여부
- 중복 제출 여부
- 도용 의심 여부
- 유튜브/뉴스/방송 캡처 의심 여부
- 직접 촬영 가능성
- 개인정보 블러 처리 필요 수준
- 지도 표시 가능 여부
- 공개 부적합 여부
- 지급 대상 여부

관리자 결정:

- 승인
- 반려
- 추가 확인 필요
- 보류
- 중복 처리
- 권리 리스크 있음
- 공개 불가, 내부 폐기

### STEP 7. 승인 후 지급

승인 시:

- submission status: APPROVED
- payout status: PAYOUT_PENDING 생성
- 지급 금액: 5,000원
- 지급 방식:
  - MVP 1차: 관리자 수동 송금 후 “지급완료” 버튼
  - 확장 2차: 지급 API 연동

지급 완료 시:

- payout status: PAID
- paid_at 기록
- 지급 담당자 admin_id 기록
- 지급 메모 기록
- 가능하면 이체확인증 또는 내부 reference id 기록

### STEP 8. 비식별 처리 및 공개

승인된 영상은 공개 전 처리 큐로 이동한다.

처리 항목:

- 얼굴 블러
- 차량번호 블러
- 음성 제거 또는 변조
- GPS/EXIF/메타데이터 제거
- 원본 위치 좌표 노이즈 적용
- 공개용 위치만 저장
- 시간 정보 비공개

공개 상태:

```txt
PROCESSING_PRIVACY
READY_TO_PUBLISH
PUBLISHED
```

---

## 3. 상태 머신 정의

### 3.1 Submission 상태

```txt
DRAFT
SUBMITTED
PENDING_REVIEW
NEEDS_MORE_INFO
APPROVED
REJECTED
DUPLICATE
RIGHTS_RISK
PROCESSING_PRIVACY
READY_TO_PUBLISH
PUBLISHED
ARCHIVED
DELETED
```

### 3.2 Payout 상태

```txt
NOT_ELIGIBLE
PAYOUT_PENDING
PAYOUT_PROCESSING
PAID
PAYOUT_FAILED
PAYOUT_HOLD
CANCELLED
```

### 3.3 상태 전이

```txt
DRAFT
  -> SUBMITTED
  -> PENDING_REVIEW

PENDING_REVIEW
  -> APPROVED
  -> REJECTED
  -> NEEDS_MORE_INFO
  -> DUPLICATE
  -> RIGHTS_RISK

APPROVED
  -> PAYOUT_PENDING
  -> PROCESSING_PRIVACY

PROCESSING_PRIVACY
  -> READY_TO_PUBLISH
  -> PUBLISHED

REJECTED / DUPLICATE / RIGHTS_RISK
  -> NOT_ELIGIBLE
```

주의:

- REJECTED, DUPLICATE, RIGHTS_RISK는 지급 대상이 아니다.
- APPROVED 이후에도 공개 전 개인정보 처리 실패 시 PUBLISHED로 넘어가면 안 된다.
- 지급 완료와 공개 완료는 별도 상태로 관리한다. 지급했다고 반드시 공개 성공한 것은 아니다.

---

## 4. 사용자 화면 요구사항

### 4.1 업로드 랜딩 섹션

필수 문구:

```txt
블랙박스 영상을 제보해주세요.
운영팀 검수 후 채택 시 영상 1건당 5,000원을 지급합니다.
```

보조 문구:

```txt
직접 촬영한 영상만 제출할 수 있습니다.
얼굴, 차량번호 등 개인정보는 공개 전 블러 처리됩니다.
업로드 즉시 지급되는 구조가 아니며, 검수 후 채택된 영상만 지급됩니다.
```

### 4.2 업로드 폼 필드

#### A. 영상 정보

- video_file: required
- title: optional
- description: required
- incident_type: required
  - 사고
  - 아찔한 상황
  - 난폭운전
  - 보복운전 의심
  - 주차/접촉
  - 기타
- is_under_1_minute: 자동 검사 또는 수동 확인
- has_audio: 자동 감지 가능하면 기록

#### B. 위치 정보

- region_sido: required
- region_sigungu: optional
- approximate_address: optional
- lat/lng: optional
- 위치 공개 동의: required

공개 정책:

- 원본 주소/좌표는 관리자용 또는 내부 처리용이다.
- 사용자 화면에는 노이즈 처리된 대략 위치만 노출한다.
- 시간 정보는 수집하지 않거나, 수집하더라도 공개하지 않는다.

#### C. 제출자 정보

- name: required
- phone: required
- email: optional
- nickname: optional

#### D. 지급 계좌 정보

- bank_name: required
- account_number: required
- account_holder: required

주의:

- 계좌정보는 민감한 개인정보에 준하여 암호화 저장한다.
- 관리자 화면에서도 마스킹 표시를 기본으로 한다.
- 전체 계좌번호는 지급 담당자 권한에서만 확인 가능하게 한다.

#### E. 권리 확인

체크박스:

- 직접 촬영
- 권리 보유
- 상업적 이용 동의
- 편집/블러/재가공 동의
- 허위 제출 책임 확인
- 개인정보 처리방침 동의

### 4.3 제출 완료 화면

필수 정보:

- 접수번호
- 검수 상태
- 예상 처리 안내
- 채택 시 5,000원 지급 안내
- 문의 채널

예시:

```txt
접수 완료되었습니다.

접수번호: BB-2026-000001

운영팀 검수 후 채택 여부가 결정됩니다.
채택된 영상은 입력하신 계좌로 건당 5,000원이 지급됩니다.
검수 과정에서 추가 확인이 필요한 경우 연락드릴 수 있습니다.
```

### 4.4 내 제출 내역 페이지

권장 라우트:

```txt
/my/submissions
```

표시 항목:

- 제출일
- 영상 썸네일
- 상태
- 채택 여부
- 지급 상태
- 반려 사유
- 문의 버튼

---

## 5. 관리자 화면 요구사항

### 5.1 관리자 큐

권장 라우트:

```txt
/admin/submissions
```

목록 컬럼:

- 접수번호
- 제출일
- 제출자명
- 연락처
- 영상 썸네일
- 상태
- 지급 상태
- 사고 유형
- 지역
- 검수 담당자
- 위험도
- 액션

필터:

- PENDING_REVIEW
- APPROVED
- REJECTED
- PAYOUT_PENDING
- PAID
- RIGHTS_RISK
- DUPLICATE
- PROCESSING_PRIVACY

정렬:

- 최신순
- 오래된순
- 위험도 높은순
- 지급 대기순

### 5.2 관리자 상세 검수 화면

권장 라우트:

```txt
/admin/submissions/:id
```

표시 항목:

- 영상 플레이어
- 원본 파일 다운로드 또는 내부 재생
- 제출자 정보
- 계좌정보 마스킹 표시
- 영상 설명
- 위치 정보
- 권리 동의 로그
- 파일 해시
- IP/User-Agent
- 이전 제출 이력
- 중복 의심 결과
- 관리자 메모

검수 체크리스트:

```txt
[ ] 영상 재생 가능
[ ] 1분 이하 또는 1분 이하로 편집 가능
[ ] 직접 촬영 가능성이 높음
[ ] 유튜브/뉴스/방송 출처 의심 없음
[ ] 얼굴/차량번호 블러 처리 가능
[ ] 위치 공개 가능
[ ] 중대 사고/민감 사건 아님
[ ] 지급 가능
```

관리자 버튼:

- 승인
- 반려
- 추가 확인 요청
- 중복 처리
- 권리 리스크 처리
- 개인정보 처리 큐로 이동
- 지급 대기 등록
- 지급 완료 처리
- 공개 처리
- 비공개 처리

### 5.3 반려 사유 템플릿

- 직접 촬영 여부 확인 불가
- 영상 품질 부족
- 중복 제출
- 저작권/출처 불명확
- 개인정보 노출 위험이 큼
- 서비스 정책에 맞지 않는 영상
- 사고/상황 식별 불가
- 원본 파일 확인 불가

### 5.4 지급 관리 화면

권장 라우트:

```txt
/admin/payouts
```

목록 컬럼:

- payout_id
- submission_id
- 제출자명
- 은행명
- 계좌번호 마스킹
- 예금주
- 금액
- 상태
- 승인일
- 지급일
- 지급 담당자
- 메모

버튼:

- 지급 대기
- 지급 완료
- 지급 실패
- 보류
- 지급 취소

MVP 1차에서는 자동 이체 API를 붙이지 말고, 수동 송금 후 관리자가 지급완료 처리하는 구조로 시작해도 된다.

자동 이체 API는 추후 아래 조건을 확인한 뒤 붙인다.

- 사업자 계좌
- 지급 대행 API
- 오픈뱅킹/펌뱅킹/PG사 정산 API
- 개인정보 및 금융정보 처리 정책
- 지급 실패/환불/오입금 대응 정책

---

## 6. 데이터 모델 제안

현재 프로젝트 ORM/DB 구조에 맞게 변환한다. 아래는 논리 모델이다.

### 6.1 users 또는 submitters

```ts
type Submitter = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### 6.2 video_submissions

```ts
type VideoSubmission = {
  id: string;
  submissionNo: string;

  submitterId: string;

  title?: string;
  description: string;
  incidentType: string;

  originalFileId: string;
  processedFileId?: string;
  thumbnailFileId?: string;

  originalFileHash: string;
  durationSec?: number;
  fileSizeBytes?: number;
  mimeType?: string;

  regionSido: string;
  regionSigungu?: string;
  approximateAddress?: string;

  originalLat?: number;
  originalLng?: number;
  noisyLat?: number;
  noisyLng?: number;

  status: SubmissionStatus;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH";

  reviewAssignedAdminId?: string;
  reviewedAt?: Date;
  reviewMemo?: string;
  rejectionReason?: string;

  agreementId: string;
  payoutId?: string;

  createdAt: Date;
  updatedAt: Date;
};
```

### 6.3 content_agreements

```ts
type ContentAgreement = {
  id: string;
  submissionId: string;
  submitterId: string;

  agreementVersion: string;

  isOriginalOwnerChecked: boolean;
  isRightsHolderChecked: boolean;
  commercialUseAgreed: boolean;
  editAndBlurAgreed: boolean;
  warrantyAgreed: boolean;
  privacyPolicyAgreed: boolean;
  rewardPolicyConfirmed: boolean;

  agreedAt: Date;
  ipAddress: string;
  userAgent: string;

  fileHashAtAgreement: string;

  createdAt: Date;
};
```

### 6.4 payout_accounts

```ts
type PayoutAccount = {
  id: string;
  submitterId: string;

  bankName: string;
  accountNumberEncrypted: string;
  accountNumberMasked: string;
  accountHolder: string;

  createdAt: Date;
  updatedAt: Date;
};
```

### 6.5 payouts

```ts
type Payout = {
  id: string;
  submissionId: string;
  submitterId: string;
  payoutAccountId: string;

  amount: number; // always 5000
  currency: "KRW";

  status: PayoutStatus;

  approvedAt?: Date;
  paidAt?: Date;
  failedAt?: Date;

  paidByAdminId?: string;
  paymentReference?: string;
  memo?: string;

  createdAt: Date;
  updatedAt: Date;
};
```

### 6.6 admin_reviews

```ts
type AdminReview = {
  id: string;
  submissionId: string;
  adminId: string;

  decision: "APPROVE" | "REJECT" | "NEEDS_MORE_INFO" | "DUPLICATE" | "RIGHTS_RISK";
  memo?: string;
  rejectionReason?: string;

  checklist: {
    playable: boolean;
    underOneMinute: boolean;
    likelyOriginal: boolean;
    noNewsOrYoutubeSource: boolean;
    blurPossible: boolean;
    locationSafe: boolean;
    notSensitiveIncident: boolean;
    payoutEligible: boolean;
  };

  createdAt: Date;
};
```

### 6.7 audit_logs

```ts
type AuditLog = {
  id: string;
  actorType: "USER" | "ADMIN" | "SYSTEM";
  actorId?: string;

  action: string;
  targetType: string;
  targetId: string;

  before?: unknown;
  after?: unknown;

  ipAddress?: string;
  userAgent?: string;

  createdAt: Date;
};
```

---

## 7. API 요구사항

아래 엔드포인트명은 예시다. 현재 프로젝트 컨벤션에 맞게 조정한다.

### 7.1 사용자 업로드

```http
POST /api/submissions
Content-Type: multipart/form-data
```

입력:

- videoFile
- title
- description
- incidentType
- regionSido
- regionSigungu
- approximateAddress
- lat
- lng
- name
- phone
- email
- bankName
- accountNumber
- accountHolder
- agreementCheckedItems

처리:

1. 파일 유효성 검사
2. 길이 검사
3. 해시 생성
4. 파일 저장
5. submitter 생성 또는 연결
6. payout_account 생성
7. content_agreement 생성
8. video_submission 생성
9. 상태 PENDING_REVIEW
10. audit_log 기록

응답:

```json
{
  "submissionId": "sub_xxx",
  "submissionNo": "BB-2026-000001",
  "status": "PENDING_REVIEW"
}
```

### 7.2 제출 내역 조회

```http
GET /api/my/submissions
```

### 7.3 관리자 제출 목록

```http
GET /api/admin/submissions?status=PENDING_REVIEW
```

### 7.4 관리자 제출 상세

```http
GET /api/admin/submissions/:id
```

### 7.5 관리자 승인

```http
POST /api/admin/submissions/:id/approve
```

처리:

1. 권한 확인
2. submission 상태 APPROVED
3. payout 생성 또는 PAYOUT_PENDING 설정
4. privacy processing job 생성
5. audit_log 기록

### 7.6 관리자 반려

```http
POST /api/admin/submissions/:id/reject
```

입력:

```json
{
  "reason": "직접 촬영 여부 확인 불가",
  "memo": "유튜브 재업로드 의심"
}
```

### 7.7 지급 완료 처리

```http
POST /api/admin/payouts/:id/mark-paid
```

입력:

```json
{
  "paymentReference": "manual-transfer-20260523-001",
  "memo": "수동 계좌이체 완료"
}
```

### 7.8 개인정보 처리 완료 처리

```http
POST /api/admin/submissions/:id/privacy-processed
```

### 7.9 공개 처리

```http
POST /api/admin/submissions/:id/publish
```

---

## 8. 위치 랜덤화 요구사항

### 8.1 원칙

- 실제 좌표를 그대로 공개하지 않는다.
- 노이즈 좌표만 사용자 화면/지도에 사용한다.
- 시간 정보는 공개하지 않는다.

### 8.2 좌표 노이즈 함수

```ts
export function addCoordinateNoise(
  lat: number,
  lng: number,
  radiusMeters = 200
) {
  const earthMeterPerDegree = 111300;
  const r = radiusMeters / earthMeterPerDegree;
  const u = Math.random();
  const v = Math.random();

  const w = r * Math.sqrt(u);
  const t = 2 * Math.PI * v;

  const noisyLat = lat + w * Math.cos(t);
  const noisyLng = lng + (w * Math.sin(t)) / Math.cos(lat * (Math.PI / 180));

  return { lat: noisyLat, lng: noisyLng };
}
```

### 8.3 반경 기준

- 일반 영상: 200m
- 사고 영상: 300m
- 민감 영상: 500m 또는 지도 표시 제외

---

## 9. 파일 처리 요구사항

### 9.1 파일 저장

- 원본 파일과 공개 파일을 분리한다.
- 원본 파일 접근은 관리자 제한 권한만 가능하게 한다.
- 공개 파일은 개인정보 처리 후 생성된 파일만 사용한다.

### 9.2 메타데이터 제거

공개 전 반드시 메타데이터를 제거한다.

예시:

```bash
ffmpeg -i input.mp4 -map_metadata -1 -c copy output.mp4
```

### 9.3 썸네일 생성

- 업로드 후 썸네일 생성
- 관리자 큐에서 빠르게 식별 가능하도록 사용
- 썸네일에도 차량번호/얼굴이 노출될 수 있으므로 공개용 썸네일은 별도 처리 필요

---

## 10. 개인정보 및 보안 요구사항

### 10.1 암호화 대상

- 계좌번호
- 연락처
- 원본 주소
- 원본 좌표
- 원본 영상 접근 경로

### 10.2 마스킹

관리자 목록에서는 아래처럼 표시한다.

```txt
010-****-1234
국민은행 1234-****-****-56
홍*동
```

### 10.3 접근 권한

관리자 권한을 최소 2단계로 나눈다.

- REVIEW_ADMIN: 영상 검수 가능
- PAYOUT_ADMIN: 계좌정보 확인 및 지급 처리 가능
- SUPER_ADMIN: 전체 권한

### 10.4 로그

아래 행위는 audit_log에 반드시 기록한다.

- 제출
- 동의
- 파일 업로드
- 관리자 열람
- 승인
- 반려
- 지급 상태 변경
- 계좌정보 열람
- 공개
- 삭제

### 10.5 보관 기간

MVP 단계에서는 설정값으로 관리한다.

권장:

- 반려 영상 원본: 30~90일 후 삭제
- 승인 영상 원본: 서비스 운영 정책에 따라 보관
- 지급 증빙 및 계약 로그: 분쟁 대응 목적상 장기 보관 가능
- 계좌정보: 지급 완료 후 일정 기간 뒤 삭제 또는 별도 동의 근거 필요

---

## 11. 사용자 고지 문구

### 11.1 업로드 상단 안내

```txt
100:0연구소는 직접 촬영한 블랙박스 영상을 제보받고 있습니다.
운영팀 검수 후 채택된 영상에 한해 건당 5,000원을 지급합니다.
업로드된 영상은 개인정보 보호를 위해 얼굴, 차량번호 등 식별 가능 정보를 처리한 뒤 공개됩니다.
```

### 11.2 지급 안내

```txt
보상은 업로드 즉시 지급되지 않습니다.
운영팀 검수 후 채택된 영상에 한해 지급됩니다.
중복 영상, 타인 영상, 출처가 불분명한 영상, 권리 침해 가능성이 있는 영상은 반려될 수 있습니다.
```

### 11.3 권리 보증 안내

```txt
제출자는 본인이 해당 영상의 적법한 권리자이거나, 영상을 제공할 수 있는 권한을 보유하고 있음을 보증해야 합니다.
허위 제출로 인해 발생하는 분쟁에 대해서는 제출자에게 책임이 있을 수 있습니다.
```

---

## 12. 전자 동의 전문

업로드 제출 전 사용자가 확인해야 하는 전문이다.

```txt
[콘텐츠 제공 및 이용 동의]

본인은 100:0연구소에 블랙박스 영상을 제출함에 있어 다음 사항을 확인하고 동의합니다.

1. 본인은 제출하는 영상이 본인이 직접 촬영한 영상이거나, 해당 영상을 제공할 적법한 권한을 보유하고 있음을 보증합니다.

2. 본인은 제출하는 영상이 타인의 저작권, 초상권, 개인정보, 명예, 기타 권리를 침해하지 않음을 보증합니다.

3. 본인은 100:0연구소가 제출된 영상을 검수한 뒤 채택 여부를 결정할 수 있으며, 채택된 영상에 한해 건당 5,000원의 보상이 지급됨을 확인합니다.

4. 본인은 100:0연구소가 제출된 영상을 서비스 운영, 게시, 편집, 가공, 블러 처리, 비식별 처리, 썸네일 제작, 홍보 및 마케팅 목적으로 이용할 수 있음에 동의합니다.

5. 본인은 영상 내 얼굴, 차량번호, 음성, 위치 등 식별 가능 정보가 포함될 수 있음을 이해하며, 100:0연구소가 이를 보호하기 위해 필요한 비식별 처리를 수행할 수 있음에 동의합니다.

6. 본인은 허위 제출, 무단 복제 영상 제출, 타인의 권리 침해 영상 제출 등으로 인해 분쟁이 발생하는 경우 본인에게 책임이 있을 수 있음을 확인합니다.

7. 본인은 보상 지급을 위해 이름, 연락처, 계좌정보 등 필요한 개인정보가 수집·이용될 수 있음을 확인하고 동의합니다.
```

---

## 13. MVP 구현 우선순위

### Phase 1. 필수 구현

- 업로드 폼 확장
- 지급 계좌 입력
- 전자 동의 체크박스
- 제출 상태 PENDING_REVIEW
- 관리자 제출 목록
- 관리자 상세 검수
- 승인/반려
- payout 생성
- 지급 완료 수동 처리
- 기본 audit log
- 계좌정보 암호화 또는 최소한 서버단 비공개 저장
- 제출 완료 화면

### Phase 2. 운영 안정화

- 제출 내역 페이지
- 관리자 필터/검색
- 반려 사유 템플릿
- 중복 해시 검사
- 파일 길이 자동 검사
- 좌표 노이즈
- 개인정보 처리 상태 관리
- 공개/비공개 전환

### Phase 3. 자동화

- FFmpeg 메타데이터 제거
- 썸네일 자동 생성
- 얼굴/번호판 blur pipeline
- 지급 API 연동
- 유사 영상 탐지
- 공급자 신뢰도 점수

---

## 14. 구현 시 주의사항

1. 업로드 즉시 지급하지 말 것.
2. 동의 로그 없이 영상만 저장하지 말 것.
3. 계좌번호를 평문으로 관리자 목록에 노출하지 말 것.
4. 원본 좌표를 그대로 공개 지도에 사용하지 말 것.
5. 공개 파일과 원본 파일을 동일하게 쓰지 말 것.
6. 관리자 승인과 지급 완료를 같은 상태로 합치지 말 것.
7. 반려 영상도 일정 기간 보관 후 삭제 정책을 둔다.
8. 사용자의 권리 보증 체크는 단순 UI가 아니라 DB 로그로 남긴다.
9. 관리자 액션은 모두 audit_log에 남긴다.
10. 지급 자동화는 MVP 이후로 미루고, 수동 지급 + 상태관리부터 구현한다.

---

## 15. Claude Code 작업 지시

아래 순서로 구현한다.

### 15.1 코드베이스 분석

먼저 현재 코드베이스에서 아래를 파악한다.

- 프론트엔드 프레임워크
- 백엔드 API 구조
- DB/ORM 사용 여부
- 현재 업로드 기능 구현 위치
- 인증/관리자 권한 구조
- 파일 저장 방식
- 배포 환경

### 15.2 기존 업로드 기능 확장

기존 업로드 기능을 삭제하지 말고 확장한다.

추가 필드:

- description
- incidentType
- regionSido
- regionSigungu
- approximateAddress
- submitterName
- submitterPhone
- submitterEmail
- bankName
- accountNumber
- accountHolder
- agreement checkboxes

### 15.3 DB 마이그레이션 추가

필요한 테이블 또는 컬렉션을 추가한다.

우선순위:

1. video_submissions
2. content_agreements
3. payout_accounts
4. payouts
5. admin_reviews
6. audit_logs

### 15.4 관리자 페이지 추가

최소 관리자 기능:

- 제출 목록
- 제출 상세
- 승인
- 반려
- 지급 대기 확인
- 지급 완료 처리

### 15.5 상태 전이 구현

상태 전이는 임의 문자열이 아니라 enum 또는 상수로 관리한다.

### 15.6 보안 처리

- 계좌번호는 마스킹 표시
- 가능하면 암호화 저장
- 관리자 권한 검사
- audit log 기록

### 15.7 테스트

최소 테스트 시나리오:

1. 사용자가 영상 업로드
2. 권리 동의 로그 생성 확인
3. 제출 상태 PENDING_REVIEW 확인
4. 관리자가 승인
5. payout이 5,000원으로 생성됨
6. 관리자가 지급 완료 처리
7. 지급 상태 PAID 확인
8. 반려 시 payout 생성되지 않음
9. 계좌번호가 목록에서 마스킹됨
10. audit_log가 생성됨

---

## 16. 완료 기준

이번 작업이 완료되었다고 판단하는 기준:

- 사용자가 플랫폼 안에서 영상 제보를 완료할 수 있다.
- 사용자는 지급 계좌를 입력할 수 있다.
- 사용자는 권리 동의/개인정보 동의를 완료해야 제출할 수 있다.
- 제출된 영상은 관리자 큐에 들어간다.
- 관리자는 승인/반려할 수 있다.
- 승인된 영상은 5,000원 지급 대기 상태가 된다.
- 관리자는 수동 송금 후 지급 완료로 변경할 수 있다.
- 모든 핵심 액션은 로그로 남는다.
- 업로드 즉시 지급되는 구조가 아니다.
- 원본 권리 확보와 지급 증빙이 데이터로 남는다.
