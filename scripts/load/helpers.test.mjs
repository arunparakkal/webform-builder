import { test } from "node:test";
import assert from "node:assert/strict";
import { keyPrefix, newRunId, percentile, summarizeHttp } from "./lib.mjs";

test("percentile uses the nearest rank on a sorted list", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile([], 50), 0);
  assert.equal(percentile(values, 50), 5);
  assert.equal(percentile(values, 100), 10);
});

test("run ids and key prefixes stay unique and queryable", () => {
  const a = newRunId("rec");
  const b = newRunId("rec");
  assert.notEqual(a, b);
  assert.match(a, /^rec-/);
  assert.equal(keyPrefix(a), `${a}-`);
});

test("summarizeHttp counts accepted 202s separately from failures", () => {
  const summary = summarizeHttp(
    [
      { ok: true, status: 202, ms: 10 },
      { ok: true, status: 202, ms: 20 },
      { ok: false, status: 429, ms: 5 },
    ],
    100,
  );
  assert.equal(summary.total, 3);
  assert.equal(summary.accepted, 2);
  assert.equal(summary.failed, 1);
  assert.equal(summary.byStatus["202"], 2);
  assert.equal(summary.byStatus["429"], 1);
  assert.equal(summary.throughputRps, 30);
});
