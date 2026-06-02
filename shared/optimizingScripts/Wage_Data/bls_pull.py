#!/usr/bin/env python3
"""
BLS QCEW Data Puller — El Paso County & Denver County
-----------------------------------------------------
Pulls Quarterly Census of Employment and Wages data from the BLS Open Data API
for the dashboard comparing wages across El Paso County and Denver County, CO.

Outputs:
  - bls_wage_data.csv  — raw pulled data, year × series
  - bls_wage_summary.csv  — annualized median-wage summary by county and sector

Usage:
  pip install requests pandas
  python3 bls_pull.py
"""

import json
import csv
import sys
import time
import requests
import pandas as pd
from datetime import datetime

# ---------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------
START_YEAR = 2019
END_YEAR = 2024  # most recent full year of QCEW data; update yearly

# BLS QCEW series ID format:
#   ENU + (5-digit FIPS) + (datatype) + (size) + (ownership) + (industry)
#
# Datatype codes used:
#   1 = average weekly wage
#   4 = total quarterly wages
#   5 = total annual wages (only for annual-aggregated series)
#
# Size code: 0 = all establishments
# Ownership: 5 = private sector
# Industry codes (NAICS-aligned in BLS encoding):
#   10 = total, all industries
#   1023 = manufacturing supersector
#   101 = goods-producing
#
# Note: aerospace-specific (NAICS 3364) is detail-level and not always
#  available via the public series API for county-level data; we pull
#  the manufacturing supersector as a proxy with documented limitation.

SERIES = {
    # El Paso County, CO (FIPS 08041)
    "elpaso_total_avg_weekly_wage":     "ENU0804140510",   # all industries, private, weekly wage
    "elpaso_mfg_avg_weekly_wage":       "ENU08041405101023",  # manufacturing, private, weekly wage
    "elpaso_total_employment":          "ENU0804110510",   # all industries, private, employment level

    # Denver County, CO (FIPS 08031)
    "denver_total_avg_weekly_wage":     "ENU0803140510",
    "denver_mfg_avg_weekly_wage":       "ENU08031405101023",
    "denver_total_employment":          "ENU0803110510",
}

API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

# ---------------------------------------------------------------
# FETCH
# ---------------------------------------------------------------
def fetch_series(series_id, start, end):
    """Pull a single series from the BLS API (public, no key required for v2 limited)."""
    payload = {
        "seriesid": [series_id],
        "startyear": str(start),
        "endyear": str(end),
    }
    headers = {"Content-Type": "application/json"}
    r = requests.post(API_URL, data=json.dumps(payload), headers=headers, timeout=30)
    r.raise_for_status()
    data = r.json()
    if data.get("status") != "REQUEST_SUCCEEDED":
        print(f"  WARNING — API status: {data.get('status')} for {series_id}")
        if "message" in data:
            for msg in data["message"]:
                print(f"    {msg}")
        return []
    series_data = data["Results"]["series"]
    if not series_data:
        return []
    return series_data[0].get("data", [])


def fetch_all():
    """Pull every configured series."""
    results = {}
    for nickname, sid in SERIES.items():
        print(f"Fetching {nickname} ({sid})...")
        data = fetch_series(sid, START_YEAR, END_YEAR)
        results[nickname] = data
        time.sleep(0.5)  # be polite to BLS
    return results


# ---------------------------------------------------------------
# TRANSFORM
# ---------------------------------------------------------------
def to_dataframe(results):
    """Flatten the nested API responses into a long DataFrame."""
    rows = []
    for nickname, observations in results.items():
        for obs in observations:
            rows.append({
                "series": nickname,
                "year": int(obs["year"]),
                "period": obs["period"],          # M01-M12 or Q01-Q04 or A01
                "period_name": obs["periodName"],
                "value": float(obs["value"]) if obs["value"] not in ("", "-") else None,
            })
    return pd.DataFrame(rows)


def annualize(df):
    """Convert quarterly QCEW averages into annual figures.
    Average weekly wages → annualized by × 52.
    Employment → averaged across quarters."""
    summary_rows = []
    for nickname in df["series"].unique():
        sub = df[df["series"] == nickname].copy()
        for year, group in sub.groupby("year"):
            mean_val = group["value"].mean()
            if "weekly_wage" in nickname:
                annualized = mean_val * 52 if mean_val else None
                summary_rows.append({
                    "year": year,
                    "series": nickname.replace("_avg_weekly_wage", "_annual_wage"),
                    "value": round(annualized, 0) if annualized else None,
                    "unit": "annualized USD"
                })
            elif "employment" in nickname:
                summary_rows.append({
                    "year": year,
                    "series": nickname,
                    "value": round(mean_val, 0) if mean_val else None,
                    "unit": "avg quarterly employment"
                })
    return pd.DataFrame(summary_rows).sort_values(["year", "series"]).reset_index(drop=True)


def pivot_for_dashboard(summary):
    """Reshape into a wide table — one row per year, one column per series.
    This is the format the dashboard expects to ingest."""
    pivoted = summary.pivot(index="year", columns="series", values="value").reset_index()
    pivoted.columns.name = None
    # Compute the wage gap as a derived column (Denver minus El Paso)
    if "denver_total_annual_wage" in pivoted.columns and "elpaso_total_annual_wage" in pivoted.columns:
        pivoted["wage_gap_total_usd"] = pivoted["denver_total_annual_wage"] - pivoted["elpaso_total_annual_wage"]
        pivoted["wage_gap_total_pct"] = ((pivoted["denver_total_annual_wage"] - pivoted["elpaso_total_annual_wage"])
                                          / pivoted["elpaso_total_annual_wage"] * 100).round(1)
    if "denver_mfg_annual_wage" in pivoted.columns and "elpaso_mfg_annual_wage" in pivoted.columns:
        pivoted["wage_gap_mfg_usd"] = pivoted["denver_mfg_annual_wage"] - pivoted["elpaso_mfg_annual_wage"]
        pivoted["wage_gap_mfg_pct"] = ((pivoted["denver_mfg_annual_wage"] - pivoted["elpaso_mfg_annual_wage"])
                                        / pivoted["elpaso_mfg_annual_wage"] * 100).round(1)
    return pivoted


# ---------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------
def main():
    print(f"BLS QCEW Pull — {START_YEAR}–{END_YEAR}")
    print(f"Started: {datetime.now().isoformat(timespec='seconds')}")
    print("-" * 60)

    results = fetch_all()
    if all(len(v) == 0 for v in results.values()):
        print("\nERROR: No data returned for any series. Possible causes:")
        print("  - Series IDs may need format adjustment (county-level QCEW")
        print("    data sometimes requires the multi-screen NAICS encoding)")
        print("  - BLS API may be rate-limited or temporarily unavailable")
        print("  - Public tier limits to 25 queries per day per IP")
        print("  - For more reliable access, register for a free API key at:")
        print("    https://data.bls.gov/registrationEngine/")
        sys.exit(1)

    df = to_dataframe(results)
    print(f"\nFetched {len(df)} raw observations.")

    summary = annualize(df)
    print(f"Annualized to {len(summary)} summary rows.")

    pivot = pivot_for_dashboard(summary)
    print("\nPivoted dashboard-ready data:")
    print(pivot.to_string(index=False))

    # Write outputs
    df.to_csv("bls_wage_raw.csv", index=False)
    summary.to_csv("bls_wage_summary.csv", index=False)
    pivot.to_csv("bls_wage_dashboard.csv", index=False)

    print("\n" + "=" * 60)
    print("Files written to current directory:")
    print("  bls_wage_raw.csv       — every observation, long format")
    print("  bls_wage_summary.csv   — annualized by series, long format")
    print("  bls_wage_dashboard.csv — wide format ready for dashboard ingest")
    print("=" * 60)


if __name__ == "__main__":
    main()
