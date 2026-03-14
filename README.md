# 100:0 LAB

블랙박스 영상으로 사고 과실을 같이 판단하는 플랫폼이에요.

영상을 올리면 누구나 과실 비율을 투표하고, 사건이 어떻게 진행되는지 끝까지 추적할 수 있어요.
"빗길에 미끄러진 차"처럼 자연어로 검색하고, 지도에서 전국 사고 위치를 볼 수도 있어요.

---

## 시작하기

**백엔드**

```bash
cd 100-0-lab-server
uv sync
uv run uvicorn app.main:app --reload
```

**프론트엔드**

```bash
# .env.local → NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
yarn install && yarn dev
```

---

## 스택

- **프론트** — Next.js 16, React 19, Tailwind CSS v4, Leaflet
- **백엔드** — FastAPI, SQLite, sentence-transformers (`jhgan/ko-sroberta-multitask`)
- **인증** — Google OAuth + JWT
