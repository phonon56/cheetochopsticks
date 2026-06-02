# Cheeto Chopsticks

A temporary workspace for problem solving and quick fixes for Colorado Springs local government and other entities who may need updates.

This repo collects microsites, prototypes, and proof-of-concept tools that address real, immediate needs in city operations. The ideas here are small and scrappy on purpose — fast solutions that can be tested, iterated on, and eventually folded into something bigger when the time is right.

Nothing here is permanent. Think of it as a scratch pad: a place to build things quickly, see if they work, and move on.

## What's here

- **`microsites/city/`** — Tools and prototypes aimed at City of Colorado Springs needs.
- **`microsites/_template/`** — A minimal starter template for spinning up new microsites.
- - **`microsites/_template/FBI`** — A landing page where the problem is the main search for the correct contact, reducing administrative costs and ADA development.
- **`shared/`** — Reusable CSS and JS that emerges across projects.

## Adding a new microsite

1. Copy `microsites/_template/` to `microsites/your-site-name/`
2. Edit and build from there — or just paste in existing code as-is.

## Licensing Framework

**STATUS: Starting framework. Requires review by qualified intellectual property counsel before adoption. This is not legal advice.**

---

## Philosophy

This project is civic infrastructure. It is committed to remaining open, auditable, and freely usable by governments, public bodies, and the citizens they serve — while ensuring that commercial vendors who profit from the work contribute back, either in code or in funding.

The licensing stack is designed so that:

- Any government can adopt and run the platform at no cost, forever.
- Citizens can inspect, audit, and propose changes to any version that touches public records.
- Modifications made by anyone running the software publicly must be released back to the commons.
- Commercial vendors who want to embed the code in closed-source products pay a commercial license.
- The project itself can never be acquired, closed, or "rug-pulled" away from its public mission.

---

## The Licensing Stack

```
PROJECT LICENSING
        │
        ├── CODE
        │     GNU Affero General Public License v3 (AGPL-3.0)
        │     OR a commercial license (purchasable)
        │
        ├── DOCUMENTATION & CONTENT
        │     Creative Commons Attribution-ShareAlike 4.0
        │     (CC BY-SA 4.0)
        │
        ├── DATA, SCHEMAS & REFERENCE TABLES
        │     Open Database License (ODbL) v1.0
        │
        ├── TRADEMARK
        │     [PROJECT NAME] and logo are registered trademarks
        │     Use governed by Trademark Policy (Section 5)
        │
        └── CONTRIBUTIONS
              Governed by Contributor License Agreement (Section 6)
              Required for inclusion in upstream repository
```

---

## 1. Code License

The source code of cheetochopsticks is licensed under the GNU Affero General Public License version 3 (AGPL-3.0).

In plain language, this means:

- **You can use it.** Run it, modify it, deploy it, fork it, at no cost.
- **You can change it.** Add features, fix bugs, customize it for your jurisdiction or use case.
- **You must share back.** If you modify the code and offer it to others — including operating it as a network service that members of the public can use — you must publish your modifications under the same AGPL terms.
- **No warranty.** The software is provided "as is" without any guarantee of fitness for a particular purpose.

The full AGPL-3.0 license text is at:
https://www.gnu.org/licenses/agpl-3.0.html

---

## 2. Government Use

Any federal, state, county, municipal, tribal, special-district, or other government entity, and any 501(c)(3) non-profit organization, may use, deploy, modify, and redistribute cheetochopsticks in production under the AGPL terms above at no cost. No separate license, registration, or notification is required.

### Optional: No-cost government license upon request

Some government procurement processes are incompatible with the AGPL share-back obligation — for example, where integration with classified or restricted systems would conflict with AGPL's source-disclosure requirement.

For these cases, the project will issue a **no-cost government license** on request that:

- Permits internal integration without triggering AGPL share-back
- Preserves the right to use, modify, and inspect the source
- Cannot be used to redistribute the software to non-government parties under altered terms
- Cannot be sublicensed, sold, or transferred

Request a government license: `legal@cheetochopsticks.com`

---

## 3. Commercial License

If you wish to use cheetochopsticks in a way that is incompatible with AGPL-3.0 — for example:

- Embedding it inside a proprietary product you sell to customers
- Operating it as a managed service for third parties without releasing your modifications
- Bundling it inside closed-source software
- Sublicensing it as part of a vendor offering to government clients

— you must obtain a commercial license.

The commercial license:

- Removes the AGPL source-disclosure obligation
- Permits closed-source modification and integration
- Includes support, SLA, and indemnification terms (per agreement)
- Is offered on a per-deployment, per-seat, or per-revenue basis depending on the use case
- Funds ongoing development of the public AGPL version

Contact: `commercial@cheetochopsticks.com`

---

## 4. Documentation, Content & Data Licenses

| Asset                           | License                                |
|---------------------------------|----------------------------------------|
| Source code                     | AGPL-3.0 or commercial (Section 1, 3)  |
| Documentation, guides, written content | CC BY-SA 4.0                    |
| UI designs, icons, visual artifacts (non-trademark) | CC BY-SA 4.0          |
| Datasets, schemas, reference tables, taxonomies | ODbL v1.0                |
| Trademarks (name, logo)         | Reserved, see Section 5                |

---

## 5. Trademark Policy

"CheetoChopsticks" and the CheetoChopsticks logo are registered trademarks.

The trademark exists to protect the public from confusion: when a citizen, government, or vendor sees the cheetochopsticks name or logo, they should be able to trust that the software it identifies is the genuine, audited, upstream project — not a modified fork, a commercial repackaging, or a competing product.

### You MAY

- Refer to the project by name when describing your installation, integration, or fork
   *Example: "Our county uses CheetoChopsticks to manage permits."*
- Use the logo to link back to the official project
- Display "Powered by CheetoChopsticks" on instances running unmodified upstream code
- Use the name in academic, journalistic, or educational contexts

### You MAY NOT

- Use the name or logo as part of a product, service, or company name without written permission
- Imply endorsement, affiliation, certification, or partnership with the CheetoChopsticks project
- Use the trademarks in a manner likely to cause confusion about the origin of a product
- Continue to use the trademarks on a fork that has materially diverged from upstream

### Forks must rename

If you fork the codebase and modify it substantially — adding, removing, or changing core functionality — you must rename your fork and remove the original logo. This follows standard open source convention (MariaDB ↔ MySQL, Rocky Linux ↔ CentOS, OpenSearch ↔ Elasticsearch).

---

## 6. Contributor License Agreement (CLA)

All contributions merged into the upstream CheetoChopsticks repository require a signed Contributor License Agreement.

The CLA grants the project two rights to each contribution:

1. The right to distribute it under AGPL-3.0 (and successor versions)
2. The right to relicense it under a commercial license for commercial customers

This dual right is what enables the AGPL + Commercial structure to function. Without it, every commercial license sale would require permission from every individual contributor — which is impossible at scale.

### What the CLA does NOT do

- It does **not** transfer copyright. Contributors retain ownership of their work.
- It does **not** grant the project the right to take the code closed-source. The AGPL version remains AGPL forever.
- It does **not** prevent contributors from using their own contributions elsewhere under any terms they want.

The CLA simply grants the project the licensing flexibility needed to sustain commercial operations that fund the open version.

---

## 7. Governance Commitments

To prevent the licensing structure from being misused against the public interest, the project commits to the following:

- The AGPL-licensed version will never be discontinued, downgraded, or replaced with a less-open license.
- The trademark will not be used to suppress legitimate forks, only to prevent confusion.
- Commercial license revenue will be reinvested in development of the public version, with annual public reporting.
- Any change to this licensing framework requires public consultation and a [governance body] vote.
- If the project entity is ever dissolved, all trademarks and CLAs will be transferred to a nonprofit civic-tech foundation chosen in advance.

---

## 8. Why This Structure

```
GOVERNMENTS
  Free, perpetual, AGPL or no-cost gov license
  No vendor lock-in, full source access
        │
        ▼
CITIZENS
  Can audit, inspect, fork, contribute
  Records and data remain in open formats
        │
        ▼
COMMERCIAL VENDORS
  Two paths:
    (a) AGPL — release your modifications, contribute back
    (b) Commercial license — pay, keep modifications private
        │
        ▼
PROJECT SUSTAINABILITY
  Commercial revenue funds AGPL development
  Public version stays first-class, never neglected
  Open-ended: no time-bomb conversion, no narrowing
```

---

## 9. Precedents

This structure draws from the following established projects:

| Project    | Code License | Commercial Path     | Trademark   |
|------------|--------------|---------------------|-------------|
| Decidim    | AGPL-3.0     | (none — pure AGPL)  | Registered  |
| CKAN       | AGPL-3.0     | (none — pure AGPL)  | Open        |
| MongoDB (historical) | AGPL-3.0 | Commercial license | Registered  |
| MySQL      | GPL-2.0      | Commercial license  | Registered  |
| Qt         | LGPL/GPL     | Commercial license  | Registered  |
| Nextcloud  | AGPL-3.0     | Subscription/Enterprise | Registered |

This project takes Decidim's civic licensing stack (AGPL + CC + ODbL + Trademark) and adds the MongoDB/MySQL formal commercial license path, gated by a CLA.

---

## 10. Disclaimer

This document explains a licensing framework. It is not itself a binding legal instrument. The binding instruments are:

- The AGPL-3.0 license text (as published by the Free Software Foundation)
- The CC BY-SA 4.0 license text (as published by Creative Commons)
- The ODbL v1.0 text (as published by Open Knowledge Foundation)
- The executed Contributor License Agreement (to be drafted with counsel)
- The executed Commercial License Agreement (to be drafted with counsel)
- The trademark registration filings (to be filed with USPTO and equivalent bodies)

Before this framework is adopted, the project sponsor should engage qualified intellectual property counsel to:

1. Draft and review the CLA
2. Draft a commercial license template
3. Conduct trademark search and file registrations
4. Confirm AGPL compatibility with the project's third-party dependencies
5. Review the government license carve-out for jurisdictional issues
6. Establish the legal entity that will hold the trademarks and IP

Engaging counsel familiar with both open source licensing and civic/government technology procurement is strongly recommended.
