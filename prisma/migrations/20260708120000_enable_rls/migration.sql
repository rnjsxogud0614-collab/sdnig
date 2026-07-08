-- Supabase는 public 스키마 테이블을 REST API(PostgREST)로 자동 노출한다.
-- RLS를 켜고 정책을 만들지 않으면 anon/authenticated 키로는 접근이 전부 차단되고,
-- 이 앱(Prisma, postgres 소유자 계정 직결)은 영향을 받지 않는다.
-- 기존 Supabase 프로젝트를 재사용해도 vendors 데이터가 노출되지 않도록 하는 안전장치.
ALTER TABLE "vendors" ENABLE ROW LEVEL SECURITY;
