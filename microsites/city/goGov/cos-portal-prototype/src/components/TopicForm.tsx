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
    <div className="max-w-2xl space-y-4">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-600">
          {d.kind === 'external' ? 'External destination' : 'Direct email'}
          {jurisdiction && (
            <>
              {' · '}
              <span>{JURISDICTION_LABELS[jurisdiction]}</span>
            </>
          )}
        </p>
        <h2
          id="topic-heading"
          tabIndex={-1}
          className="text-2xl font-semibold text-slate-900 focus:outline-none"
        >
          {topic.name}
        </h2>
        {topic.description && (
          <p className="text-sm text-slate-700">{topic.description}</p>
        )}
      </header>

      {d.kind === 'external' && d.warning && (
        <div
          role="note"
          className="rounded-md border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900"
        >
          <strong>Heads up:</strong> {d.warning}
        </div>
      )}

      {d.kind === 'external' ? (
        <a
          href={d.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 min-h-11"
        >
          {d.ctaLabel ?? `Continue to ${d.agency}`}
          <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <a
          href={`mailto:${d.address}${d.subjectTemplate ? '?subject=' + encodeURIComponent(d.subjectTemplate) : ''}`}
          className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 min-h-11"
        >
          {d.ctaLabel ?? `Email ${d.address}`}
        </a>
      )}

      {topic.contact && (
        <aside className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900 mb-1">Contact details</p>
          <ul className="space-y-0.5">
            {topic.contact.website && (
              <li>
                Website:{' '}
                <a
                  href={topic.contact.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline"
                >
                  {topic.contact.website.replace(/^https?:\/\//, '')}
                </a>
              </li>
            )}
            {topic.contact.email && (
              <li>
                Email:{' '}
                <a href={`mailto:${topic.contact.email}`} className="text-blue-700 underline">
                  {topic.contact.email}
                </a>
              </li>
            )}
            {topic.contact.phone && (
              <li>
                Phone:{' '}
                <a
                  href={`tel:${topic.contact.phone.replace(/[^0-9+]/g, '')}`}
                  className="text-blue-700 underline"
                >
                  {topic.contact.phone}
                </a>
              </li>
            )}
            {topic.contact.notes && <li className="text-slate-700">{topic.contact.notes}</li>}
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
      className="space-y-5 max-w-2xl"
      aria-labelledby="topic-heading"
    >
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-600">
          Classification #{topic.topicId}
          {topic.facets?.jurisdiction && (
            <>
              {' · '}
              <span>{JURISDICTION_LABELS[topic.facets.jurisdiction]}</span>
            </>
          )}
        </p>
        <h2
          id="topic-heading"
          tabIndex={-1}
          className="text-2xl font-semibold text-slate-900 focus:outline-none"
        >
          {topic.name}
        </h2>
        {topic.description && (
          <p className="text-sm text-slate-600">{topic.description}</p>
        )}
        {topic.contact && (
          <aside className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-800 mb-1">Prefer to contact directly?</p>
            <ul className="space-y-0.5">
              {topic.contact.website && (
                <li>
                  Website:{' '}
                  <a
                    href={topic.contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 underline"
                  >
                    {topic.contact.website.replace(/^https?:\/\//, '')}
                  </a>
                </li>
              )}
              {topic.contact.email && (
                <li>
                  Email:{' '}
                  <a href={`mailto:${topic.contact.email}`} className="text-blue-700 underline">
                    {topic.contact.email}
                  </a>
                </li>
              )}
              {topic.contact.phone && (
                <li>
                  Phone:{' '}
                  <a href={`tel:${topic.contact.phone}`} className="text-blue-700 underline">
                    {topic.contact.phone}
                  </a>
                </li>
              )}
              {topic.contact.notes && <li className="text-slate-600">{topic.contact.notes}</li>}
            </ul>
          </aside>
        )}
      </header>

      {Object.keys(errors).length > 0 && (
        <div
          role="alert"
          aria-labelledby="error-summary-heading"
          className="rounded-md border border-red-700 bg-red-50 p-4"
        >
          <h3 id="error-summary-heading" className="text-sm font-semibold text-red-900">
            There {Object.keys(errors).length === 1 ? 'is 1 problem' : `are ${Object.keys(errors).length} problems`} with your submission
          </h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-900 space-y-0.5">
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
      )}

      {rendered.map((item, idx) => {
        if (item.kind === 'group') {
          return (
            <fieldset
              key={`grp-${item.groupLabel}-${idx}`}
              className="border border-slate-200 rounded-md p-4"
            >
              <legend className="px-2 text-sm font-medium text-slate-800">
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

      <p className="text-xs text-slate-600">
        Fields marked <span aria-hidden="true" className="text-red-700">*</span>{' '}
        <span className="sr-only">(required)</span> are required.
      </p>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 min-h-11"
        >
          {isSubmitting ? 'Submitting…' : 'Submit request'}
        </button>
        <button
          type="button"
          onClick={() => reset({ description: '' })}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50 min-h-11"
        >
          Clear form
        </button>
        <span className="text-xs text-slate-600">
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
      <span aria-hidden="true" className="text-red-700"> *</span>
      <span className="sr-only"> (required)</span>
    </>
  ) : null;

  if (field.type === 'textarea') {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-1">
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
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm focus:border-blue-700"
        />
        <ErrorText id={`${id}-error`} error={error} />
      </div>
    );
  }

  if (field.type === 'select-one') {
    return (
      <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-1">
          {label}
          {requiredMark}
        </label>
        <select
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...register(field.name)}
          className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm bg-white focus:border-blue-700 min-h-11"
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
      <label className="flex items-start gap-2 text-sm text-slate-900 min-h-11">
        <input
          id={id}
          type="checkbox"
          {...register(field.name)}
          className="mt-1 h-4 w-4"
        />
        <span>{label}</span>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900 mb-1">
        {label}
        {requiredMark}
        {field.name === 'location' && (
          <span className="ml-2 text-xs font-normal text-slate-600">
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
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600"
      />
      <ErrorText id={`${id}-error`} error={error} />
    </div>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-700">
      {error}
    </p>
  );
}
