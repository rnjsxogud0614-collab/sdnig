'use client';

// 업체 리스트 상단 컨트롤 — 지역(시/도-구/군) 필터, 정렬, 카드/리스트 보기 전환
// 현재 필터 상태를 props로 받아 URL 쿼리로 반영합니다 (서버 컴포넌트가 다시 조회).
import { useRouter } from 'next/navigation';
import { NativeSelect } from '@/components/vendor-form/native-select';
import { SIDO_LIST, gugunsOf } from '@/lib/regions';
import { cn } from '@/lib/utils';

export type VendorSort = 'latest' | 'name';
export type VendorView = 'card' | 'list';

interface VendorListControlsProps {
  category?: string;
  sido: string;
  gugun: string;
  sort: VendorSort;
  view: VendorView;
}

export function VendorListControls({ category, sido, gugun, sort, view }: VendorListControlsProps) {
  const router = useRouter();

  function update(changes: Partial<Record<'sido' | 'gugun' | 'sort' | 'view', string>>) {
    const next = { category: category ?? '', sido, gugun, sort, view, ...changes };
    const params = new URLSearchParams();
    if (next.category) params.set('category', next.category);
    if (next.sido) params.set('sido', next.sido);
    if (next.sido && next.gugun) params.set('gugun', next.gugun);
    if (next.sort !== 'latest') params.set('sort', next.sort);
    if (next.view !== 'card') params.set('view', next.view);
    const qs = params.toString();
    router.push(qs ? `/vendors?${qs}` : '/vendors');
  }

  const guguns = gugunsOf(sido);

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <NativeSelect
        aria-label="시/도 필터"
        placeholder="지역 전체"
        options={SIDO_LIST.map((s) => ({ value: s, label: s }))}
        value={sido}
        onChange={(e) => update({ sido: e.target.value, gugun: '' })}
      />
      <NativeSelect
        aria-label="구/군 필터"
        placeholder="구/군 전체"
        options={guguns.map((g) => ({ value: g, label: g }))}
        value={gugun}
        onChange={(e) => update({ gugun: e.target.value })}
        disabled={!sido || guguns.length === 0}
      />
      <NativeSelect
        aria-label="정렬"
        options={[
          { value: 'latest', label: '최신순' },
          { value: 'name', label: '이름순' },
        ]}
        value={sort}
        onChange={(e) => update({ sort: e.target.value })}
      />
      <div className="ml-auto flex overflow-hidden rounded-md border border-input shadow-xs" role="group" aria-label="보기 방식">
        {(
          [
            { code: 'card', label: '카드' },
            { code: 'list', label: '리스트' },
          ] as const
        ).map((v) => (
          <button
            key={v.code}
            type="button"
            onClick={() => update({ view: v.code })}
            aria-pressed={view === v.code}
            className={cn(
              'h-9 px-3 text-sm transition-colors',
              view === v.code
                ? 'bg-neutral-900 text-white'
                : 'bg-white text-neutral-700 hover:bg-neutral-100'
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
