import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  receipts,
  STATUS_LABELS,
  TREND_LABELS,
  type Receipt,
  type ReceiptCategory,
  type ReceiptStatus,
} from '../data/performance';

const STATUS_COLORS: Record<ReceiptStatus, string> = {
  verified: 'bg-success-surface text-success-ink border-success',
  snapshot: 'bg-info-surface text-info-ink border-info',
  illustrative: 'bg-warning-surface text-warning-ink border-warning',
};

export function Performance() {
  const counts = receipts.reduce<Record<ReceiptStatus, number>>(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    { verified: 0, snapshot: 0, illustrative: 0 },
  );

  return (
    <section aria-labelledby="performance-heading" className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-ink-meta">
          Public receipts
        </p>
        <h1 id="performance-heading" className="text-3xl font-semibold text-ink">
          How we're doing.
        </h1>
        <p className="text-ink-secondary">
          The numbers behind the service. Audits, response times, compliance scores —
          the kind of information most civic sites bury. Every receipt is tagged with
          its status so you can tell what's live, what's a snapshot, and what's a
          placeholder waiting for the real feed.
        </p>
      </div>

      <div className="rounded-md border border-line-strong bg-surface-muted p-3 text-sm">
        <p className="font-medium text-ink">Receipts shown: {receipts.length}</p>
        <ul className="flex flex-wrap gap-3 mt-1 text-xs text-ink-strong">
          <li>
            <StatusBadge status="verified" /> {counts.verified} live & verified
          </li>
          <li>
            <StatusBadge status="snapshot" /> {counts.snapshot} point-in-time
          </li>
          <li>
            <StatusBadge status="illustrative" /> {counts.illustrative} prototype
            placeholders awaiting a live feed
          </li>
        </ul>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const list = receipts.filter((r) => r.category === cat);
        if (!list.length) return null;
        return <CategorySection key={cat} category={cat} receipts={list} />;
      })}

      <div className="rounded-md border border-line bg-surface p-4 text-sm text-ink-secondary">
        <p className="font-medium text-ink mb-1">Why this page exists</p>
        <p>
          Residents deserve to see the numbers that describe how their city is doing,
          not just what their city offers. Building the portal as the measurement
          instrument itself means the metrics are defensible — produced by the same
          pipes that accept service requests, records requests, and ADA accommodation
          requests. Until those pipes produce live data, the prototype placeholders
          describe what we will measure when they do.
        </p>
      </div>
    </section>
  );
}

function CategorySection({
  category,
  receipts,
}: {
  category: ReceiptCategory;
  receipts: Receipt[];
}) {
  return (
    <section aria-labelledby={`cat-${category}`} className="space-y-3">
      <h2 id={`cat-${category}`} className="text-xl font-semibold text-ink">
        {CATEGORY_LABELS[category]}
      </h2>
      <ul role="list" className="grid gap-3 md:grid-cols-2">
        {receipts.map((r) => (
          <ReceiptCard key={r.id} receipt={r} />
        ))}
      </ul>
    </section>
  );
}

function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const trend = receipt.trend && receipt.trend !== 'unknown' ? receipt.trend : null;
  return (
    <li className="rounded-lg border border-line bg-surface p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-ink">{receipt.title}</h3>
        <StatusBadge status={receipt.status} />
      </div>
      <p className="text-2xl font-semibold text-ink">
        {receipt.headline}
        {trend && (
          <span
            className={[
              'ml-2 text-sm font-normal',
              trend === 'better'
                ? 'text-success-ink'
                : trend === 'worse'
                  ? 'text-danger-ink'
                  : 'text-ink-meta',
            ].join(' ')}
          >
            <span aria-hidden="true">{TREND_LABELS[trend].label}</span>
            <span className="sr-only">{TREND_LABELS[trend].sr}</span>
          </span>
        )}
      </p>
      {receipt.subhead && (
        <p className="text-sm text-ink-secondary">{receipt.subhead}</p>
      )}
      {receipt.target && (
        <p className="text-xs text-ink-secondary">
          <span className="font-medium text-ink">Target:</span> {receipt.target}
        </p>
      )}
      {receipt.method && (
        <p className="text-xs text-ink-meta italic">{receipt.method}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-secondary pt-1">
        <span>
          <span className="font-medium text-ink">As of:</span> {receipt.asOf}
        </span>
        {receipt.source && (
          <a
            href={receipt.source.url}
            target={receipt.source.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="text-brand-ink underline"
          >
            {receipt.source.label} {receipt.source.url.startsWith('http') ? '↗' : ''}
          </a>
        )}
      </div>
    </li>
  );
}

function StatusBadge({ status }: { status: ReceiptStatus }) {
  return (
    <span
      className={[
        'flex-none rounded-full border px-2 py-0.5 text-xs font-medium',
        STATUS_COLORS[status],
      ].join(' ')}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
