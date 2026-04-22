import { useEffect, useMemo, useState } from 'react';
import {
  loadSubscriptions,
  resolveJurisdictionsForZip,
  saveSubscriptions,
  summarizeSpec,
  ZIP_CATEGORY_LABELS,
  type DeliveryChannel,
  type Subscription,
  type SubscriptionKind,
  type ZipCategory,
} from '../data/notifications';
import { JURISDICTION_LABELS } from '../data/facets';

type NewKind =
  | 'newsletter'
  | 'zipcode-alerts'
  | 'project-updates'
  | 'dashboard-threshold';

export function NotificationCenter() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [email, setEmail] = useState('');
  const [channels, setChannels] = useState<Set<DeliveryChannel>>(new Set(['email']));

  useEffect(() => {
    setSubs(loadSubscriptions());
  }, []);

  function persist(next: Subscription[]) {
    setSubs(next);
    saveSubscriptions(next);
  }

  function add(spec: SubscriptionKind, zip?: string) {
    if (!email && !channels.has('push')) return;
    const sub: Subscription = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      email: email || undefined,
      channels: [...channels],
      spec,
      resolvedJurisdictions: zip ? resolveJurisdictionsForZip(zip) : undefined,
    };
    persist([...subs, sub]);
  }

  function remove(id: string) {
    persist(subs.filter((s) => s.id !== id));
  }

  return (
    <section aria-labelledby="notif-heading" className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-600">Subscriptions</p>
        <h1 id="notif-heading" className="text-3xl font-semibold text-slate-900">
          Notifications.
        </h1>
        <p className="text-slate-700">
          One place to manage how the City stays in touch with you — newsletters,
          zipcode-specific alerts, volunteer matches, project updates, and accountability
          dashboard changes. Zipcode subscriptions narrow automatically to the jurisdictions
          that actually apply to your address.
        </p>
      </div>

      <ChannelSetup
        email={email}
        onEmail={setEmail}
        channels={channels}
        onChannels={setChannels}
      />

      <ActiveSubscriptions subs={subs} onRemove={remove} />

      <NewSubscriptionFlow onAdd={add} channels={channels} email={email} />

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900 mb-1">Why this page exists</p>
        <p>
          Subscriptions are the spine of a civic relationship. A one-way directory tells you
          what exists. Subscriptions tell you when what exists changes — a pothole you
          reported is closed; the rezoning down the street goes to hearing; an ADA
          accommodation policy you cared about is published. In a production build,
          zipcode-driven subscriptions tie directly to the jurisdiction resolver so you
          subscribe once and get every relevant agency, from City to school district to water
          advisory, without knowing which is which.
        </p>
      </div>
    </section>
  );
}

function ChannelSetup({
  email,
  onEmail,
  channels,
  onChannels,
}: {
  email: string;
  onEmail: (s: string) => void;
  channels: Set<DeliveryChannel>;
  onChannels: (s: Set<DeliveryChannel>) => void;
}) {
  function toggle(c: DeliveryChannel) {
    const next = new Set(channels);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    onChannels(next);
  }

  return (
    <section
      aria-labelledby="channels-heading"
      className="rounded-md border border-slate-300 bg-slate-50 p-4 space-y-3"
    >
      <h2 id="channels-heading" className="text-base font-semibold text-slate-900">
        How should we reach you?
      </h2>
      <div>
        <label htmlFor="notif-email" className="block text-sm font-medium text-slate-900">
          Email
        </label>
        <input
          id="notif-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => onEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-md border border-slate-400 px-3 py-2 text-sm focus:border-blue-700"
        />
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-900 mb-1">Channels</legend>
        <ul role="list" className="flex flex-wrap gap-2">
          {(['email', 'sms', 'push'] as DeliveryChannel[]).map((c) => (
            <li key={c}>
              <label className="inline-flex items-center gap-2 text-sm text-slate-800 min-h-8">
                <input
                  type="checkbox"
                  checked={channels.has(c)}
                  onChange={() => toggle(c)}
                  className="h-4 w-4"
                />
                {c === 'email' ? 'Email' : c === 'sms' ? 'Text / SMS' : 'Browser push'}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
    </section>
  );
}

function ActiveSubscriptions({
  subs,
  onRemove,
}: {
  subs: Subscription[];
  onRemove: (id: string) => void;
}) {
  if (subs.length === 0) {
    return (
      <section
        aria-labelledby="active-heading"
        className="rounded-md border border-slate-200 bg-white p-4"
      >
        <h2 id="active-heading" className="text-base font-semibold text-slate-900">
          Your subscriptions
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          None yet. Add one below — nothing is actually sent in the prototype, but every
          sub is saved to browser storage so you can see the shape.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="active-heading" className="space-y-2">
      <h2 id="active-heading" className="text-base font-semibold text-slate-900">
        Your subscriptions ({subs.length})
      </h2>
      <ul role="list" className="space-y-2">
        {subs.map((s) => (
          <li
            key={s.id}
            className="rounded-md border border-slate-200 bg-white p-3 space-y-1"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">
                {summarizeSpec(s.spec)}
              </p>
              <button
                type="button"
                onClick={() => onRemove(s.id)}
                aria-label={`Remove subscription: ${summarizeSpec(s.spec)}`}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 hover:bg-slate-50 min-h-8"
              >
                Remove
              </button>
            </div>
            <p className="text-xs text-slate-700">
              {s.email && <>Delivered to {s.email} · </>}
              {s.channels.join(', ')}
            </p>
            {s.resolvedJurisdictions && s.resolvedJurisdictions.length > 0 && (
              <p className="text-xs text-slate-700">
                <span className="font-medium text-slate-900">Jurisdictions:</span>{' '}
                {s.resolvedJurisdictions
                  .map((j) => JURISDICTION_LABELS[j])
                  .join(' · ')}
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function NewSubscriptionFlow({
  onAdd,
  channels,
  email,
}: {
  onAdd: (spec: SubscriptionKind, zip?: string) => void;
  channels: Set<DeliveryChannel>;
  email: string;
}) {
  const [kind, setKind] = useState<NewKind>('newsletter');
  const canSubmit = email.trim().length > 0 && channels.size > 0;

  return (
    <section
      aria-labelledby="new-heading"
      className="rounded-md border border-slate-300 bg-white p-4 space-y-4"
    >
      <div>
        <h2 id="new-heading" className="text-base font-semibold text-slate-900">
          Add a subscription
        </h2>
        <p className="text-xs text-slate-700 mt-0.5">
          Pick a kind. Add as many as you want. Everything saves locally for the prototype.
        </p>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-slate-900 mb-1">Kind</legend>
        <ul role="list" className="flex flex-wrap gap-2">
          {(
            [
              ['newsletter', 'Newsletter'],
              ['zipcode-alerts', 'Zipcode alerts'],
              ['project-updates', 'Specific project'],
              ['dashboard-threshold', 'Dashboard metric'],
            ] as Array<[NewKind, string]>
          ).map(([k, lbl]) => (
            <li key={k}>
              <button
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={[
                  'rounded-full border px-3 py-1 text-xs min-h-8',
                  kind === k
                    ? 'border-blue-700 bg-blue-700 text-white font-medium'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
                ].join(' ')}
              >
                {lbl}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      {!canSubmit && (
        <p className="rounded-md border border-amber-400 bg-amber-50 p-2 text-xs text-amber-900">
          Add an email and pick at least one channel above first.
        </p>
      )}

      {kind === 'newsletter' && <NewsletterForm onAdd={onAdd} disabled={!canSubmit} />}
      {kind === 'zipcode-alerts' && <ZipcodeForm onAdd={onAdd} disabled={!canSubmit} />}
      {kind === 'project-updates' && <ProjectUpdatesForm onAdd={onAdd} disabled={!canSubmit} />}
      {kind === 'dashboard-threshold' && (
        <DashboardThresholdForm onAdd={onAdd} disabled={!canSubmit} />
      )}
    </section>
  );
}

function NewsletterForm({
  onAdd,
  disabled,
}: {
  onAdd: (spec: SubscriptionKind) => void;
  disabled: boolean;
}) {
  const [cadence, setCadence] = useState<'weekly' | 'monthly'>('monthly');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({ kind: 'newsletter', cadence });
      }}
      className="space-y-2"
    >
      <fieldset>
        <legend className="text-sm font-medium text-slate-900 mb-1">Cadence</legend>
        <ul role="list" className="flex gap-2">
          {(['weekly', 'monthly'] as const).map((c) => (
            <li key={c}>
              <label className="inline-flex items-center gap-2 text-sm text-slate-800 min-h-8">
                <input
                  type="radio"
                  name="cadence"
                  checked={cadence === c}
                  onChange={() => setCadence(c)}
                  className="h-4 w-4"
                />
                {c === 'weekly' ? 'Weekly' : 'Monthly'}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 min-h-11"
      >
        Subscribe
      </button>
    </form>
  );
}

function ZipcodeForm({
  onAdd,
  disabled,
}: {
  onAdd: (spec: SubscriptionKind, zip?: string) => void;
  disabled: boolean;
}) {
  const [zip, setZip] = useState('');
  const [cats, setCats] = useState<Set<ZipCategory>>(new Set(['emergency']));
  const resolved = useMemo(
    () => (zip.length >= 5 ? resolveJurisdictionsForZip(zip) : []),
    [zip],
  );

  function toggleCat(c: ZipCategory) {
    const next = new Set(cats);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setCats(next);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!zip || cats.size === 0) return;
        onAdd(
          { kind: 'zipcode-alerts', zipcode: zip, categories: [...cats] },
          zip,
        );
      }}
      className="space-y-2"
    >
      <label htmlFor="zip-input" className="block text-sm font-medium text-slate-900">
        Your zipcode
      </label>
      <input
        id="zip-input"
        type="text"
        inputMode="numeric"
        autoComplete="postal-code"
        pattern="[0-9]{5}"
        value={zip}
        onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
        placeholder="e.g. 80903"
        className="w-full max-w-48 rounded-md border border-slate-400 px-3 py-2 text-sm focus:border-blue-700"
      />
      {resolved.length > 0 && (
        <p role="status" aria-live="polite" className="text-xs text-slate-700">
          <span className="font-medium text-slate-900">Your jurisdictions:</span>{' '}
          {resolved.map((j) => JURISDICTION_LABELS[j]).join(' · ')}. Alerts narrow to these
          automatically.
        </p>
      )}
      <fieldset>
        <legend className="text-sm font-medium text-slate-900 mb-1">
          Which kinds of alerts?
        </legend>
        <ul role="list" className="flex flex-wrap gap-1.5">
          {(Object.keys(ZIP_CATEGORY_LABELS) as ZipCategory[]).map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => toggleCat(c)}
                aria-pressed={cats.has(c)}
                className={[
                  'rounded-full border px-3 py-1 text-xs min-h-8',
                  cats.has(c)
                    ? 'border-blue-700 bg-blue-700 text-white font-medium'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50',
                ].join(' ')}
              >
                {ZIP_CATEGORY_LABELS[c]}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>
      <button
        type="submit"
        disabled={disabled || !zip || cats.size === 0}
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 min-h-11"
      >
        Subscribe
      </button>
    </form>
  );
}

function ProjectUpdatesForm({
  onAdd,
  disabled,
}: {
  onAdd: (spec: SubscriptionKind) => void;
  disabled: boolean;
}) {
  const [projectId, setProjectId] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!projectId) return;
        onAdd({ kind: 'project-updates', projectId });
      }}
      className="space-y-2"
    >
      <label htmlFor="project-id" className="block text-sm font-medium text-slate-900">
        Project ID (find one on "What's being built")
      </label>
      <input
        id="project-id"
        type="text"
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        placeholder="e.g. cip-union-blvd"
        className="w-full rounded-md border border-slate-400 px-3 py-2 text-sm focus:border-blue-700"
      />
      <button
        type="submit"
        disabled={disabled || !projectId}
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 min-h-11"
      >
        Subscribe
      </button>
    </form>
  );
}

function DashboardThresholdForm({
  onAdd,
  disabled,
}: {
  onAdd: (spec: SubscriptionKind) => void;
  disabled: boolean;
}) {
  const [metricId, setMetricId] = useState('portal-wcag');
  const [trigger, setTrigger] = useState<'any-change' | 'goes-worse' | 'goes-better'>(
    'goes-worse',
  );
  const metrics = [
    { id: 'portal-wcag', label: 'Portal accessibility (WCAG)' },
    { id: 'cora-response-median', label: 'CORA median response' },
    { id: 'cora-fulfillment-rate', label: 'CORA fulfillment rate' },
    { id: 'pothole-sla', label: 'Pothole SLA' },
    { id: 'graffiti-cleanup', label: 'Graffiti cleanup time' },
  ];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd({ kind: 'dashboard-threshold', metricId, trigger });
      }}
      className="space-y-2"
    >
      <div>
        <label htmlFor="metric-pick" className="block text-sm font-medium text-slate-900">
          Metric
        </label>
        <select
          id="metric-pick"
          value={metricId}
          onChange={(e) => setMetricId(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-400 px-3 py-2 text-sm bg-white focus:border-blue-700 min-h-11"
        >
          {metrics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <fieldset>
        <legend className="text-sm font-medium text-slate-900 mb-1">Notify me when</legend>
        <ul role="list" className="space-y-1">
          {(
            [
              ['any-change', 'Any change'],
              ['goes-worse', 'It gets worse'],
              ['goes-better', 'It gets better'],
            ] as const
          ).map(([v, lbl]) => (
            <li key={v}>
              <label className="inline-flex items-center gap-2 text-sm text-slate-800 min-h-8">
                <input
                  type="radio"
                  name="trigger"
                  checked={trigger === v}
                  onChange={() => setTrigger(v)}
                  className="h-4 w-4"
                />
                {lbl}
              </label>
            </li>
          ))}
        </ul>
      </fieldset>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50 min-h-11"
      >
        Subscribe
      </button>
    </form>
  );
}
