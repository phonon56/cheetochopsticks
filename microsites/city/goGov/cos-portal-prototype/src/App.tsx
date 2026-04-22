import { useEffect, useState } from 'react';
import { TopicNav } from './components/TopicNav';
import { TopicForm, type SubmissionPayload } from './components/TopicForm';
import { HomeTabs } from './components/HomeTabs';
import { ModeBar, MODES, type Mode } from './components/ModeBar';
import { GetInvolved } from './components/GetInvolved';
import { Performance } from './components/Performance';
import { RightNow } from './components/RightNow';
import { topicsById } from './data';
import { ADA_CONTACT } from './data/contacts';

function readIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const id = new URLSearchParams(window.location.search).get('classificationId');
  return id && topicsById.has(id) ? id : null;
}

function readModeFromUrl(): Mode {
  if (typeof window === 'undefined') return 'do';
  const m = new URLSearchParams(window.location.search).get('mode') as Mode | null;
  return m && (MODES as readonly string[]).includes(m) ? m : 'do';
}

export default function App() {
  const [mode, setMode] = useState<Mode>(() => readModeFromUrl());
  const [selectedId, setSelectedId] = useState<string | null>(() => readIdFromUrl());
  const [submitted, setSubmitted] = useState<SubmissionPayload | null>(null);
  const [sharedDescription, setSharedDescription] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const topic = mode === 'do' && selectedId ? topicsById.get(selectedId) : null;

  // Sync URL when mode or topic changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (mode !== 'do') params.set('mode', mode);
    else params.delete('mode');
    if (selectedId && mode === 'do') params.set('classificationId', selectedId);
    else params.delete('classificationId');
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? '?' + qs : ''}`;
    if (next !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', next);
    }
  }, [mode, selectedId]);

  // Respond to back/forward
  useEffect(() => {
    const handler = () => {
      setMode(readModeFromUrl());
      setSelectedId(readIdFromUrl());
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    if (topic) document.title = `${topic.name} — Contact the City — Colorado Springs`;
    else document.title = 'Contact the City — Colorado Springs';
  }, [topic]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">City of Colorado Springs</p>
            <p className="text-xs text-slate-600">Your Colorado Springs</p>
          </div>
          <button
            type="button"
            aria-expanded={mobileNavOpen}
            aria-controls="topic-nav"
            onClick={() => setMobileNavOpen((o) => !o)}
            className="md:hidden rounded-md border border-slate-300 px-3 py-2 text-sm min-h-11"
          >
            {mobileNavOpen ? 'Close' : 'Choose topic'}
          </button>
        </div>
      </header>

      <ModeBar mode={mode} onChange={setMode} />

      <div className="flex-1 md:grid md:grid-cols-[320px_1fr]">
        <aside
          id="topic-nav"
          className={[
            'md:sticky md:top-0 md:h-screen',
            mobileNavOpen ? 'block' : 'hidden md:block',
          ].join(' ')}
        >
          <TopicNav
            selectedId={selectedId}
            onSelect={(id) => {
              setMode('do');
              setSelectedId(id);
              setSubmitted(null);
              setMobileNavOpen(false);
              requestAnimationFrame(() => {
                const heading = document.getElementById('topic-heading');
                heading?.focus();
              });
            }}
          />
        </aside>
        <main id="main" tabIndex={-1} className="p-4 md:p-8">
          {(topic || submitted) && (
            <nav aria-label="Breadcrumb" className="mb-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedId(null);
                  setSubmitted(null);
                  setSharedDescription('');
                  requestAnimationFrame(() => {
                    document.getElementById('plain-language-heading')?.focus();
                  });
                }}
                className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 min-h-11"
              >
                <span aria-hidden="true">←</span> Home
              </button>
            </nav>
          )}
          {mode === 'do' && submitted ? (
            <Confirmation
              payload={submitted}
              onFileAnother={() => {
                setSubmitted(null);
                setSelectedId(null);
              }}
            />
          ) : mode === 'do' && topic ? (
            <TopicForm
              key={topic.topicId}
              topic={topic}
              sharedDescription={sharedDescription}
              onSharedDescriptionChange={setSharedDescription}
              onSubmitted={(p) => {
                setSubmitted(p);
                setSharedDescription('');
              }}
            />
          ) : mode === 'do' ? (
            <HomeTabs
              onPickTopic={(id) => {
                setSelectedId(id);
                setSubmitted(null);
                requestAnimationFrame(() => {
                  document.getElementById('topic-heading')?.focus();
                });
              }}
            />
          ) : mode === 'involved' ? (
            <GetInvolved />
          ) : mode === 'performance' ? (
            <Performance />
          ) : mode === 'now' ? (
            <RightNow />
          ) : (
            <ComingSoon mode={mode} />
          )}
        </main>
      </div>

      <AccessibilityFooter />
    </div>
  );
}

function ComingSoon({ mode }: { mode: Mode }) {
  const copy: Record<string, { title: string; body: string; notes?: string[] }> = {
    now: {
      title: 'Right now',
      body: 'Live City status — active snow operations, current road closures, today\'s trash/recycling, active emergency alerts, council meetings tonight.',
      notes: [
        'Trash/recycling by address (requires address lookup)',
        'Active closures from Public Works feed',
        'CORA response-time median this week',
        'Emergency alerts (OEM)',
      ],
    },
    built: {
      title: "What's being built",
      body: 'Capital improvement projects near you, upcoming land-use hearings, metro-district filings, annexations. Scoped by address.',
      notes: [
        'CIP project list with status',
        'Land-use hearings upcoming',
        'Metro-district formation filings',
      ],
    },
    performance: {
      title: "How we're doing",
      body: "Public receipts — the City's accountability surface. Audits, response times, ADA compliance scores, CORA fulfillment rates, service-request SLAs.",
      notes: [
        'goGov ADA audit (already published)',
        'CORA response-time median',
        '% of service requests closed within SLA',
        'ADA compliance score per department',
      ],
    },
    about: {
      title: 'About',
      body: 'Mayor, City Council, organization chart, official publications, annual reports.',
    },
  };
  const c = copy[mode];
  if (!c) return null;
  return (
    <section className="max-w-2xl space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-600">
          Coming next
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{c.title}</h1>
      </div>
      <p className="text-slate-700">{c.body}</p>
      {c.notes && (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-800">
          <p className="font-medium text-slate-900 mb-1">Planned surfaces</p>
          <ul className="list-disc pl-5 space-y-1">
            {c.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-slate-600">
        Not built yet. The mode bar exists so this lands in its right home when it ships.
      </p>
    </section>
  );
}

function Confirmation({
  payload,
  onFileAnother,
}: {
  payload: SubmissionPayload;
  onFileAnother: () => void;
}) {
  return (
    <div className="max-w-2xl space-y-4" role="status" aria-live="polite">
      <div className="rounded-lg border border-green-700 bg-green-50 p-5">
        <h2 className="text-xl font-semibold text-green-900">Request received</h2>
        <p className="text-sm text-green-900 mt-1">
          Your <strong>{payload.topicName}</strong> request was submitted.
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-green-900 font-medium">Trace ID</dt>
          <dd className="font-mono text-green-900">{payload.traceId}</dd>
          <dt className="text-green-900 font-medium">Classification</dt>
          <dd className="text-green-900">#{payload.classificationId}</dd>
          <dt className="text-green-900 font-medium">Submitted</dt>
          <dd className="text-green-900">
            {new Date(payload.submittedAt).toLocaleString()}
          </dd>
        </dl>
      </div>

      <details className="rounded-md border border-slate-200 bg-white p-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-900">
          Routing payload (what would be POSTed to the department system)
        </summary>
        <pre className="mt-2 overflow-x-auto text-xs text-slate-800">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>

      <button
        type="button"
        onClick={onFileAnother}
        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 min-h-11"
      >
        File another request
      </button>
    </div>
  );
}

function AccessibilityFooter() {
  return (
    <footer
      role="contentinfo"
      aria-label="Accessibility and language assistance"
      className="border-t border-slate-200 bg-white mt-8"
    >
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 text-sm text-slate-800 space-y-3">
        <h2 className="text-base font-semibold text-slate-900">
          Accessibility & language assistance
        </h2>
        <p>
          The City of Colorado Springs is committed to providing equal access to its
          programs, services, and activities in accordance with Title II of the
          Americans with Disabilities Act (ADA) and Section 504 of the Rehabilitation
          Act. If you need an accommodation, an alternate format, or language
          assistance to use this form, contact the{' '}
          <a
            href={ADA_CONTACT.website}
            className="text-blue-700 underline"
            target="_blank"
            rel="noreferrer"
          >
            {ADA_CONTACT.office}
          </a>
          :
        </p>
        <ul className="space-y-1">
          <li>
            <span className="font-medium">Email:</span>{' '}
            <a href={`mailto:${ADA_CONTACT.email}`} className="text-blue-700 underline">
              {ADA_CONTACT.email}
            </a>
          </li>
          <li>
            <span className="font-medium">Phone / TTY via Relay 711:</span>{' '}
            <a href={`tel:${ADA_CONTACT.phone.replace(/[^0-9+]/g, '')}`} className="text-blue-700 underline">
              {ADA_CONTACT.phone}
            </a>
          </li>
          <li>
            <span className="font-medium">Address:</span> {ADA_CONTACT.address}
          </li>
          <li>
            <a href={ADA_CONTACT.request} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              Request an ADA accommodation or service
            </a>
            {' · '}
            <a href={ADA_CONTACT.grievance} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              File an ADA / Section 504 grievance
            </a>
          </li>
        </ul>
        <p className="text-xs text-slate-600">
          Language access (Title VI of the Civil Rights Act): free translation and
          interpretation services are available. Request one from the address above or
          through the Language Access topic in the menu.
        </p>
      </div>
    </footer>
  );
}
