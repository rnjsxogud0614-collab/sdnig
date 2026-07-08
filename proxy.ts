// 비밀번호 쿠키 체크 (기획서 11절의 middleware 역할 — Next.js 16에서는 proxy로 명칭 변경)
// 쿠키가 없거나 잘못되면 /login 으로 리다이렉트합니다.
import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, isValidAuthToken } from '@/lib/auth';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (await isValidAuthToken(token)) {
    return NextResponse.next();
  }

  // API 요청은 리다이렉트 대신 401 JSON 응답
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 로그인 화면·로그인 API·정적 자산·로컬 업로드 파일은 인증 제외
  matcher: ['/((?!login|api/auth/login|uploads/|_next/|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)'],
};
