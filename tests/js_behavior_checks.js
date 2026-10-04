"use strict";

// Runs the real js/transformations.js and js/app.js in a Node VM with a minimal
// DOM stub, so the shipped browser code is tested rather than a Python mirror.
// Usage: node tests/js_behavior_checks.js (exit code 0 on success).

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const element = () => new Proxy(function () {}, {
    get: (target, property) => (property === "classList" ? { add() {}, remove() {} } : property === "value" ? "" : () => {}),
    set: () => true,
});
const context = {
    document: { getElementById: element, addEventListener() {}, createElement: element, querySelectorAll: () => [] },
    window: {},
    console, Math, Number, String, Array, Object, Promise, isFinite, isNaN, parseInt, parseFloat, Blob, URL, setTimeout,
};
vm.createContext(context);
const source = ["js/transformations.js", "js/app.js"]
    .map((file) => fs.readFileSync(path.join(root, file), "utf8"))
    .join("\n") +
    "\nthis.api = { parseCoordinateLine, normalizeImportedCoordinateText, parseStrictDecimal, parseStrictHeight," +
    " escapeXml, gk2geo, Dezimal2GK, wgs2pot, sweref99ToWGS84, wgs84ToSweref99 };";
vm.runInContext(source, context);
const api = context.api;

const close = (actual, expected, tolerance, label) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} differs from ${expected}`);

// Transformation regression baselines (same values as VALIDATION.md).
let result = api.gk2geo(3568189.267, 5657692.868);
close(result.lat, 51.0503134303347, 1e-8, "GK lat");
close(result.lng, 9.971401877600515, 1e-8, "GK lng");

const pot = api.wgs2pot(9.971396507, 51.05031687);
const gk = api.Dezimal2GK(pot.lng, pot.lat);
assert.strictEqual(gk.r, "3568191.052");
assert.strictEqual(gk.h, "5657692.533");
assert.deepStrictEqual(Object.keys(api.Dezimal2GK(18.0686, 59.3293)), []);

result = api.sweref99ToWGS84(153905.093, 6579354.449);
close(result.lat, 59.32930000483974, 1e-8, "SWEREF lat");
close(result.lng, 18.068600003456346, 1e-8, "SWEREF lng");

result = api.wgs84ToSweref99(55.12345678, 18.98765432);
close(result.x, 213008.7865462337, 1e-3, "SWEREF easting");
close(result.y, 6111419.641371732, 1e-3, "SWEREF northing");

// Strict numeric parsing: heights may be negative, coordinates may not.
assert.strictEqual(api.parseStrictDecimal("3568189.267"), 3568189.267);
assert.strictEqual(api.parseStrictDecimal("-5.2"), null);
assert.strictEqual(api.parseStrictDecimal("59,3293"), null);
assert.strictEqual(api.parseStrictDecimal("35634d49.97359"), null);
assert.strictEqual(api.parseStrictHeight("-5.200"), -5.2);
assert.strictEqual(api.parseStrictHeight("321.609"), 321.609);
assert.strictEqual(api.parseStrictHeight("--5"), null);
assert.strictEqual(api.parseStrictHeight("5-"), null);

// Negative heights are kept instead of being replaced by the 0.000 default.
let parsed = api.parseCoordinateLine("1029 3568189.267 5657692.868 -5.200", "gk", 1);
assert.strictEqual(parsed.heightText, "-5.200");
assert.strictEqual(parsed.heightValue, -5.2);
assert.strictEqual(parsed.defaultedHeight, false);
assert.strictEqual(parsed.extraFieldCount, 0);

// A missing height still defaults to 0.000.
parsed = api.parseCoordinateLine("1029 3568189.267 5657692.868", "gk", 1);
assert.strictEqual(parsed.heightText, "0.000");
assert.strictEqual(parsed.defaultedHeight, true);

// Numeric parts of a WGS84 point ID are not mistaken for coordinates.
parsed = api.parseCoordinateLine("Station 12 51.05031687 9.971396507", "wgs", 1);
assert.strictEqual(parsed.pointID, "Station 12");
assert.strictEqual(parsed.firstValue, 51.05031687);
assert.strictEqual(parsed.secondValue, 9.971396507);
assert.strictEqual(parsed.multiPartPointID, true);

// Standard WGS84 rows and rows outside the practical area still use the standard layout.
parsed = api.parseCoordinateLine("1029 51.05031687 9.971396507", "wgs", 1);
assert.strictEqual(parsed.pointID, "1029");
parsed = api.parseCoordinateLine("Lisbon 38.7223 9.1393", "wgs", 1);
assert.strictEqual(parsed.pointID, "Lisbon");
assert.strictEqual(parsed.firstValue, 38.7223);

// Comments, blank lines, and unrecognized rows are skipped or reported.
assert.strictEqual(api.parseCoordinateLine("# note", "gk", 1).skip, true);
assert.strictEqual(api.parseCoordinateLine("   ", "gk", 2).skip, true);
assert.ok(api.parseCoordinateLine("Unrecognized heading", "gk", 3).error);

// TXT normalization keeps multi-part IDs and negative heights.
const normalized = api.normalizeImportedCoordinateText(
    ["# header", "HP 14-1 3463926.8 5899789.9 -3.7208", "14-23 LI;3464242.6863;5900178.1671;3.9051;extra", "bad line"].join("\n"),
    "gk"
);
assert.deepStrictEqual(normalized.text.split("\n"), [
    "HP 14-1\t3463926.8\t5899789.9\t-3.7208",
    "14-23 LI\t3464242.6863\t5900178.1671\t3.9051",
]);
assert.strictEqual(normalized.summary.importedCount, 2);
assert.strictEqual(normalized.summary.invalidCount, 1);
assert.strictEqual(normalized.summary.extraFieldCount, 1);

// KML text must be XML-escaped.
assert.strictEqual(api.escapeXml("A&B <1> \"x\" 'y'"), "A&amp;B &lt;1&gt; &quot;x&quot; &apos;y&apos;");

console.log("JavaScript behavior checks passed.");
