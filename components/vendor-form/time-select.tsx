'use client';

// 시(0~23)/분 선택 UI (기획서 10절 — 운영시간·주차가능시간·시간대별 추가비용에서 공통 사용)
import { NativeSelect } from './native-select';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

interface TimeSelectProps {
  value: string; // "HH:MM" 또는 ""
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function TimeSelect({ value, onChange, disabled }: TimeSelectProps) {
  const [hour = '', minute = ''] = value ? value.split(':') : [];

  function update(nextHour: string, nextMinute: string) {
    if (!nextHour) {
      onChange('');
      return;
    }
    onChange(`${nextHour}:${nextMinute || '00'}`);
  }

  return (
    <div className="flex items-center gap-1">
      <NativeSelect
        aria-label="시"
        placeholder="시"
        value={hour}
        disabled={disabled}
        onChange={(e) => update(e.target.value, minute)}
        options={HOURS.map((h) => ({ value: h, label: `${Number(h)}시` }))}
      />
      <NativeSelect
        aria-label="분"
        placeholder="분"
        value={minute}
        disabled={disabled || !hour}
        onChange={(e) => update(hour, e.target.value)}
        options={MINUTES.map((m) => ({ value: m, label: `${m}분` }))}
      />
    </div>
  );
}

interface TimeRangeSelectProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

export function TimeRangeSelect({ start, end, onChange }: TimeRangeSelectProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TimeSelect value={start} onChange={(v) => onChange(v, end)} />
      <span className="text-sm text-muted-foreground">~</span>
      <TimeSelect value={end} onChange={(v) => onChange(start, v)} />
    </div>
  );
}
