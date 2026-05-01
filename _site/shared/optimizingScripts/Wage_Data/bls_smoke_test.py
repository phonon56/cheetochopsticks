#!/usr/bin/env python3
"""
BLS API Smoke Test
------------------
Quick check to confirm the BLS API is reachable from your machine and returns
data before running the full bls_pull.py script.

Usage:
  pip install requests
  python3 bls_smoke_test.py

Expected output: a small JSON-like printout showing recent quarterly values
for El Paso County total private average weekly wage.
"""

import json
import requests

# Use a well-known, stable national series first — this avoids any
# county-level encoding quirks for the initial reachability test.
# CES0000000001 = total nonfarm employment, U.S., monthly.
TEST_SERIES = "CES0000000001"

print(f"Smoke test: pulling {TEST_SERIES} from BLS API...")
r = requests.post(
    "https://api.bls.gov/publicAPI/v2/timeseries/data/",
    data=json.dumps({"seriesid": [TEST_SERIES], "startyear": "2024", "endyear": "2024"}),
    headers={"Content-Type": "application/json"},
    timeout=30
)
print(f"HTTP status: {r.status_code}")
data = r.json()
print(f"API status: {data.get('status')}")
if data.get("status") == "REQUEST_SUCCEEDED":
    series = data["Results"]["series"][0]
    obs = series["data"][:3]
    print(f"\nFirst 3 observations:")
    for o in obs:
        print(f"  {o['year']}-{o['period']}: {o['value']}")
    print("\n✓ API is reachable. You can now run bls_pull.py for the QCEW data.")
else:
    print("\n✗ Unexpected API response. Messages:")
    for msg in data.get("message", []):
        print(f"  {msg}")
