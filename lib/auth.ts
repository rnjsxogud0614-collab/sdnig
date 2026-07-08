// 비밀번호 1개 인증 (기획서 1.2절 / 10절)
// 로그인 성공 시 비밀번호에서 파생된 해시 토큰을 쿠키로 발급하고,
// middleware에서 같은 방식으로 계산한 값과 비교합니다.
// Edge 런타임(middleware)에서도 동작하도록 Web Crypto만 사용합니다.

export const AUTH_COOKIE = 'sding_admin_auth';
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || '1111';
}

export async function authToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`sding-admin-v1:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function isValidAuthToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  return token === (await authToken(getAdminPassword()));
}
