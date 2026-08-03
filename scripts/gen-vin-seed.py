#!/usr/bin/env python3
"""Génère l'index seed du décodeur VIN à partir du corpus réel.

Entrée  : scripts/echantillon.csv (colonnes: vin,marque,modele,annee,vehicule,type,finition)
Sorties :
  - src/main/vinSeed.json               index compact par signature (sig8, sig6)
                                         + carr/ver/seg majoritaires par signature
  - src/renderer/src/mock/wmiBase.ts     marque majoritaire par WMI (3 premiers car.)

Parsing CSV robuste via le module `csv` standard (gère guillemets/virgules dans `modele`).

Usage : python3 scripts/gen-vin-seed.py
"""
from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT / "scripts" / "echantillon.csv"
SEED_JSON_PATH = ROOT / "src" / "main" / "vinSeed.json"
WMI_TS_PATH = ROOT / "src" / "renderer" / "src" / "mock" / "wmiBase.ts"

VIN_RE = re.compile(r"^[A-HJ-NPR-Z0-9]{17}$")
TOP_N = 3


def libelle(marque: str, modele: str) -> str:
    """Construit 'Marque - Modele' (trim ; si l'un manque, ne garde que l'autre)."""
    m = (marque or "").strip()
    mo = (modele or "").strip()
    return " - ".join(part for part in (m, mo) if part)


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Corpus introuvable : {CSV_PATH}")

    # sig_data[n][signature] = {"mm": Counter(libelle->nb), "an": Counter(annee->nb),
    #                            "carr": Counter(vehicule->nb), "ver": Counter(type->nb),
    #                            "seg": Counter(finition->nb)}
    sig_data: dict[int, dict[str, dict[str, Counter]]] = {
        8: defaultdict(lambda: {"mm": Counter(), "an": Counter(), "carr": Counter(), "ver": Counter(), "seg": Counter()}),
        6: defaultdict(lambda: {"mm": Counter(), "an": Counter(), "carr": Counter(), "ver": Counter(), "seg": Counter()}),
    }
    wmi_data: dict[str, Counter] = defaultdict(Counter)

    total_rows = 0
    valid_vins = 0

    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)  # entête : vin,marque,modele,annee,vehicule,type,finition
        for row in reader:
            total_rows += 1
            if len(row) < 4:
                continue
            vin = (row[0] or "").strip()
            marque = row[1] if len(row) > 1 else ""
            modele = row[2] if len(row) > 2 else ""
            annee_raw = row[3] if len(row) > 3 else ""
            vehicule = row[4] if len(row) > 4 else ""
            type_ = row[5] if len(row) > 5 else ""
            finition = row[6] if len(row) > 6 else ""

            if not VIN_RE.match(vin):
                continue
            valid_vins += 1

            lib = libelle(marque, modele)

            annee: int | None
            try:
                annee = int(annee_raw.strip())
            except (ValueError, AttributeError):
                annee = None

            carr = (vehicule or "").strip()
            ver = (type_ or "").strip()
            seg = (finition or "").strip()

            for n in (8, 6):
                entry = sig_data[n][vin[:n]]
                if lib:
                    entry["mm"][lib] += 1
                if annee is not None:
                    entry["an"][annee] += 1
                if carr:
                    entry["carr"][carr] += 1
                if ver:
                    entry["ver"][ver] += 1
                if seg:
                    entry["seg"][seg] += 1

            marque_clean = (marque or "").strip()
            if marque_clean:
                wmi_data[vin[:3]][marque_clean] += 1

    def pack(sig_map: dict[str, dict[str, Counter]]) -> dict:
        out = {}
        for sig, entry in sig_map.items():
            mm_top = entry["mm"].most_common(TOP_N)
            an_hist = sorted(entry["an"].items())  # ordre croissant par année
            packed = {
                "mm": [[label, count] for label, count in mm_top],
                "an": [[year, count] for year, count in an_hist],
            }
            for key, field in (("carr", "carr"), ("ver", "ver"), ("seg", "seg")):
                counter = entry[field]
                if counter:
                    packed[key] = counter.most_common(1)[0][0]
            out[sig] = packed
        return out

    seed = {
        "sig8": pack(sig_data[8]),
        "sig6": pack(sig_data[6]),
    }

    SEED_JSON_PATH.parent.mkdir(parents=True, exist_ok=True)
    with SEED_JSON_PATH.open("w", encoding="utf-8") as f:
        json.dump(seed, f, ensure_ascii=False, separators=(",", ":"))

    wmi_base = {
        wmi: {"marque": counter.most_common(1)[0][0]}
        for wmi, counter in wmi_data.items()
    }

    WMI_TS_PATH.parent.mkdir(parents=True, exist_ok=True)
    with WMI_TS_PATH.open("w", encoding="utf-8") as f:
        f.write("export const WMI_BASE: Record<string, { marque: string }> = ")
        json.dump(wmi_base, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")

    print(f"Lignes CSV lues (hors entête) : {total_rows}")
    print(f"VIN valides (regex 17 car.)   : {valid_vins}")
    print(f"Signatures sig8                : {len(seed['sig8'])}")
    print(f"Signatures sig6                : {len(seed['sig6'])}")
    print(f"Entrées WMI_BASE                : {len(wmi_base)}")
    print(f"-> {SEED_JSON_PATH}")
    print(f"-> {WMI_TS_PATH}")


if __name__ == "__main__":
    main()
