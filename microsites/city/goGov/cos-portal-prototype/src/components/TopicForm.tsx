import { useEffect, useMemo, useState } from 'react';
import { useForm, type UseFormRegister } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Topic, VisibleField } from '../types';
import { ImageDropzone } from './ImageDropzone';
import { MapPicker } from './MapPicker';
import { topicRequiresLocation } from '../data';
import { JURISDICTION_LABELS } from '../data/facets';

interface Props {
  topic: Topic;
  sharedDescription: string;
  onSharedDescriptionChange: (v: string) => void;
  onSubmitted: (payload: SubmissionPayload) => void;
}

export interface SubmissionPayload {
  classificationId: string;
  topicName: string;
  submittedAt: string;
  fields: Record<string, unknown>;
  attachments: Array<{ name: string; sizeBytes: number; type: string }>;
  locationCoord?: string;
  traceId: string;
}

function isRequired(f: VisibleField) {
  if (f.name === 'website_url') return false;
  if (f.name === 'description') return true;
  if (f.name === 'location') return true; // server validates
  if (f.type === 'select-one') return true;
  return false;
}

function buildSchema(fields: VisibleField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    if (f.name === 'website_url') continue;
    switch (f.type) {
      case 'checkbox':
        shape[f.name] = z.boolean().optional();
        break;
      case 'select-one':
        shape[f.name] = z.string().min(1, `${f.label} is required`);
        break;
      case 'date':
        shape[f.name] = z.string().optional();
        break;
      default:
        if (f.name === 'description') {
          shape[f.name] = z.string().min(10, 'Please provide at least 10 characters');
        } else if (f.name === 'location') {
          shape[f.name] = z.string().min(3, 'Please provide a location');
        } else {
          shape[f.name] = z.string().optional();
        }
    }
  }
  return z.object(shape);
}

function visibleRenderable(fields: VisibleField[]) {
  return fields.filter((f) => f.name !== 'website_url');
}

export function TopicForm({
  topic,
  sharedDescription,
  onSharedDescriptionChange,
  onSubmitted,
}: Props) {
  const dest = topic.destination ?? { kind: 'form' as const };
  if (dest.kind !== 'form') {
    return <ExternalOrEmailView topic={topic} />;
  }
  return (
    <InternalTopicForm
      topic={topic}
      sharedDescription={sharedDescription}
      onSharedDescriptionChange={onSharedDescriptionChange}
      onSubmitted={onSubmitted}
    />
  );
}

function ExternalOrEmailView({ topic }: { topic: Topic }) {
  const d = topic.destination;
  if (!d || d.kind === 'form') return null;
  const jurisdiction = topic.facets?.jurisdiction;
  return (
    <div className="max-w-2xl rounded-2xl border border-line bg-surface shadow-sm p-6 md:p-8 space-y-6">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs">
          <span className="font-semibold uppercase tracking-[0.16em] text-brand-ink">
            {d.kind === 'external' ? 'External destination' : 'Direct email'}
          </span>
          {jurisdiction && (
            <>
              <span className="text-ink-meta">·</span>
              <span className="text-ink-meta">{JURISDICTION_LABELS[jurisdiction]}</span>
            </>
          )}
        </p>
        <h2
          id="topic-heading"
          tabIndex={-1}
          className="font-serif text-3xl font-semibold tracking-tight text-ink focus:outline-none"
        >
          {topic.name}
        </h2>
        {topic.description && (
          <p className="text-[15px] text-ink-secondary leading-relaxed">{topic.description}</p>
        )}
      </header>

      {d.kind === 'external' && d.warning && (
        <div
          role="note"
          className="flex gap-3 rounded-xl border border-line border-l-4 border-l-warning bg-warning-surface p-4 shadow-sm"
        >
          <span className="text-warning shrink-0 mt-0.5" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          </span>
          <div>
            <p className="font-semibold text-warning-ink">Heads up</p>
            <p className="text-sm text-warning-ink/90 mt-0.5">{d.warning}</p>
          </div>
        </div>
      )}

      {d.kind === 'external' ? (
        <a
          href={d.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-hover px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark min-h-11"
        >
          {d.ctaLabel ?? `Continue to ${d.agency}`}
          <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <a
          href={`mailto:${d.address}${d.subjectTemplate ? '?subject=' + encodeURIComponent(d.subjectTemplate) : ''}`}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-hover px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark min-h-11"
        >
          {d.ctaLabel ?? `Email ${d.address}`}
        </a>
      )}

      {topic.contact && (
        <aside className="rounded-xl border border-line bg-surface-muted p-4 text-sm text-ink-secondary">
          <p className="font-semibold text-ink mb-1">Contact details</p>
          <ul className="space-y-0.5">
            {topic.contact.website && (
              <li>
                Website:{' '}
                <a
                  href={topic.contact.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-ink font-semibold underline underline-offset-2"
                >
                  {topic.contact.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
            {topic.contact.email && (
              <li>
                Email:{' '}
                <a href={`mailto:${topic.contact.email}`} className="text-brand-ink font-semibold underline underline-offset-2">
                  {topic.contact.email}
                </a>
              </li>
            )}
            {topic.contact.phone && (
              <li>
                Phone:{' '}
                <a
                  href={`tel:${topic.contact.phone.replace(/[^0-9+]/g, '')}`}
                  className="text-brand-ink font-semibold underline underline-offset-2"
                >
                  {topic.contact.phone}
                </a>
              </li>
            )}
            {topic.contact.notes && <li className="text-ink-secondary">{topic.contact.notes}</li>}
          </ul>
        </aside>
      )}
    </div>
  );
}

function InternalTopicForm({
  topic,
  sharedDescription,
  onSharedDescriptionChange,
  onSubmitted,
}: Props) {
  const schema = useMemo(() => buildSchema(topic.visibleFields), [topic]);
  const fields = visibleRenderable(topic.visibleFields);
  const [honeypot, setHoneypot] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [locationCoord, setLocationCoord] = useState('');
  const showMap = topicRequiresLocation(topic);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema) as never,
    defaultValues: { description: sharedDescription },
  });

  useEffect(() => {
    reset({ description: sharedDescription });
    setAttachments([]);
    setLocationCoord('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.topicId, reset]);

  // Mirror the description field up so it survives topic switches.
  const currentDescription = watch('description');
  useEffect(() => {
    if (typeof currentDescription === 'string' && currentDescription !== sharedDescription) {
      onSharedDescriptionChange(currentDescription);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDescription]);

  type RenderItem =
    | { kind: 'field'; field: VisibleField }
    | { kind: 'group'; groupLabel: string; items: VisibleField[] };
  const rendered: RenderItem[] = [];
  for (const f of fields) {
    if (f.type === 'checkbox' && f.groupLabel) {
      const last = rendered[rendered.length - 1];
      if (last && last.kind === 'group' && last.groupLabel === f.groupLabel) {
        last.items.push(f);
        continue;
      }
      rendered.push({ kind: 'group', groupLabel: f.groupLabel, items: [f] });
      continue;
    }
    rendered.push({ kind: 'field', field: f });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit(async (values) => {
        if (honeypot) return;
        const payload: SubmissionPayload = {
          classificationId: topic.topicId,
          topicName: topic.name,
          submittedAt: new Date().toISOString(),
          fields: values as Record<string, unknown>,
          attachments: attachments.map((f) => ({
            name: f.name,
            sizeBytes: f.size,
            type: f.type,
          })),
          locationCoord: locationCoord || undefined,
          traceId: crypto.randomUUID(),
        };
        console.log('[portal] routing event', payload);
        await new Promise((r) => setTimeout(r, 300));
        onSubmitted(payload);
      })}
      className="max-w-2xl rounded-2xl border border-line bg-surface shadow-sm p-6 md:p-8 space-y-6"
      aria-labelledby="topic-heading"
    >
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="font-semibold uppercase tracking-[0.16em] text-brand-ink">
            Classification #{topic.topicId}
          </span>
          {topic.facets?.jurisdiction && (
            <>
              <span className="text-ink-meta">·</span>
              <span className="text-ink-meta">{JURISDICTION_LABELS[topic.facets.jurisdiction]}</span>
            </>
          )}
        </div>
        <h2
          id="topic-heading"
          tabIndex={-1}
          className="font-serif text-3xl font-semibold tracking-tight text-ink focus:outline-none"
        >
          {topic.name}
        </h2>
        {topic.description && (
          <p className="text-[15px] text-ink-secondary leading-relaxed">{topic.description}</p>
        )}
        {topic.contact && (
          <aside className="mt-3 rounded-xl border border-line bg-surface-muted p-4 text-sm text-ink-secondary">
            <p className="font-semibold text-ink mb-1">Prefer to contact directly?</p>
            <ul className="space-y-0.5">
              {topic.contact.website && (
                <li>
                  Website:{' '}
                  <a
                    href={topic.contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-ink font-semibold underline underline-offset-2"
                  >
                    {topic.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
              {topic.contact.email && (
                <li>
                  Email:{' '}
                  <a href={`mailto:${topic.contact.email}`} className="text-brand-ink font-semibold underline underline-offset-2">
                    {topic.contact.email}
                  </a>
                </li>
              )}
              {topic.contact.phone && (
                <li>
                  Phone:{' '}
                  <a href={`tel:${topic.contact.phone}`} className="text-brand-ink font-semibold underline underline-offset-2">
                    {topic.contact.phone}
                  </a>
                </li>
              )}
              {topic.contact.notes && <li className="text-ink-meta">{topic.contact.notes}</li>}
            </ul>
          </aside>
        )}
      </header>

      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-labelledby="error-summary-heading"
          className="flex gap-3 rounded-xl border border-line border-l-4 border-l-danger bg-danger-surface p-4 shadow-sm"
        >
          <span className="text-danger shrink-0 mt-0.5" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>
          </span>
          <div className="flex-1">
            <h3 id="error-summary-heading" className="text-sm font-semibold text-danger-ink">
              There {Object.keys(errors).length === 1 ? 'is 1 problem' : `are ${Object.keys(errors).length} problems`} with your submission
            </h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-danger-ink/90 space-y-0.5">
              {Object.entries(errors).map(([name, err]) => {
                const message = (err as { message?: string } | undefined)?.message;
                if (!message) return null;
                return (
                  <li key={name}>
                    <a href={`#f-${name}`} className="underline">
                      {message}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {rendered.map((item, idx) => {
        if (item.kind === 'group') {
          return (
            <fieldset
              key={`grp-${item.groupLabel}-${idx}`}
              className="border border-line rounded-xl p-4"
            >
              <legend className="px-2 text-sm font-semibold text-ink-strong">
                {item.groupLabel}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {item.items.map((f) => (
                  <FieldRenderer
                    key={f.name}
                    field={f}
                    required={isRequired(f)}
                    register={register}
                    error={
                      (errors as Record<string, { message?: string } | undefined>)[f.name]
                        ?.message
                    }
                  />
                ))}
              </div>
            </fieldset>
          );
        }
        const f = item.field;
        return (
          <div key={f.name}>
            <FieldRenderer
              field={f}
              required={isRequired(f)}
              register={register}
              error={
                (errors as Record<string, { message?: string } | undefined>)[f.name]?.message
              }
            />
            {f.name === 'location' && showMap && (
              <div className="mt-3">
                <MapPicker
                  value={locationCoord}
                  onChange={(coord, address) => {
                    setLocationCoord(coord);
                    if (address) {
                      // Fill the address input too
                      reset({ ...(watch() as Record<string, unknown>), location: address });
                    }
                  }}
                />
              </div>
            )}
          </div>
        );
      })}

      <ImageDropzone value={attachments} onChange={setAttachments} />

      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        name="website_url"
        className="absolute left-[-10000px] top-auto w-px h-px overflow-hidden"
      />

      <p className="text-xs text-ink-meta">
        Fields marked <span aria-hidden="true" className="text-danger-ink">*</span>{' '}
        <span className="sr-only">(required)</span> are required.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-hover px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50 min-h-11"
        >
          {isSubmitting ? 'Submitting…' : 'Submit request'}
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
          </span>
        </button>
        <button
          type="button"
          onClick={() => reset({ description: '' })}
          className="rounded-lg border border-line-stronger bg-surface px-4 py-2.5 text-sm font-semibold text-ink-strong hover:bg-surface-muted min-h-11"
        >
          Clear
        </button>
        <span className="text-xs text-ink-meta">
          Will route to the department that owns “{topic.name}”.
        </span>
      </div>
    </form>
  );
}

function FieldRenderer({
  field,
  register,
  error,
  required,
}: {
  field: VisibleField;
  register: UseFormRegister<Record<string, unknown>>;
  error?: string;
  required?: boolean;
}) {
  const id = `f-${field.name}`;
  const describedBy = error ? `${id}-error` : undefined;
  const label = field.label || field.name;
  const requiredMark = required ? (
    <>
      <span aria-hidden="true" className="text-danger-ink"> *</span>
      <span className="sr-only"> (required)</span>
    </>
  ) : null;

  if (field.type === 'textarea') {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-ink mb-1.5">
          {label}
          {requiredMark}
        </label>
        <textarea
          id={id}
          rows={5}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...register(field.name)}
          className="w-full rounded-lg border border-line-stronger bg-surface px-3 py-2.5 text-sm focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none"
        />
        <ErrorText id={`${id}-error`} error={error} />
      </div>
    );
  }

  if (field.type === 'select-one') {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-semibold text-ink mb-1.5">
          {label}
          {requiredMark}
        </label>
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...register(field.name)}
          className="w-full rounded-lg border border-line-stronger bg-surface px-3 py-2.5 text-sm focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none min-h-11"
        >
          <option value="">— Select —</option>
          {field.options?.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ErrorText id={`${id}-error`} error={error} />
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-start gap-2.5 text-sm text-ink-strong min-h-11">
        <input
          id={id}
          type="checkbox"
          {...register(field.name)}
          className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
        />
        <span>{label}</span>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink mb-1">
        {label}
        {requiredMark}
        {field.name === 'location' && (
          <span className="ml-2 text-xs font-normal text-ink-meta">
            (address or cross-street — map picker coming soon)
          </span>
        )}
      </label>
      <input
        id={id}
        type={field.type === 'date' ? 'date' : 'text'}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        {...register(field.name)}
        className="w-full rounded-lg border border-line-stronger bg-surface px-3 py-2.5 text-sm focus:border-brand-ink focus:ring-2 focus:ring-brand-ink/20 focus:outline-none min-h-11"
      />
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-danger-ink">
      {error}
    </p>
  );
}
