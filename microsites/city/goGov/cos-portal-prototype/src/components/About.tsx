interface Link {
  label: string;
  url: string;
  note?: string;
}

const LEADERSHIP: Link[] = [
  {
    label: 'Mayor',
    url: 'https://coloradosprings.gov/mayor',
    note: 'Elected executive of the City.',
  },
  {
    label: 'City Council',
    url: 'https://coloradosprings.gov/city-council',
    note: 'Nine-member legislative body (six district seats + three at-large).',
  },
  {
    label: 'City Attorney',
    url: 'https://coloradosprings.gov/city-attorney',
    note: 'Chief legal officer for the City.',
  },
  {
    label: 'City Auditor',
    url: 'https://coloradosprings.gov/city-auditor',
    note: 'Independent audit office reporting to Council.',
  },
  {
    label: 'City Clerk',
    url: 'https://coloradosprings.gov/city-clerk',
    note: 'Custodian of official records; elections support.',
  },
];

const GOVERNANCE: Link[] = [
  {
    label: 'City Charter',
    url: 'https://coloradosprings.gov/city-clerk/page/city-charter',
    note: 'The foundational governing document of Colorado Springs.',
  },
  {
    label: 'Municipal Code',
    url: 'https://codelibrary.amlegal.com/codes/coloradospringsco/latest/overview',
    note: 'Searchable, authoritative version of City ordinances.',
  },
  {
    label: 'Council meeting schedule & minutes',
    url: 'https://coloradosprings.gov/city-council',
    note: 'Agendas, livestreams, and archived minutes for every meeting.',
  },
  {
    label: 'Boards, commissions & committees',
    url: 'https://coloradosprings.gov/boards',
    note: 'Advisory bodies appointed by Council — and how to apply.',
  },
];

const TRANSPARENCY: Link[] = [
  {
    label: 'City budget',
    url: 'https://coloradosprings.gov/budget',
    note: 'Adopted budgets, mid-year reports, financial dashboards.',
  },
  {
    label: 'Public records (CORA)',
    url: 'https://coloradosprings.gov/city-communications/page/colorado-open-records-act-cora',
    note: 'Request public records and read the CORA policy.',
  },
  {
    label: 'Colorado Sunshine Law',
    url: 'https://coloradosprings.gov/city-clerk',
    note: 'Open Meetings Act: how public meetings are noticed and documented.',
  },
];

const COUNTY_STATE: Link[] = [
  {
    label: 'El Paso County',
    url: 'https://www.elpasoco.com',
    note: 'County government — Assessor, Clerk, Sheriff, Public Health, Courts.',
  },
  {
    label: 'Board of County Commissioners',
    url: 'https://bocc.elpasoco.com',
    note: "County's legislative body.",
  },
  {
    label: 'State of Colorado',
    url: 'https://www.colorado.gov',
    note: 'Governor, General Assembly, state agencies.',
  },
  {
    label: 'PPACG (Pikes Peak Area Council of Governments)',
    url: 'https://www.ppacg.org',
    note: 'Regional planning — transportation, demographics, aging services.',
  },
];

const ABOUT_PORTAL: Link[] = [
  {
    label: 'GitHub repository',
    url: 'https://github.com/phonon56/cheetochopsticks',
    note: 'This portal is open source. Every commit is public.',
  },
  {
    label: 'Portal accessibility audit',
    url: '/microsites/city/goGov/GOGovAccessibilityAudit.pdf',
    note: 'The audit that motivated this rebuild.',
  },
  {
    label: 'Architecture notes',
    url: '/',
    note: 'Index of all related microsites on cheetochopsticks.com.',
  },
];

export function About() {
  return (
    <section aria-labelledby="about-heading" className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-slate-600">About</p>
        <h1 id="about-heading" className="text-3xl font-semibold text-slate-900">
          About this portal.
        </h1>
        <p className="text-slate-700">
          This is a prototype — an architectural experiment in what a consolidated civic
          front door could look like for Colorado Springs. It spans the City, El Paso County,
          regional agencies, state and federal services, utilities, special districts, and
          tribal-adjacent heritage. Its goal is to dispel the mystery of local government by
          letting residents find what they need however they think.
        </p>
      </div>

      <LinkSection heading="Leadership" items={LEADERSHIP} />
      <LinkSection heading="Governance" items={GOVERNANCE} />
      <LinkSection heading="Transparency" items={TRANSPARENCY} />
      <LinkSection
        heading="County, state & regional"
        items={COUNTY_STATE}
        hint="Colorado Springs residents are also governed by these bodies."
      />
      <LinkSection
        heading="About this prototype"
        items={ABOUT_PORTAL}
        hint="Open source — every commit visible, every design decision documented."
      />

      <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <p className="font-medium text-slate-900 mb-1">Credits & source</p>
        <p>
          Service-request topics and forms are drawn from the live City of Colorado Springs
          GoOutreach platform. Contact data is public-record and was verified against
          coloradosprings.gov. Volunteer opportunities and project data include prototype
          placeholders — they exist to model the shape of live feeds, not to substitute for
          agency-owned canonical sources.
        </p>
      </div>
    </section>
  );
}

function LinkSection({
  heading,
  items,
  hint,
}: {
  heading: string;
  items: Link[];
  hint?: string;
}) {
  return (
    <section aria-labelledby={`sec-${heading}`} className="space-y-2">
      <h2 id={`sec-${heading}`} className="text-xl font-semibold text-slate-900">
        {heading}
      </h2>
      {hint && <p className="text-xs text-slate-700">{hint}</p>}
      <ul role="list" className="space-y-2">
        {items.map((it) => (
          <li
            key={it.label}
            className="rounded-md border border-slate-200 bg-white p-3"
          >
            <a
              href={it.url}
              target={it.url.startsWith('http') ? '_blank' : undefined}
              rel="noreferrer"
              className="text-base font-medium text-blue-700 underline"
            >
              {it.label}
              {it.url.startsWith('http') && (
                <span aria-hidden="true" className="ml-1">
                  ↗
                </span>
              )}
            </a>
            {it.note && <p className="text-sm text-slate-700 mt-1">{it.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
