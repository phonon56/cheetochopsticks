import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];

export function ImageDropzone({
  value,
  onChange,
  maxFiles = 6,
  maxSizeMB = 10,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const remaining = maxFiles - value.length;
      const accepted: File[] = [];
      const rejected: string[] = [];
      for (const f of arr.slice(0, remaining)) {
        if (!ACCEPTED.includes(f.type) && !/\.(jpe?g|png|gif|webp|heic|heif)$/i.test(f.name)) {
          rejected.push(`${f.name} (unsupported type)`);
          continue;
        }
        if (f.size > maxSizeMB * 1024 * 1024) {
          rejected.push(`${f.name} (over ${maxSizeMB} MB)`);
          continue;
        }
        accepted.push(f);
      }
      if (accepted.length) {
        const next = [...value, ...accepted];
        onChange(next);
        const names = accepted.map((f) => f.name).join(', ');
        setAnnouncement(
          `${accepted.length} ${accepted.length === 1 ? 'file' : 'files'} added: ${names}. Total ${next.length} of ${maxFiles}.`,
        );
      }
      if (rejected.length) setError(`Skipped: ${rejected.join('; ')}`);
      else setError(null);
    },
    [value, onChange, maxFiles, maxSizeMB],
  );

  function removeAt(index: number) {
    const removed = value[index];
    const next = value.filter((_, i) => i !== index);
    onChange(next);
    setAnnouncement(`Removed ${removed?.name ?? 'file'}. ${next.length} of ${maxFiles} remaining.`);
  }

  // Clear announcement after 5s so re-adding same file re-announces
  useEffect(() => {
    if (!announcement) return;
    const t = setTimeout(() => setAnnouncement(''), 5000);
    return () => clearTimeout(t);
  }, [announcement]);

  const inputId = 'image-dropzone-input';
  const hintId = 'image-dropzone-hint';

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-900 mb-1">
        Photos (optional)
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={[
          'rounded-md border-2 border-dashed p-4 text-sm',
          isOver ? 'border-blue-700 bg-blue-50' : 'border-slate-400 bg-slate-50',
        ].join(' ')}
      >
        <p id={hintId} className="text-slate-700">
          Drag images here, or{' '}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-blue-700 underline"
          >
            choose files
          </button>
          . JPG, PNG, GIF, WebP, or HEIC up to {maxSizeMB} MB each. Max {maxFiles} files.
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept="image/*"
          aria-describedby={hintId}
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = '';
          }}
          className="sr-only"
        />
      </div>

      {value.length > 0 && (
        <ul aria-label="Attached files" className="mt-2 space-y-1">
          {value.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span className="truncate">
                <span className="font-medium text-slate-900">{f.name}</span>
                <span className="ml-2 text-xs text-slate-600">
                  {(f.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Remove ${f.name}`}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-800 hover:bg-slate-50 min-h-8"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-2 text-xs text-red-800">
          {error}
        </p>
      )}

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  );
}
