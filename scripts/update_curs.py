#!/usr/bin/env python3
"""Fetch today's EUR/RON rate and write buget/curs.json.

Primary source is cursbnr.ro, as requested; BNR's official XML feed is the
fallback and supplies the publishing date. Standard library only.
"""
import datetime
import json
import re
import sys
import urllib.request
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "buget" / "curs.json"
UA = {"User-Agent": "Mozilla/5.0 (budget calculator; +https://ionutmariusdutan.github.io/buget/)"}


def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def plausible(v):
    return 3.0 < v < 10.0


def from_cursbnr():
    html = get("https://www.cursbnr.ro/")
    # Find the EUR table cell / label, then the first 4-decimal number after it.
    # Prefer a cell whose whole text is "EUR"; fall back to any "EUR" word.
    for pattern in (r">\s*EUR\s*<", r"\bEUR\b"):
        for m in re.finditer(pattern, html):
            tail = re.sub(r"<[^>]+>", " ", html[m.end():m.end() + 600])
            n = re.search(r"\b(\d)[.,](\d{4})\b", tail)
            if n:
                v = float(n.group(1) + "." + n.group(2))
                if plausible(v):
                    return v
    raise ValueError("EUR rate not found on cursbnr.ro")


def from_bnr():
    xml = get("https://www.bnr.ro/nbrfxrates.xml")
    rate = re.search(r'<Rate currency="EUR"(?: multiplier="1")?>([\d.]+)</Rate>', xml)
    date = re.search(r"<PublishingDate>(\d{4}-\d{2}-\d{2})</PublishingDate>", xml)
    if not rate or not plausible(float(rate.group(1))):
        raise ValueError("EUR rate not found in BNR XML")
    return float(rate.group(1)), date.group(1) if date else None


def main():
    rate = source = date = None
    try:
        rate, source = from_cursbnr(), "cursbnr.ro"
    except Exception as e:  # noqa: BLE001
        print("cursbnr.ro failed:", e, file=sys.stderr)
    try:
        bnr_rate, date = from_bnr()
        if rate is None:
            rate, source = bnr_rate, "bnr.ro"
        elif abs(bnr_rate - rate) / bnr_rate > 0.01:
            # cursbnr.ro republishes the BNR rate; a large gap means we parsed the wrong number.
            print(f"cursbnr.ro {rate} disagrees with bnr.ro {bnr_rate}; using BNR", file=sys.stderr)
            rate, source = bnr_rate, "bnr.ro"
    except Exception as e:  # noqa: BLE001
        print("bnr.ro failed:", e, file=sys.stderr)

    if rate is None:
        print("no source available; keeping existing file", file=sys.stderr)
        return 1

    data = {
        "eur": round(rate, 4),
        "date": date or datetime.date.today().isoformat(),
        "source": source,
        "updated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ"),
    }
    old = {}
    if OUT.exists():
        old = json.loads(OUT.read_text())
    if {k: old.get(k) for k in ("eur", "date")} == {k: data[k] for k in ("eur", "date")}:
        print("unchanged:", data)
        return 0
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
    print("written:", data)
    return 0


if __name__ == "__main__":
    sys.exit(main())
