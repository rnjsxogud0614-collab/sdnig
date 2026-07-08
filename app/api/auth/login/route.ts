import { NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken, getAdminPassword } from '@/lib/auth';

export async function POST(request: Request) {
  let password = '';
  try {
    const body = await request.json();
    password = typeof body?.password === 'string' ? body.password : '';
  } catch {
    // body 파싱 실패 → 빈 비밀번호로 처리
  }

  if (password !== getAdminPassword()) {
    return NextResponse.json({ ok: false, error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, await authToken(password), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  });
  return response;
}
