import { useEffect, useState } from 'react';
import { TopicNav } from './components/TopicNav';
import { TopicForm, type SubmissionPayload } from './components/TopicForm';
import { HomeTabs } from './components/HomeTabs';
import { ModeBar, MODES, type Mode } from './components/ModeBar';
import { GetHelp } from './components/GetHelp';
import { GetInvolved } from './components/GetInvolved';
import { Performance } from './components/Performance';
import { RightNow } from './components/RightNow';
import { WhatsBeingBuilt } from './components/WhatsBeingBuilt';
import { About } from './components/About';
import { NotificationCenter } from './components/NotificationCenter';
import { topicsById } from './data';
import { ADA_CONTACT } from './data/contacts';
import logoUrl from './assets/logo_0.png';

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

  const peakRibbon = (
    <div
      aria-hidden="true"
      className="h-1.5 w-full"
      style={{
        background:
          'linear-gradient(90deg,#00943a 0 20%,#0074c8 20% 40%,#c61f6e 40% 60%,#ea0d44 60% 80%,#fea30b 80% 100%)',
      }}
    />
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col">
      {peakRibbon}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 md:px-8 py-3.5 flex items-center justify-between gap-4">
          <img
            src={logoUrl}
            alt="City of Colorado Springs — Olympic City USA"
            className="h-11 w-auto"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={mobileNavOpen}
              aria-controls="topic-nav"
              onClick={() => setMobileNavOpen((o) => !o)}
              className="md:hidden rounded-lg border border-line-stronger bg-surface px-3.5 py-2 text-sm font-semibold text-ink-strong hover:border-brand-ink hover:text-brand-ink min-h-11"
            >
              {mobileNavOpen ? 'Close' : 'Choose topic'}
            </button>
          </div>
        </div>
      </header>

      <ModeBar mode={mode} onChange={setMode} />

      <div className="flex-1 mx-auto w-full max-w-6xl px-5 md:px-8 py-8 md:py-10 md:grid md:grid-cols-[250px_1fr] md:gap-10">
        <aside
          id="topic-nav"
          className={[
            'md:sticky md:top-4 md:self-start',
            mobileNavOpen ? 'block mb-6' : 'hidden md:block',
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
        <main id="main" tabIndex={-1} className="min-w-0">
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
                className="inline-flex items-center gap-1 rounded-lg border border-line-stronger bg-surface px-3.5 py-2 text-sm font-semibold text-ink-strong hover:border-brand-ink hover:text-brand-ink min-h-11"
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
          ) : mode === 'help' ? (
            <GetHelp onPickMode={(m) => setMode(m)} />
          ) : mode === 'involved' ? (
            <GetInvolved />
          ) : mode === 'performance' ? (
            <Performance />
          ) : mode === 'now' ? (
            <RightNow />
          ) : mode === 'built' ? (
            <WhatsBeingBuilt />
          ) : mode === 'about' ? (
            <About />
          ) : mode === 'notifications' ? (
            <NotificationCenter />
          ) : (
            <ComingSoon mode={mode} />
          )}
        </main>
      </div>

      <AccessibilityFooter />
      {peakRibbon}
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
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-ink">
          Coming next
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink mt-1">{c.title}</h1>
      </div>
      <p className="text-[15px] text-ink-secondary leading-relaxed">{c.body}</p>
      {c.notes && (
        <div className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-strong shadow-sm">
          <p className="font-semibold text-ink mb-1">Planned surfaces</p>
          <ul className="list-disc pl-5 space-y-1 text-ink-secondary">
            {c.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-ink-meta">
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
      <div className="flex gap-3 rounded-xl border border-line border-l-4 border-l-success bg-success-surface p-5 shadow-sm">
        <span className="text-success shrink-0 mt-0.5" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m20 6-11 11-5-5" /></svg>
        </span>
        <div className="flex-1">
          <h2 className="font-serif text-xl font-semibold text-success-ink">Request received</h2>
          <p className="text-sm text-success-ink/90 mt-1">
            Your <strong>{payload.topicName}</strong> request was submitted.
          </p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-success-ink font-semibold">Trace ID</dt>
            <dd className="font-mono text-success-ink">{payload.traceId}</dd>
            <dt className="text-success-ink font-semibold">Classification</dt>
            <dd className="text-success-ink">#{payload.classificationId}</dd>
            <dt className="text-success-ink font-semibold">Submitted</dt>
            <dd className="text-success-ink">
              {new Date(payload.submittedAt).toLocaleString()}
            </dd>
          </dl>
        </div>
      </div>

      <details className="rounded-xl border border-line bg-surface p-4 text-sm shadow-sm">
        <summary className="cursor-pointer font-semibold text-ink">
          Routing payload (what would be POSTed to the department system)
        </summary>
        <pre className="mt-2 overflow-x-auto text-xs text-ink-strong">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>

      <button
        type="button"
        onClick={onFileAnother}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-hover px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark min-h-11"
      >
        File another request
        <span aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6" /></svg>
        </span>
      </button>
    </div>
  );
}

function AccessibilityFooter() {
  return (
    <footer
      role="contentinfo"
      aria-label="Accessibility and language assistance"
      className="border-t border-line bg-surface mt-8"
    >
      <div className="mx-auto max-w-6xl px-5 md:px-8 py-8 text-sm text-ink-secondary space-y-3">
        <h2 className="font-serif text-lg font-semibold text-ink">
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
            className="text-brand-ink font-semibold underline underline-offset-2"
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
            <a href={`mailto:${ADA_CONTACT.email}`} className="text-brand-ink font-semibold underline underline-offset-2">
              {ADA_CONTACT.email}
            </a>
          </li>
          <li>
            <span className="font-medium">Phone / TTY via Relay 711:</span>{' '}
            <a href={`tel:${ADA_CONTACT.phone.replace(/[^0-9+]/g, '')}`} className="text-brand-ink font-semibold underline underline-offset-2">
              {ADA_CONTACT.phone}
            </a>
          </li>
          <li>
            <span className="font-medium">Address:</span> {ADA_CONTACT.address}
          </li>
          <li>
            <a href={ADA_CONTACT.request} target="_blank" rel="noreferrer" className="text-brand-ink font-semibold underline underline-offset-2">
              Request an ADA accommodation or service
            </a>
            {' · '}
            <a href={ADA_CONTACT.grievance} target="_blank" rel="noreferrer" className="text-brand-ink font-semibold underline underline-offset-2">
              File an ADA / Section 504 grievance
            </a>
          </li>
        </ul>
        <p className="text-xs text-ink-meta">
          Language access (Title VI of the Civil Rights Act): free translation and
          interpretation services are available. Request one from the address above or
          through the Language Access topic in the menu.
        </p>
      </div>
    </footer>
  );
}
