"""
scrape_blotter.py
─────────────────────────────────────────────────────────────────
Pulls every record from the live CSPD Police Blotter into blotter.json.

Two commands to run this:
    pip install playwright
    playwright install chromium
    python scrape_blotter.py

The blotter is a Blazor Server app — pagination is over WebSocket,
not URL parameters — so we drive a real headless browser through
all 28 pages and extract the rows. About 30–60 seconds total.

When it finishes you'll have a blotter.json file in the same folder
with all ~271 records. Drag that file back into the chat.
─────────────────────────────────────────────────────────────────
"""
import asyncio
import json
import sys
from datetime import datetime
from playwright.async_api import async_playwright

URL = "https://web2.coloradosprings.gov/policeblotter/"

# Fields rendered on each row. Each cell on the live page has an id like
# "{RecordID}-FieldName" — we match on the suffix so we don't depend on
# row order or the exact record ID format.
FIELDS = ["RecordID", "IncidentDate", "Time", "Division",
          "Title", "Location", "Summary", "Arrested", "Phone"]


async def scrape():
    records = []
    page_num = 0
    started = datetime.now()

    async with async_playwright() as p:
        # headless=True is fine; flip to False if you want to watch it.
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            user_agent="Mozilla/5.0 (compatible; CivicData/1.0)"
        )
        page = await ctx.new_page()

        print(f"→ Loading {URL}")
        await page.goto(URL, wait_until="networkidle", timeout=30_000)
        # Blazor Server takes a moment to hydrate the table on first paint.
        await page.wait_for_selector("table.quickgrid tbody tr", timeout=20_000)

        while True:
            page_num += 1
            rows = await page.query_selector_all("table.quickgrid tbody tr")

            for row in rows:
                rec = {}
                for f in FIELDS:
                    el = await row.query_selector(f'[id$="-{f}"]')
                    if el:
                        rec[f] = (await el.inner_text()).strip()
                if rec:
                    records.append(rec)

            print(f"  page {page_num:>2}  ·  rows so far: {len(records)}")

            nxt = await page.query_selector("button.go-next:not([disabled])")
            if not nxt:
                break
            await nxt.click()
            # Let SignalR push the next page of rows in.
            await page.wait_for_timeout(600)

        await browser.close()

    out = "blotter.json"
    with open(out, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)

    elapsed = (datetime.now() - started).total_seconds()
    print()
    print(f"✓ Saved {len(records)} records to {out}")
    print(f"  ({page_num} pages in {elapsed:.1f} seconds)")
    print()
    print("Drag blotter.json back into the chat and I'll plug it in.")


if __name__ == "__main__":
    try:
        asyncio.run(scrape())
    except Exception as e:
        print(f"\n✗ Something went wrong: {e}", file=sys.stderr)
        print("  If this is a 'browser not found' error, run:", file=sys.stderr)
        print("  playwright install chromium", file=sys.stderr)
        sys.exit(1)
