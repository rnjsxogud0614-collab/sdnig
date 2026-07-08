import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// 사진 업로드 (기획서 9절) — 업로드 후 반환된 URL을 photos 배열에 추가
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: '업로드할 파일이 없습니다.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: '이미지 파일(jpg, png, webp, gif, avif)만 업로드할 수 있습니다.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
  }

  try {
    const { url } = await uploadImage(file);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    const message = e instanceof Error ? e.message : '업로드에 실패했습니다.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
