'use client';

// 카카오(다음) 주소검색 API 연동 (기획서 5절 — 주소검색 API 권장, 별도 API 키 불필요)
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';

const POSTCODE_SCRIPT = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

interface DaumPostcodeData {
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
}

interface DaumPostcode {
  new (options: { oncomplete: (data: DaumPostcodeData) => void }): { open: () => void };
}

declare global {
  interface Window {
    daum?: { Postcode: DaumPostcode };
  }
}

// 다음 주소검색이 돌려주는 시/도 표기 → lib/regions.ts 의 정식 명칭
const SIDO_ALIASES: Record<string, string> = {
  서울: '서울특별시',
  부산: '부산광역시',
  대구: '대구광역시',
  인천: '인천광역시',
  광주: '광주광역시',
  대전: '대전광역시',
  울산: '울산광역시',
  세종: '세종특별자치시',
  경기: '경기도',
  강원: '강원특별자치도',
  충북: '충청북도',
  충남: '충청남도',
  전북: '전북특별자치도',
  전남: '전라남도',
  경북: '경상북도',
  경남: '경상남도',
  제주: '제주특별자치도',
};

export function normalizeSido(raw: string): string {
  if (!raw) return '';
  return SIDO_ALIASES[raw] ?? raw;
}

let scriptPromise: Promise<void> | null = null;

function loadPostcodeScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.daum?.Postcode) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = POSTCODE_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('주소검색 스크립트를 불러오지 못했습니다.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface AddressSearchButtonProps {
  onSelect: (result: { address: string; sido: string; sigungu: string }) => void;
}

export function AddressSearchButton({ onSelect }: AddressSearchButtonProps) {
  const handleClick = useCallback(async () => {
    try {
      await loadPostcodeScript();
      new window.daum!.Postcode({
        oncomplete: (data) => {
          onSelect({
            address: data.roadAddress || data.jibunAddress,
            sido: normalizeSido(data.sido),
            sigungu: data.sigungu,
          });
        },
      }).open();
    } catch {
      alert('주소검색을 불러오지 못했습니다. 주소를 직접 입력해주세요.');
    }
  }, [onSelect]);

  return (
    <Button type="button" variant="outline" onClick={handleClick}>
      주소 검색
    </Button>
  );
}
