import type { Jurisdiction } from '../types';
import { JURISDICTION_SHORT, JURISDICTION_DOT } from '../data/facets';

/**
 * Jurisdiction legend chip: a neutral pill with a small color dot. The dot color
 * comes from the city's "Olympic City" peak palette (see JURISDICTION_DOT), so
 * the level of government is identifiable at a glance while the chip itself stays
 * calm and on-brand. The text label carries the meaning, so color is never the
 * only signal (WCAG 1.4.1); the dot is decorative and hidden from assistive tech.
 */
export function JurisdictionTag({ jurisdiction }: { jurisdiction: Jurisdiction }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-2 py-0.5 text-xs font-medium text-ink-secondary"
      aria-label={`Jurisdiction: ${JURISDICTION_SHORT[jurisdiction]}`}
    >
      <span
        aria-hidden="true"
        className={['h-1.5 w-1.5 rounded-full', JURISDICTION_DOT[jurisdiction]].join(' ')}
      />
      {JURISDICTION_SHORT[jurisdiction]}
    </span>
  );
}
