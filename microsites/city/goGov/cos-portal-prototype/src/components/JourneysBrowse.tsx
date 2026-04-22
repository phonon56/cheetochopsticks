import { useMemo, useState } from 'react';
import { getTopicsByJourney, topicsById } from '../data';
import { JOURNEY_LABELS } from '../data/facets';
import type { Journey, Topic } from '../types';
import { TopicListItem } from './TopicListItem';

interface Props {
  onPickTopic: (topicId: string) => void;
}

/**
 * Ordered walkthroughs: what steps should a resident take, in what order, for
 * each scenario. Steps reference topicIds that exist in the catalog.
 */
const STEPS: Record<Journey, Array<{ topicId: string; note: string }>> = {
  'building-a-home': [
    { topicId: 'permit-pprbd', note: 'Start here. PPRBD issues the building permit itself (separate agency).' },
    { topicId: 'permit-planning', note: 'Only if you need rezoning, a subdivision plat, or a variance.' },
    { topicId: 'permit-stormwater', note: 'Required for grading and construction sites with erosion risk.' },
    { topicId: 'permit-infrastructure', note: 'Only if your project touches the public right-of-way (curb cut, utility tie-in).' },
    { topicId: '61763', note: 'Separate permit if planting a tree in the City right-of-way.' },
  ],
  'opening-a-restaurant': [
    { topicId: 'permit-business-licensing', note: 'City business license is the core requirement.' },
    { topicId: 'permit-planning', note: 'Zoning check — make sure restaurant use is allowed at your location.' },
    { topicId: 'permit-fire-commercial', note: 'Commercial kitchen & hood suppression plan review.' },
    { topicId: 'permit-pprbd', note: 'Build-out permits (HVAC, electrical, plumbing) via PPRBD.' },
  ],
  'hosting-a-block-party': [
    { topicId: 'permit-public-works', note: 'Street closure / traffic control plan — apply at least 30 days out.' },
    { topicId: '61754', note: 'FYI: noise complaints still apply. Wrap by 10pm weeknights.' },
  ],
  'just-moved-here': [
    { topicId: '61724', note: 'General City contact — good for any question that doesn\'t fit elsewhere.' },
    { topicId: '61642', note: 'City Clerk — voter registration, elections, official City records.' },
    { topicId: '61747', note: 'Mountain Metro Transit — bus routes, passes, accessibility service.' },
  ],
  'dealing-with-a-neighbor': [
    { topicId: '61750', note: 'Start here for code violations, short-term rentals, junk, excessive vehicles on property.' },
    { topicId: '61754', note: 'For noise specifically — loud parties, persistent disturbances.' },
    { topicId: '61634', note: 'For a barking-dog situation — Animal Control handles it.' },
    { topicId: '63474', note: 'Abandoned vehicle on a City street (not a driveway).' },
    { topicId: '61730', note: 'Graffiti reports get tracked for cleanup.' },
  ],
  'recovering-from-a-crash': [
    { topicId: 'permit-police-records', note: 'Order the crash report from CSPD Records (paid, through Accela).' },
    { topicId: 'cora-police-records', note: 'CORA path if you need additional records (body cam, supplemental reports).' },
  ],
  'starting-a-business': [
    { topicId: '61710', note: 'Economic Development can orient you before licensing.' },
    { topicId: 'permit-business-licensing', note: 'Apply for the City business license.' },
  ],
};

export function JourneysBrowse({ onPickTopic }: Props) {
  const [journey, setJourney] = useState<Journey | null>(null);

  const orderedSteps = useMemo<Array<{ topic: Topic & { group?: string }; note: string }>>(() => {
    if (!journey) return [];
    return STEPS[journey]
      .map((s) => {
        const topic = topicsById.get(s.topicId);
        if (!topic) return null;
        return { topic, note: s.note };
      })
      .filter(Boolean) as Array<{ topic: Topic & { group?: string }; note: string }>;
  }, [journey]);

  if (!journey) {
    return (
      <section aria-labelledby="journeys-heading" className="space-y-4 max-w-3xl">
        <div>
          <h2 id="journeys-heading" className="text-xl font-semibold text-slate-900">
            Common scenarios
          </h2>
          <p className="text-sm text-slate-700 mt-1">
            Most real-life things touch more than one department. Pick a scenario to see
            the typical order of steps.
          </p>
        </div>
        <ul role="list" className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(JOURNEY_LABELS) as Journey[]).map((j) => {
            const count = (STEPS[j] ?? []).length || getTopicsByJourney(j).length;
            return (
              <li key={j}>
                <button
                  type="button"
                  onClick={() => setJourney(j)}
                  className="w-full text-left rounded-lg border border-slate-300 bg-white p-4 hover:border-blue-700 hover:bg-blue-50 min-h-20"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {JOURNEY_LABELS[j]}
                  </p>
                  <p className="text-sm text-slate-700 mt-1">
                    {count} step{count === 1 ? '' : 's'}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <section aria-labelledby="journey-heading" className="space-y-4 max-w-3xl">
      <nav aria-label="Breadcrumb" className="text-sm">
        <button type="button" onClick={() => setJourney(null)} className="text-blue-700 underline">
          ← All scenarios
        </button>
      </nav>
      <div>
        <h2 id="journey-heading" className="text-xl font-semibold text-slate-900">
          {JOURNEY_LABELS[journey]}
        </h2>
        <p className="text-sm text-slate-700 mt-1">
          {orderedSteps.length} step{orderedSteps.length === 1 ? '' : 's'} in the typical order.
        </p>
      </div>
      <ol className="space-y-3">
        {orderedSteps.map((step, i) => (
          <li key={step.topic.topicId} className="flex gap-3">
            <div
              aria-hidden="true"
              className="flex-none rounded-full bg-blue-700 text-white w-7 h-7 flex items-center justify-center text-sm font-semibold"
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-800">{step.note}</p>
              <ul role="list" className="mt-1">
                <TopicListItem topic={step.topic} onPickTopic={onPickTopic} />
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
