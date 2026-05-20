"""Regression and project-invariant tests for Universal Coordinate Converter.

These tests use Python mirrors of the active in-browser formulas so the suite can
run in this repository without Node, a browser driver, or network access. They
are regression tests for the current implementation, not a replacement for
authoritative geodetic control-point validation.
"""

from __future__ import annotations

import math
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "universal-coordinate-converter.html"
README_PATH = ROOT / "README.md"
FUNCTIONS_PATH = ROOT / "Function.txt"
RULES_PATH = ROOT / "rules.txt"
AGENTS_PATH = ROOT / "AGENTS.md"
VALIDATION_PATH = ROOT / "VALIDATION.md"
CYRILLIC_RE = re.compile("[\\u0400-\\u04FF]")


def pot2wgs(lng: float, lat: float) -> dict[str, float]:
    dx = 598.1
    dy = 73.7
    dz = 418.2
    rx = 0.202 / 3600 * math.pi / 180
    ry = 0.045 / 3600 * math.pi / 180
    rz = -2.455 / 3600 * math.pi / 180
    m = 6.7 / 1e6
    a = 6377397.15508
    f = 3.34277321e-3
    e2 = 2 * f - f * f
    lat_rad = lat * math.pi / 180
    lng_rad = lng * math.pi / 180
    n = a / math.sqrt(1 - e2 * math.sin(lat_rad) * math.sin(lat_rad))
    x = n * math.cos(lat_rad) * math.cos(lng_rad)
    y = n * math.cos(lat_rad) * math.sin(lng_rad)
    z = n * (1 - e2) * math.sin(lat_rad)
    x2 = x + dx + m * x - rz * y + ry * z
    y2 = y + dy + rz * x + m * y - rx * z
    z2 = z + dz - ry * x + rx * y + m * z
    a2 = 6378137.0
    f2 = 1 / 298.257223563
    e22 = 2 * f2 - f2 * f2
    p = math.sqrt(x2 * x2 + y2 * y2)
    lat2 = math.atan2(z2, p * (1 - e22))
    while True:
        previous = lat2
        n2 = a2 / math.sqrt(1 - e22 * math.sin(previous) * math.sin(previous))
        lat2 = math.atan2(z2 + e22 * n2 * math.sin(previous), p)
        if abs(lat2 - previous) <= 1e-11:
            break
    lng2 = math.atan2(y2, x2)
    return {"lat": lat2 * 180 / math.pi, "lng": lng2 * 180 / math.pi}


def gk2geo(rw: float, hw: float) -> dict[str, float]:
    a = 6377397.15508
    f = 3.34277321e-3
    pi = math.pi
    c = a / (1 - f)
    ex2 = (2 * f - f * f) / ((1 - f) * (1 - f))
    ex4 = ex2 * ex2
    ex6 = ex4 * ex2
    ex8 = ex4 * ex4
    e0 = c * (pi / 180) * (
        1 - 3 * ex2 / 4 + 45 * ex4 / 64 - 175 * ex6 / 256 + 11025 * ex8 / 16384
    )
    f2 = (180 / pi) * (3 * ex2 / 8 - 3 * ex4 / 16 + 213 * ex6 / 2048 - 255 * ex8 / 4096)
    f4 = (180 / pi) * (21 * ex4 / 256 - 21 * ex6 / 256 + 533 * ex8 / 8192)
    f6 = (180 / pi) * (151 * ex6 / 6144 - 453 * ex8 / 12288)
    sigma = hw / e0
    sigmr = sigma * pi / 180
    bf = sigma + f2 * math.sin(2 * sigmr) + f4 * math.sin(4 * sigmr) + f6 * math.sin(6 * sigmr)
    br = bf * pi / 180
    tan1 = math.tan(br)
    tan2 = tan1 * tan1
    tan4 = tan2 * tan2
    cos1 = math.cos(br)
    cos2 = cos1 * cos1
    etasq = ex2 * cos2
    nd = c / math.sqrt(1 + etasq)
    nd2 = nd * nd
    nd4 = nd2 * nd2
    nd6 = nd4 * nd2
    nd3 = nd2 * nd
    nd5 = nd4 * nd
    kz = int(rw / 1e6)
    lh = kz * 3
    dy = rw - (kz * 1e6 + 500000)
    dy2 = dy * dy
    dy4 = dy2 * dy2
    dy3 = dy2 * dy
    dy5 = dy4 * dy
    dy6 = dy3 * dy3
    b2 = -tan1 * (1 + etasq) / (2 * nd2)
    b4 = tan1 * (5 + 3 * tan2 + 6 * etasq * (1 - tan2)) / (24 * nd4)
    b6 = -tan1 * (61 + 90 * tan2 + 45 * tan4) / (720 * nd6)
    l1 = 1 / (nd * cos1)
    l3 = -(1 + 2 * tan2 + etasq) / (6 * nd3 * cos1)
    l5 = (5 + 28 * tan2 + 24 * tan4) / (120 * nd5 * cos1)
    lat = bf + (180 / pi) * (b2 * dy2 + b4 * dy4 + b6 * dy6)
    lng = lh + (180 / pi) * (l1 * dy + l3 * dy3 + l5 * dy5)
    return pot2wgs(lng, lat)


def wgs2pot(lng: float, lat: float) -> dict[str, float]:
    a = 6378137.000 - 739.845
    fq = 3.35281066e-3 - 1.003748e-05
    f = 3.35281066e-3
    dx = -587
    dy = -16
    dz = -393
    e2q = 2 * fq - fq * fq
    e2 = 2 * f - f * f
    pi = math.pi
    b1 = lat * pi / 180
    l1 = lng * pi / 180
    nd = a / math.sqrt(1 - e2 * math.sin(b1) * math.sin(b1))
    x = nd * math.cos(b1) * math.cos(l1)
    y = nd * math.cos(b1) * math.sin(l1)
    z = (1 - e2) * nd * math.sin(b1)
    xp = x + dx
    yp = y + dy
    zp = z + dz
    rb = math.sqrt(xp * xp + yp * yp)
    b2 = (180 / pi) * math.atan((zp / rb) / (1 - e2q))
    l2 = 0.0
    if xp > 0:
        l2 = (180 / pi) * math.atan(yp / xp)
    if xp < 0 and yp > 0:
        l2 = (180 / pi) * math.atan(yp / xp) + 180
    if xp < 0 and yp < 0:
        l2 = (180 / pi) * math.atan(yp / xp) - 180
    return {"lng": round(l2, 8), "lat": round(b2, 8)}


def decimal_to_gk(lng: float, lat: float) -> dict[str, str]:
    if lat < 46 or lat > 56 or lng < 5 or lng > 16:
        return {}
    a = 6377397.15508
    f = 3.34277321e-3
    pi = math.pi
    c = a / (1 - f)
    ex2 = (2 * f - f * f) / ((1 - f) * (1 - f))
    ex4 = ex2 * ex2
    ex6 = ex4 * ex2
    ex8 = ex4 * ex4
    e0 = c * (pi / 180) * (
        1 - 3 * ex2 / 4 + 45 * ex4 / 64 - 175 * ex6 / 256 + 11025 * ex8 / 16384
    )
    e2 = c * (-3 * ex2 / 8 + 15 * ex4 / 32 - 525 * ex6 / 1024 + 2205 * ex8 / 4096)
    e4 = c * (15 * ex4 / 256 - 105 * ex6 / 1024 + 2205 * ex8 / 16384)
    e6 = c * (-35 * ex6 / 3072 + 315 * ex8 / 12288)
    br = lat * pi / 180
    tan1 = math.tan(br)
    tan2 = tan1 * tan1
    tan4 = tan2 * tan2
    cos1 = math.cos(br)
    cos2 = cos1 * cos1
    cos4 = cos2 * cos2
    cos3 = cos2 * cos1
    cos5 = cos4 * cos1
    etasq = ex2 * cos2
    nd = c / math.sqrt(1 + etasq)
    g = e0 * lat + e2 * math.sin(2 * br) + e4 * math.sin(4 * br) + e6 * math.sin(6 * br)
    kz = int((lng + 1.5) / 3)
    lh = kz * 3
    dl = (lng - lh) * pi / 180
    dl2 = dl * dl
    dl4 = dl2 * dl2
    dl3 = dl2 * dl
    dl5 = dl4 * dl
    hw = g + nd * cos2 * tan1 * dl2 / 2 + nd * cos4 * tan1 * (5 - tan2 + 9 * etasq) * dl4 / 24
    rw = (
        nd * cos1 * dl
        + nd * cos3 * (1 - tan2 + etasq) * dl3 / 6
        + nd * cos5 * (5 - 18 * tan2 + tan4) * dl5 / 120
        + kz * 1e6
        + 500000
    )
    return {"h": f"{hw:.3f}", "r": f"{rw:.3f}", "z": str(rw)[0]}


def sweref99_to_wgs84(easting: float, northing: float) -> dict[str, float]:
    a = 6378137.0
    f = 1 / 298.257222101
    lon0 = 18.0 * math.pi / 180.0
    k0 = 1.0
    x0 = 150000.0
    y0 = 0.0
    e2 = 2 * f - f * f
    e1 = (1 - math.sqrt(1 - e2)) / (1 + math.sqrt(1 - e2))
    x = easting - x0
    y = northing - y0
    m = y / k0
    mu = m / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256))
    e1_2 = e1 * e1
    e1_3 = e1_2 * e1
    e1_4 = e1_3 * e1
    fp = (
        mu
        + (3 * e1 / 2 - 27 * e1_3 / 32) * math.sin(2 * mu)
        + (21 * e1_2 / 16 - 55 * e1_4 / 32) * math.sin(4 * mu)
        + (151 * e1_3 / 96) * math.sin(6 * mu)
        + (1097 * e1_4 / 512) * math.sin(8 * mu)
    )
    sin_fp = math.sin(fp)
    cos_fp = math.cos(fp)
    tan_fp = math.tan(fp)
    tan2_fp = tan_fp * tan_fp
    tan4_fp = tan2_fp * tan2_fp
    n1 = a / math.sqrt(1 - e2 * sin_fp * sin_fp)
    r1 = a * (1 - e2) / pow(1 - e2 * sin_fp * sin_fp, 1.5)
    d = x / (n1 * k0)
    d2 = d * d
    d3 = d2 * d
    d4 = d3 * d
    d5 = d4 * d
    d6 = d5 * d
    c1 = e2 * cos_fp * cos_fp / (1 - e2)
    c1_2 = c1 * c1
    lat = fp - (n1 * tan_fp / r1) * (
        d2 / 2
        - (5 + 3 * tan2_fp + 10 * c1 - 4 * c1_2 - 9 * e2 * cos_fp * cos_fp) * d4 / 24
        + (
            61
            + 90 * tan2_fp
            + 298 * c1
            + 45 * tan4_fp
            - 252 * e2 * cos_fp * cos_fp
            - 3 * c1_2
        )
        * d6
        / 720
    )
    lon = lon0 + (
        d
        - (1 + 2 * tan2_fp + c1) * d3 / 6
        + (5 - 2 * c1 + 28 * tan2_fp - 3 * c1_2 + 8 * e2 * cos_fp * cos_fp + 24 * tan4_fp)
        * d5
        / 120
    ) / cos_fp
    return {"lat": lat * 180 / math.pi, "lng": lon * 180 / math.pi}


def wgs84_to_sweref99(lat: float, lng: float) -> dict[str, float]:
    a = 6378137.0
    f = 1 / 298.257222101
    lon0 = 18.0 * math.pi / 180.0
    k0 = 1.0
    x0 = 150000.0
    y0 = 0.0
    lat *= math.pi / 180.0
    lng *= math.pi / 180.0
    e2 = 2 * f - f * f
    sin_lat = math.sin(lat)
    cos_lat = math.cos(lat)
    tan_lat = math.tan(lat)
    tan2_lat = tan_lat * tan_lat
    tan4_lat = tan2_lat * tan2_lat
    n = a / math.sqrt(1 - e2 * sin_lat * sin_lat)
    c = e2 * cos_lat * cos_lat / (1 - e2)
    c2 = c * c
    a2 = (lng - lon0) * cos_lat
    a2_2 = a2 * a2
    a2_3 = a2_2 * a2
    a2_4 = a2_3 * a2
    a2_5 = a2_4 * a2
    a2_6 = a2_5 * a2
    m = a * (
        (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256) * lat
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2 / 1024) * math.sin(2 * lat)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024) * math.sin(4 * lat)
        - (35 * e2 * e2 * e2 / 3072) * math.sin(6 * lat)
    )
    x = k0 * n * (
        a2
        + (1 - tan2_lat + c) * a2_3 / 6
        + (5 - 18 * tan2_lat + tan4_lat + 72 * c - 58 * e2 * cos_lat * cos_lat) * a2_5 / 120
    )
    y = k0 * (
        m
        + n
        * tan_lat
        * (
            a2_2 / 2
            + (5 - tan2_lat + 9 * c + 4 * c2) * a2_4 / 24
            + (61 - 58 * tan2_lat + tan4_lat + 600 * c - 330 * e2 * cos_lat * cos_lat)
            * a2_6
            / 720
        )
    )
    return {"x": x + x0, "y": y + y0}


class CoordinateRegressionTests(unittest.TestCase):
    def test_gk_readme_sample_to_wgs84(self) -> None:
        result = gk2geo(3568189.267, 5657692.868)
        self.assertAlmostEqual(result["lat"], 51.0503134303347, places=8)
        self.assertAlmostEqual(result["lng"], 9.971401877600515, places=8)

    def test_wgs84_to_gk_readme_sample_regression(self) -> None:
        pot = wgs2pot(9.971396507, 51.05031687)
        result = decimal_to_gk(pot["lng"], pot["lat"])
        self.assertEqual(result["r"], "3568191.052")
        self.assertEqual(result["h"], "5657692.533")

    def test_sweref_readme_sample_to_wgs84(self) -> None:
        result = sweref99_to_wgs84(674189.267, 6557692.868)
        self.assertAlmostEqual(result["lat"], 58.81452667561076, places=8)
        self.assertAlmostEqual(result["lng"], 27.089317460770403, places=8)

    def test_wgs84_to_sweref99_regression(self) -> None:
        result = wgs84_to_sweref99(55.12345678, 18.98765432)
        self.assertAlmostEqual(result["x"], 213008.7865462337, places=3)
        self.assertAlmostEqual(result["y"], 6111419.641371732, places=3)

    def test_sweref99_round_trip_stability(self) -> None:
        lat = 59.3293
        lng = 18.0686
        projected = wgs84_to_sweref99(lat, lng)
        result = sweref99_to_wgs84(projected["x"], projected["y"])
        self.assertAlmostEqual(result["lat"], lat, places=7)
        self.assertAlmostEqual(result["lng"], lng, places=7)

    def test_gk_round_trip_stays_within_current_tolerance(self) -> None:
        lat = 51.05031687
        lng = 9.971396507
        pot = wgs2pot(lng, lat)
        projected = decimal_to_gk(pot["lng"], pot["lat"])
        result = gk2geo(float(projected["r"]), float(projected["h"]))
        self.assertLess(abs(result["lat"] - lat), 1e-5)
        self.assertLess(abs(result["lng"] - lng), 5e-5)

    def test_gk_rejects_out_of_range_wgs84_input(self) -> None:
        result = decimal_to_gk(18.0686, 59.3293)
        self.assertEqual(result, {})


class ProjectInvariantTests(unittest.TestCase):
    def test_required_project_files_exist(self) -> None:
        for path in [HTML_PATH, README_PATH, FUNCTIONS_PATH, RULES_PATH, AGENTS_PATH, VALIDATION_PATH]:
            self.assertTrue(path.exists(), f"Missing required file: {path.name}")

    def test_project_text_files_do_not_contain_cyrillic(self) -> None:
        checked_suffixes = {".html", ".md", ".txt", ".py"}
        for path in ROOT.rglob("*"):
            if ".git" in path.parts or not path.is_file() or path.suffix.lower() not in checked_suffixes:
                continue
            text = path.read_text(encoding="utf-8")
            self.assertIsNone(CYRILLIC_RE.search(text), f"Cyrillic text found in {path.relative_to(ROOT)}")

    def test_html_keeps_core_conversion_functions_inline(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")
        for function_name in [
            "gk2geo",
            "Dezimal2GK",
            "wgs2pot",
            "pot2wgs",
            "sweref99ToWGS84",
            "wgs84ToSweref99",
        ]:
            self.assertIn(f"function {function_name}", html)

    def test_html_does_not_use_external_calculation_libraries(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8").lower()
        self.assertNotIn("proj4", html)
        self.assertNotIn("epsg.io", html)

    def test_html_uses_safe_output_helpers(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")
        self.assertIn("function appendTextCell", html)
        self.assertIn("function escapeXml", html)
        self.assertNotIn("row.innerHTML", html)
        self.assertNotIn("lastImportedTxtFileName", html)

    def test_html_guards_map_dependency_and_exports_wgs_rows(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")
        self.assertIn("function isMapLibraryReady", html)
        self.assertIn("collectRows('#wgsResultsBody tr', 1, 2, 'WGS84')", html)

    def test_sweref_conversion_function_name_is_corrected(self) -> None:
        html = HTML_PATH.read_text(encoding="utf-8")
        self.assertIn("function convertSwerefToWGS84", html)
        self.assertIn("function convertSwerfToWGS84", html)
        self.assertIn('onclick="convertSwerefToWGS84()"', html)

    def test_project_requires_push_after_updates(self) -> None:
        agents = AGENTS_PATH.read_text(encoding="utf-8")
        rules = RULES_PATH.read_text(encoding="utf-8")
        self.assertIn("push the updated project to GitHub", agents)
        self.assertIn("push to GitHub", rules)

    def test_function_notes_do_not_duplicate_executable_formulas(self) -> None:
        notes = FUNCTIONS_PATH.read_text(encoding="utf-8")
        self.assertIn("documentation only", notes)
        self.assertIn("Source of Truth", notes)
        self.assertNotIn("function sweref99ToWGS84", notes)
        self.assertNotIn("function wgs84ToSweref99", notes)

    def test_validation_notes_document_regression_baselines(self) -> None:
        notes = VALIDATION_PATH.read_text(encoding="utf-8")
        self.assertIn("Current Regression Cases", notes)
        self.assertIn("Important Limitation", notes)

    def test_readme_documents_testing_command(self) -> None:
        readme = README_PATH.read_text(encoding="utf-8")
        self.assertIn("python tests/run_validation.py", readme)


if __name__ == "__main__":
    unittest.main(verbosity=2)
