import { useState } from 'react';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  SEVERITY_COLORS,
  STATUS_LABELS,
  tiles,
  type Tile,
  type TileCategory,
  type TileStatus,
} from '../data/rightNow';

const STATUS_COLORS: Record<TileStatus, string> = {
  verified: 'bg-green-100 text-green-900 border-green-300',
  snapshot: 'bg-blue-100 text-blue-900 border-blue-300',
  illustrative: 'bg-amber-100 text-amber-900 border-amber-300',
};

const ZIP_RX = /^\d{5}(-\d{4})?$/;

export function RightNow() {
  const [address, setAddress] = useState('');
  const hasAddress = address.trim().length > 0;
  const zipLooksValid = ZIP_RX.test(address.trim());

  const activeTiles = tiles.filter((t) => t.active);
  const dormantTiles = tiles.filter((t) => !t.active);

  return (
    <section aria-labelledby="right-now-heading" className="space-y-6 max-w-4xl">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-600">Operational awareness</p>
        <h1 id="right-now-heading" className="text-3xl font-semibold text-slate-900">
          Right now.
        </h1>
        <p className="text-slate-700">
          What's happening in your city today. Tiles narrow to your address for location-specific
          information like trash day and nearby closures. Prototype values show the shape; a
          production build would pull from live feeds.
        </p>
      </div>

      <AddressBar value={address} onChange={setAddress} zipLooksValid={zipLooksValid} />

      {CATEGORY_ORDER.map((cat) => {
        const list = activeTiles.filter((t) => t.category === cat);
        if (!list.length) return null;
        return <CategorySection key={cat} category={cat} tiles={list} hasAddress={hasAddress} />;
      })}

      {dormantTiles.length > 0 && (
        <details className="rounded-md border border-slate-200 bg-white p-3 text-sm">
          <summary className="cursor-pointer font-medium text-slate-900">
            {dormantTiles.length} tile{dormantTiles.length === 1 ? '' : 's'} currently inactive
          </summary>
          <ul role="list" className="mt-2 space-y-2">
            {dormantTiles.map((t) => (
              <li key={t.id} className="rounded-md bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{t.title}</p>
                <p className="text-xs text-slate-700 mt-0.5">{t.subhead ?? 'No activity right now.'}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900 mb-1">Why this page exists</p>
        <p>
          Most civic sites hide operational information under "News" or "Alerts" tabs. Residents
          don't need a news site — they need one place to check what's relevant to them today.
          Address-aware tiles move the portal from a directory of services to a daily companion.
        </p>
      </div>
    </section>
  );
}

function AddressBar({
  value,
  onChange,
  zipLooksValid,
}: {
  value: string;
  onChange: (s: string) => void;
  zipLooksValid: boolean;
}) {
  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="rounded-md border border-slate-300 bg-slate-50 p-4 space-y-2"
    >
      <label htmlFor="right-now-address" className="block text-sm font-medium text-slate-900">
        Narrow to your address or zip
      </label>
      <p className="text-xs text-slate-700">
        Location-dependent tiles (trash day, nearby closures, nearby service requests) will filter
        to your neighborhood.
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          id="right-now-address"
          type="text"
          inputMode="text"
          autoComplete="street-address"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 80903 or 30 S Nevada Ave"
          className="flex-1 min-w-48 rounded-md border border-slate-400 px-3 py-2 text-sm focus:border-blue-700"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 hover:bg-slate-50 min-h-11"
          >
            Clear
          </button>
        )}
      </div>
      {value && !zipLooksValid && (
        <p className="text-xs text-slate-600" aria-live="polite">
          Using approximate location. Zip codes or full street addresses yield the best match.
        </p>
      )}
      {value && zipLooksValid && (
        <p className="text-xs text-green-800" aria-live="polite">
          Zip recognized — prototype will still show placeholder data, but this is the field that
          drives jurisdiction resolution in production.
        </p>
      )}
    </form>
  );
}

function CategorySection({
  category,
  tiles,
  hasAddress,
}: {
  category: TileCategory;
  tiles: Tile[];
  hasAddress: boolean;
}) {
  return (
    <section aria-labelledby={`cat-${category}`} className="space-y-3">
      <h2 id={`cat-${category}`} className="text-xl font-semibold text-slate-900">
        {CATEGORY_LABELS[category]}
      </h2>
      <ul role="list" className="grid gap-3 md:grid-cols-2">
        {tiles.map((t) => (
          <TileCard key={t.id} tile={t} hasAddress={hasAddress} />
        ))}
      </ul>
    </section>
  );
}

function TileCard({ tile, hasAddress }: { tile: Tile; hasAddress: boolean }) {
  const needsAddress = tile.locationDependent && !hasAddress;
  return (
    <li
      className={[
        'rounded-lg border-2 p-4 space-y-2',
        SEVERITY_COLORS[tile.severity],
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-900">{tile.title}</h3>
        <span
          className={[
            'flex-none rounded-full border px-2 py-0.5 text-xs font-medium',
            STATUS_COLORS[tile.status],
          ].join(' ')}
        >
          {STATUS_LABELS[tile.status]}
        </span>
      </div>
      <p className="text-2xl font-semibold text-slate-900">
        {needsAddress ? 'Enter address above' : tile.headline}
      </p>
      {tile.subhead && <p className="text-sm text-slate-800">{tile.subhead}</p>}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700 pt-1">
        <span>
          <span className="font-medium text-slate-900">As of:</span> {tile.asOf}
        </span>
        {tile.action && (
          <a
            href={tile.action.url}
            target={tile.action.url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="text-blue-700 underline"
          >
            {tile.action.label}{' '}
            {tile.action.url.startsWith('http') ? <span aria-hidden="true">↗</span> : null}
          </a>
        )}
        {tile.locationDependent && (
          <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-700">
            Address-aware
          </span>
        )}
      </div>
    </li>
  );
}
