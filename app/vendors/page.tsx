// 업체 리스트 (기획서 10절 — 업종 필터 14개+전체, 썸네일/업체명/업종/지역 표시)
import Link from 'next/link';
import { AdminHeader } from '@/components/admin-header';
import { Button } from '@/components/ui/button';
import { CATEGORIES, categoryLabel, type VendorPhoto } from '@/lib/constants';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function mainPhotoUrl(photos: unknown): string | null {
  if (!Array.isArray(photos)) return null;
  const main = (photos as VendorPhoto[]).find((p) => p?.type === 'main');
  return main?.url ?? null;
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const activeCategory = CATEGORIES.some((c) => c.code === category) ? category : undefined;

  const vendors = await prisma.vendor.findMany({
    where: activeCategory ? { category: activeCategory } : undefined,
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      category: true,
      region: true,
      contact: true,
      photos: true,
      updatedAt: true,
    },
  });

  const filters = [{ code: '', label: '전체' }, ...CATEGORIES];

  return (
    <>
      <AdminHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            업체 리스트 <span className="ml-1 text-sm font-normal text-muted-foreground">{vendors.length}개</span>
          </h1>
          <Button render={<Link href="/vendors/new" />}>새 업체 등록</Button>
        </div>

        {/* 업종 필터 (기획서 요구: 업종별로 나눠서 보기 편하게) */}
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => {
            const isActive = (f.code || undefined) === activeCategory;
            return (
              <Link
                key={f.code || 'all'}
                href={f.code ? `/vendors?category=${f.code}` : '/vendors'}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {vendors.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white py-20 text-center text-muted-foreground">
            {activeCategory ? `${categoryLabel(activeCategory)} 업종에 등록된 업체가 없습니다.` : '등록된 업체가 없습니다.'}
            <div className="mt-3">
              <Button render={<Link href="/vendors/new" />} variant="outline" size="sm">
                새 업체 등록하기
              </Button>
            </div>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => {
              const thumb = mainPhotoUrl(vendor.photos);
              return (
                <li key={vendor.id}>
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="flex gap-3 rounded-lg border bg-white p-3 transition-shadow hover:shadow-md"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt={vendor.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                          사진 없음
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{vendor.name}</span>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span className="mr-2 inline-block rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">
                          {categoryLabel(vendor.category)}
                        </span>
                        {vendor.region || '지역 미입력'}
                      </div>
                      {vendor.contact && (
                        <div className="mt-1 truncate text-sm text-muted-foreground">{vendor.contact}</div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
