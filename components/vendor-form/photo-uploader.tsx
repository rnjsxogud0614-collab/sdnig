'use client';

// 사진 업로드 UI (기획서 9절 — 대표사진 1장 필수, 갤러리/드레스 다중 업로드 + 정렬 + 드레스 라벨)
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PhotoRow } from './form-state';

async function uploadOne(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.url) {
    throw new Error(data?.error ?? `업로드 실패 (${file.name})`);
  }
  return data.url as string;
}

interface DropzoneProps {
  multiple?: boolean;
  onUploaded: (urls: string[]) => void;
  children?: React.ReactNode;
  className?: string;
}

function Dropzone({ multiple, onUploaded, children, className }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (uploading) return; // 업로드 중 재진입 방지
    if (!fileList || fileList.length === 0) return;
    const files = multiple ? Array.from(fileList) : [fileList[0]];
    setUploading(true);
    const urls: string[] = [];
    const errors: string[] = [];
    for (const file of files) {
      try {
        urls.push(await uploadOne(file));
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }
    setUploading(false);
    if (urls.length > 0) onUploaded(urls);
    if (errors.length > 0) alert(errors.join('\n'));
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 text-center text-sm transition-colors ${
        dragOver ? 'border-neutral-900 bg-neutral-100' : 'border-neutral-300 bg-white hover:bg-neutral-50'
      } ${className ?? ''}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <span className="text-muted-foreground">업로드 중...</span>
      ) : (
        (children ?? <span className="text-muted-foreground">클릭 또는 드래그하여 사진 업로드</span>)
      )}
    </div>
  );
}

// ---- 대표사진 (1장 필수) ----
interface MainPhotoFieldProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function MainPhotoField({ value, onChange }: MainPhotoFieldProps) {
  return (
    <div className="flex items-start gap-4">
      {value ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="대표사진" className="h-40 w-40 rounded-lg border object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
            onClick={() => onChange(null)}
            title="대표사진 삭제"
          >
            ✕
          </Button>
        </div>
      ) : null}
      <Dropzone multiple={false} onUploaded={(urls) => onChange(urls[0])} className="h-40 w-40">
        <span className="text-muted-foreground">{value ? '사진 교체' : '대표사진 업로드 (필수)'}</span>
      </Dropzone>
    </div>
  );
}

// ---- 다중 사진 리스트 (갤러리 / 드레스) ----
interface PhotoListFieldProps {
  photos: PhotoRow[];
  /** 항상 최신 상태(prev) 기준으로 갱신 — 업로드가 느릴 때 낡은 배열로 덮어쓰는 것을 방지 */
  onUpdate: (updater: (prev: PhotoRow[]) => PhotoRow[]) => void;
  withLabel?: boolean; // 드레스: 장별 라벨(드레스명/라인) 입력
  labelPlaceholder?: string;
}

export function PhotoListField({ photos, onUpdate, withLabel, labelPlaceholder }: PhotoListFieldProps) {
  function move(index: number, delta: number) {
    onUpdate((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <Dropzone
        multiple
        onUploaded={(urls) => onUpdate((prev) => [...prev, ...urls.map((url) => ({ url, label: '' }))])}
      />
      {photos.length > 0 && (
        <ul className="space-y-2">
          {photos.map((photo, i) => (
            <li key={`${photo.url}-${i}`} className="flex items-center gap-3 rounded-lg border bg-white p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.label || `사진 ${i + 1}`} className="h-16 w-16 rounded-md border object-cover" />
              <div className="min-w-0 flex-1">
                {withLabel ? (
                  <Input
                    value={photo.label}
                    onChange={(e) => {
                      const label = e.target.value;
                      onUpdate((prev) => prev.map((p, idx) => (idx === i ? { ...p, label } : p)));
                    }}
                    placeholder={labelPlaceholder ?? '라벨 입력'}
                  />
                ) : (
                  <span className="block truncate text-xs text-muted-foreground">{photo.url}</span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button type="button" variant="outline" size="sm" onClick={() => move(i, -1)} disabled={i === 0} title="위로">
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => move(i, 1)}
                  disabled={i === photos.length - 1}
                  title="아래로"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => onUpdate((prev) => prev.filter((_, idx) => idx !== i))}
                  title="삭제"
                >
                  ✕
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
