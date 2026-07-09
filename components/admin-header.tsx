'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: '대시보드' },
  { href: '/vendors', label: '업체 리스트' },
] as const;

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-base font-semibold">
            스딩 B2B 업체 관리
          </Link>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-2.5 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-neutral-100 font-medium text-neutral-900'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          로그아웃
        </Button>
      </div>
    </header>
  );
}
