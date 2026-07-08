'use client';

// 반복 행 안에서도 가볍게 쓸 수 있는 네이티브 select (shadcn 스타일 통일)
import { cn } from '@/lib/utils';

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  options: { value: string; label: string }[];
}

export function NativeSelect({ placeholder, options, className, ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        'h-9 rounded-md border border-input bg-white px-2 text-sm shadow-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
