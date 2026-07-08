# 스딩(SDING) B2B 웨딩업체 데이터 수집 도구

스딩 앱에 입점할 B2B 웨딩업체 정보를 임시로 모아두는 팀 내부용 어드민입니다.
상세 스펙은 [PLANNING.md](./PLANNING.md) 참고.

- **로그인**: 비밀번호 1개 (`ADMIN_PASSWORD` 환경변수, 기본값 `1111`)
- **업체 리스트**: 업종 필터 14개 + 전체
- **업체 등록/수정**: [공통정보] [업종별 정보] [사진관리] 3개 탭, 업종별 필드 동적 렌더링
- **사진**: 대표사진 1장 필수 + 갤러리 다중 업로드 + 드레스 업종은 장별 라벨

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma 6 + PostgreSQL (Supabase)
- Supabase Storage (사진) — 미설정 시 로컬 `.uploads/` 폴백
- 인증: `proxy.ts`(구 middleware)에서 쿠키 확인

## 로컬 개발

```bash
npm install
cp .env.example .env   # 값 채우기 (로컬 PostgreSQL 사용 가능)
npx prisma migrate dev # 테이블 생성
npm run dev            # http://localhost:3000
```

Supabase 환경변수가 없으면 사진은 프로젝트의 `.uploads/` 폴더에 저장되고
`/uploads/...` 라우트가 서빙합니다(개발용). 배포 환경에서는 Supabase Storage가 필요합니다.

## 환경변수 (.env)

| 변수 | 설명 |
|---|---|
| `DATABASE_URL` | Supabase Transaction pooler 주소 (포트 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Supabase Direct 주소 (포트 5432, 마이그레이션용) |
| `ADMIN_PASSWORD` | 로그인 비밀번호 (기본 1111) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role 키 (서버 전용, 비공개) |
| `SUPABASE_STORAGE_BUCKET` | 사진 버킷 이름 (기본 `vendor-photos`, **public 버킷**으로 생성) |

## 배포 (Vercel)

`npm run build`가 `prisma migrate deploy && next build`로 구성되어 있어서,
Vercel이 빌드할 때 테이블 생성/마이그레이션까지 자동으로 실행됩니다.
터미널에서 따로 마이그레이션 명령을 실행할 필요가 없습니다.

1. Vercel에서 이 저장소 import, **Root Directory를 `sding-admin`으로 지정**
2. 위 환경변수 6개 등록
3. Supabase Storage에 `vendor-photos` **public 버킷** 생성
4. **Deploy** 클릭 — 빌드 로그에 마이그레이션 적용 결과가 표시됩니다

## 폴더 구조

```
app/
  login/                # 비밀번호 로그인
  vendors/              # 리스트(업종 필터) / new 등록 / [id] 수정
  api/                  # auth, vendors CRUD, upload
  uploads/[...path]/    # 로컬 폴백 사진 서빙 (Supabase 미설정 시)
components/
  vendor-form/          # 3탭 폼, 업종별 동적 필드, 사진 업로더 등
  ui/                   # shadcn/ui
lib/
  constants.ts          # 카테고리 14종 코드 상수
  category-fields.ts    # 업종별 전용 필드 정의 (폼+검증의 단일 소스)
  category-schema.ts    # 필드 정의 → zod 스키마 생성
  vendor-schema.ts      # 업체 페이로드 zod 검증 (클라·서버 공용)
  regions.ts            # 시/도-구/군 지역 데이터
  storage.ts            # Supabase Storage / 로컬 폴백 업로드
prisma/
  schema.prisma         # vendors 테이블 1개
proxy.ts                # 비밀번호 쿠키 체크 (구 middleware)
```
