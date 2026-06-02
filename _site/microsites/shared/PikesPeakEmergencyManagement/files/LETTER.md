# A letter to Pikes Peak Regional Office of Emergency Management

**Subject:** A small project about pproem.com/alerts — and a question

---

Dear [Recipient Name],

I'm writing as a resident of El Paso County who has spent the last few months thinking about how civic information reaches the people who need it. PPROEM's work matters to me. My household relies on the alerts your office issues, and I've watched you carry the load through wildfire seasons that would have broken a less prepared organization. This letter is meant to be useful to you — please read it in that spirit.

I'm reaching out for two reasons.

## The first reason — an accessibility audit

I commissioned an accessibility audit of the Current Alerts page at **pproem.com/alerts**, evaluated against WCAG 2.1 Level AA, the technical standard the U.S. Department of Justice adopted in its April 24, 2024 Title II final rule (89 Fed. Reg. 31320). The full report is attached as a Word document.

The headline: the page has fifteen identified issues, of which five are critical Level A failures. The most consequential is that the embedded ArcGIS map — the page's primary mechanism for showing where alerts are active — has no text-based alternative. This means blind residents, low-vision residents, residents using only a keyboard, and residents on devices where the iframe fails to render cannot determine whether an active alert applies to their address. On a page whose entire purpose is communicating life-safety information, that gap is significant.

I want to be clear that this audit is offered as information, not accusation. PPROEM is not alone in this — most municipal alerts pages I've reviewed have similar issues, and the underlying problem is structural (you're embedding third-party tools whose accessibility you don't control). The DOJ's April 20, 2026 Interim Final Rule extended your compliance deadline from April 24, 2026 to **April 26, 2027** — you have time, and the issues identified are remediable within that window. The report includes a phased remediation plan with hour estimates: most of the critical fixes are 4–8 developer hours of markup work.

You're welcome to share this report with your IT team, accessibility coordinator, vendors, or county counsel. If it's useful in procurement conversations with Esri (for the ArcGIS map) or Everbridge (for the alerts subscription form), please use it however serves you.

## The second reason — a prototype

While reviewing the alerts page, I started sketching what a different version might look like — one designed around residents instead of around the vendors PPROEM has to stitch together. The core idea is simple: every civic record (an alert, a permit, a road closure, a meeting item, a financial line item, a property record) lives on the **parcel** it affects. Any resident can search their address or parcel ID and see everything that touches their property, in plain language, in chronological order, with the underlying documents preserved.

I built a working prototype anchored on Colorado Springs and El Paso County. It draws on three patterns that the public-safety field has already validated:

- **Genasys Protect** (formerly Zonehaven) for the zone-based address-to-status map
- **PG&E's PSPS lookup** for the address-bound subscribe flow
- **Watch Duty** for the plain-language, actionable content layer

A static preview is embedded below this letter for inline reference. The interactive version, which uses a real map with clickable evacuation zones and three demo addresses you can search, lives at:

→ **Live demo:** [https://your-wordpress-domain.com/pproem-prototype](https://your-wordpress-domain.com/pproem-prototype)
→ **Source code:** [https://github.com/your-handle/pproem-platform](https://github.com/your-handle/pproem-platform)

The prototype is not a product pitch. I am not selling anything, and I have no commercial interest in PPROEM's vendor decisions. I built it because I wanted to know whether the idea was as compelling in pixels as it was in my head, and because showing is easier than describing.

## The question

I'd like to know whether this is a direction PPROEM, El Paso County, or the City of Colorado Springs has already considered. If a conversation would be welcome — about the audit findings, the prototype, the underlying parcel-keyed architecture, or any combination — I'm happy to come in person, present to your team, or simply answer questions by email.

If the answer is "thank you, but no," that's a complete answer and I'll respect it. The audit report is yours to use either way.

Thank you for the work you do.

With respect,

**[Your Name]**
[Your Address, City, State ZIP]
[Your Email]
[Your Phone]

---

*P.S. — The Word document attached is the formal audit. The HTML preview below is a flat, email-friendly snapshot of the prototype. The link above opens the interactive version in a browser, which is where the idea lands best.*
