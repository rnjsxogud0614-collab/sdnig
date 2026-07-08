'use client';

// 스타일/무드 자유 입력 해시태그 (기획서 8절)
// 엔터/스페이스로 #칩 추가, 칩 클릭으로 삭제. 저장은 # 없이 텍스트만.
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const tag = draft.replace(/^#+/, '').trim();
    setDraft('');
    if (!tag) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // 한글 IME 조합 중 엔터는 무시 (조기/이중 커밋 방지)
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded-full bg-neutral-900 px-2.5 py-1 text-xs text-white hover:bg-neutral-700"
              title="클릭하면 삭제됩니다"
            >
              #{tag} ✕
            </button>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={placeholder ?? '태그 입력 후 엔터 (예: 로맨틱)'}
      />
    </div>
  );
}
