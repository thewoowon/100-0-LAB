# 100:0 연구소 — 프로젝트 스펙

## 개요

**100:0 연구소**는 블랙박스 사고 영상 기반 시민 판결 플랫폼이다.
사용자가 사고 영상을 업로드하면, 다른 사용자들이 과실 비율을 투표하고, 사건 진행 상황을 추적하며, 태그와 댓글로 정보를 공유한다.
"그래서 과실 몇이었음?"이라는 질문에 답하는 사고 결과 데이터베이스를 목표로 한다.

---

## 기술 스택

| 구분 | 스택 |
|------|------|
| 프론트엔드 | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| 백엔드 | FastAPI, SQLAlchemy (sync), SQLite (mib.db) |
| 인증 | Google OAuth + JWT (access + refresh) |
| 검색 | sentence-transformers `jhgan/ko-sroberta-multitask` (768차원 벡터) |
| 지도 | Leaflet + OpenStreetMap Nominatim geocoding |
| 폰트 | Pretendard (본문), Danjo (로고) |
| 패키지 관리 | yarn (프론트), uv (백엔드) |

---

## 경로

- **프론트**: `/Users/aepeul/dev/web/100-0-lab`
- **백엔드**: `/Users/aepeul/dev/server/100-0-lab-server`
- **DB**: `app/db/mib.db`
- **uv**: `/Users/aepeul/.local/bin/uv`

---

## 디자인 시스템

**테마**: 흰색 배경 + 검정 텍스트, 포인트 컬러 최소화

```css
--bg: #ffffff
--card: #f8f8f8
--border: #e5e5e5
--text: #0a0a0a
--text-muted: #888888
--accent: (시그니처 색, 붉은 계열 포인트)
```

- 헤더: 흰색 배경, 하단 border 1px
- 로고 `100:0 연구소`: 시그니처 컬러, Pretendard ExtraBold
- 강조 포인트만 accent 컬러 사용 (투표 결과, 중요 수치 등)

---

## 프론트엔드 구조

### 라우트

| 경로 | 설명 |
|------|------|
| `/` | 홈 — AI 검색 + TOP 10 인기 영상 + 논란 영상 + 피드 |
| `/video/[id]` | 영상 상세 — 투표, 사건 진행, 지도, 태그, 댓글, 연관 영상 |
| `/map` | 전국 사고 지도 |
| `/upload` | 영상 업로드 |
| `/auth/login` | 로그인 (Google OAuth) |
| `/auth/callback/google` | OAuth 콜백 |
| `/user/me` | 내 프로필 |
| `/user/[id]` | 사용자 프로필 |
| `/shorts` | 쇼츠 뷰 |

### 주요 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `Header.tsx` | 헤더 네비게이션 (로고, 지도, 업로드, 로그인) |
| `AccidentMap.tsx` | Leaflet 지도 (SSR 불가, dynamic import 필수) |
| `OnboardingOverlay.tsx` | 온보딩 오버레이 |
| `SplashScreen.tsx` | 시작 화면 |

### lib/api.ts 주요 타입

```typescript
VideoFeedItem      // id, title, thumbnail_url, views, created_at
VideoDetail        // + description, video_url, filmed_date, filmed_location
VoteResult         // 투표 집계
MyVote             // 내 투표
TagResponse        // 태그
CaseStatusResponse // actual_ratio, resolution_note 포함
CommentItem        // is_party, party_role, party_verified
```

---

## 백엔드 구조

### 데이터베이스 모델

#### User
- `email` (unique), `nickname`, `profile_image`, `user_type`, `is_deleted`
- Relationships: videos, tokens, comments

#### Video
- `user_id`, `title`, `description`, `video_url`, `thumbnail_url`, `views`, `filmed_date`, `filmed_location`
- Relationships: user, tags, embedding, comments

#### Vote
- `video_id`, `user_id`, `ratio`
- UniqueConstraint: (video_id, user_id)
- ratio 선택지: `100:0`, `80:20`, `70:30`, `60:40`, `50:50`, `0:100`

#### Tag
- `video_id`, `name`
- UniqueConstraint: (video_id, name)

#### CaseStatus
- `video_id` (unique), `status`, `updated_by`
- `actual_ratio` (nullable) — 공식 과실 비율 (Result Reveal)
- `resolution_note` (nullable) — 결론 메모
- status 단계: 접수됨 → 보험사 접수 → 경찰 조사 중 → 합의 진행 중 → 소송 진행 중 → 1심 판결 → 항소 중 → 최종 판결 → 종결

#### VideoEmbedding
- `video_id` (unique), `embedding` (LargeBinary, pickle+numpy 768차원)

#### Comment
- `video_id`, `user_id`, `content`
- `is_party` (bool) — 당사자 여부
- `party_role` (nullable): `"가해자"` / `"피해자"` / `"목격자"`
- `party_verified` (bool) — 업로더가 당사자 인증

#### Token
- `refresh_token`, `user_id`, `is_active`

### API 엔드포인트 목록

```
# Auth
POST   /api/v1/auth/google
POST   /api/v1/auth/kakao
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

# Users
GET    /api/v1/users/me
GET    /api/v1/users/{id}
GET    /api/v1/users/{id}/videos

# Videos
GET    /api/v1/videos/feed?cursor=X         # 무한스크롤 피드
GET    /api/v1/videos/search?q=X&top_k=10  # 벡터 검색
GET    /api/v1/videos/locations             # 지도 위치 목록
GET    /api/v1/videos/top?limit=10          # 인기 영상 TOP N
GET    /api/v1/videos/controversial?limit=10 # 논란 영상
GET    /api/v1/videos/{id}/related          # 연관 영상 (벡터 유사도)
GET    /api/v1/videos/{id}                  # 영상 상세
POST   /api/v1/videos/upload                # 영상 업로드
DELETE /api/v1/videos/{id}                  # 영상 삭제

# Votes
GET    /api/v1/videos/{id}/votes
POST   /api/v1/videos/{id}/votes
GET    /api/v1/videos/{id}/votes/me

# Tags
GET    /api/v1/videos/{id}/tags
POST   /api/v1/videos/{id}/tags
DELETE /api/v1/videos/{id}/tags/{tag_id}

# Case Status
GET    /api/v1/videos/{id}/case-status
PUT    /api/v1/videos/{id}/case-status      # 업로더만 가능

# Comments
GET    /api/v1/videos/{id}/comments
POST   /api/v1/videos/{id}/comments
DELETE /api/v1/comments/{comment_id}
POST   /api/v1/videos/{id}/comments/{comment_id}/verify-party  # 업로더가 당사자 인증
```

> **주의**: video.py에서 `/feed`, `/search`, `/locations`, `/top`, `/controversial`은 반드시 `/{video_id}` 라우트보다 앞에 등록해야 함

### Services

| 서비스 | 역할 |
|--------|------|
| `auth_service` | Google/Kakao OAuth, JWT 발급/갱신 |
| `video_service` | 피드, 업로드, TOP/논란/연관 영상 |
| `embedding_service` | 벡터 임베딩, 코사인 유사도 검색, 인메모리 캐시 |
| `geocoding_service` | Nominatim 주소→좌표 변환, 메모리 캐시 |
| `vote_service` | 투표 등록/집계 |
| `tag_service` | 태그 CRUD |
| `case_status_service` | 사건 진행 상태 관리 |
| `comment_service` | 댓글 CRUD, 당사자 인증 |
| `user_service` | 사용자 정보 조회 |

---

## 핵심 기능 설명

### 1. AI 자연어 검색
- 검색어 → 768차원 벡터 임베딩 → 코사인 유사도로 상위 영상 반환
- 모델: `jhgan/ko-sroberta-multitask`
- 영상 업로드 시 `index_video()` 호출 → DB에 BLOB 저장
- 서버 시작 시 `load_cache()` → 인메모리 dict 로드

### 2. 과실 비율 투표
- 6가지 고정 선택지: 100:0, 80:20, 70:30, 60:40, 50:50, 0:100
- 사용자당 1회 (UniqueConstraint)
- 결과: 선택지별 득표수 + 비율 표시

### 3. Result Reveal (공식 결과 공개)
- 업로더가 보험사/경찰 공식 과실 비율 입력 (`actual_ratio`)
- `resolution_note`로 결론 내용 메모 가능
- CaseStatus 업데이트와 동시에 처리

### 4. 사건 진행 상태 (9단계)
업로더만 수정 가능. 단계: 접수됨 → 보험사 접수 → 경찰 조사 중 → 합의 진행 중 → 소송 진행 중 → 1심 판결 → 항소 중 → 최종 판결 → 종결

### 5. 당사자 등판
- 댓글 작성 시 `is_party: true`, `party_role` 선택
- 업로더가 해당 댓글 `verify-party` API로 인증
- 인증된 당사자 댓글에 배지 표시

### 6. 사고 지도
- 영상 `filmed_location` → Nominatim geocoding → lat/lng
- `/map`: 전국 사고 지도 + 우측 목록
- 영상 상세: 우측 패널에 180px 미니 지도
- 타일: CARTO Light

---

## 인증 흐름

```
1. 프론트 → Google OAuth → code 수신
2. POST /auth/google { code } → JWT 발급
3. localStorage: access_token, refresh_token, user_id 저장
4. API 요청: Authorization: Bearer {access_token}
5. 만료 시 POST /auth/refresh { refresh_token }
```

---

## 개발 환경

```bash
# 프론트 실행
cd /Users/aepeul/dev/web/100-0-lab
yarn dev

# 백엔드 실행
cd /Users/aepeul/dev/server/100-0-lab-server
.venv/bin/uvicorn app.main:app --reload

# 패키지 설치 (백엔드)
/Users/aepeul/.local/bin/uv add <package>

# 마이그레이션
.venv/bin/alembic upgrade head

# 시드 데이터
.venv/bin/python seed.py

# 임베딩 인덱싱 (마이그레이션 후)
.venv/bin/python scripts/index_all.py
```

---

## 주의사항

- `source .venv/bin/activate` 안 먹힘 → `.venv/bin/python` 직접 사용
- pip 없음 → `uv add`로 패키지 설치
- 사용 DB: `mib.db` (mnm.db는 구버전, 미사용)
- Alembic 마이그레이션 후 기존 데이터 임베딩 재인덱싱 필요
- AccidentMap: SSR 불가, `dynamic(() => import(...), { ssr: false })` 필수
