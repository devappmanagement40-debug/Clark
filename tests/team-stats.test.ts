import assert from "node:assert/strict";
import test from "node:test";
import { parseTeamStats } from "../client/src/lib/team-stats";

const validStats = {
  level1Count: 0,
  level2Count: 3,
  level3Count: 2,
  demoMemberCount: 0,
  totalCommission: 1250,
  level1Commission: 1000,
  level2Commission: 200,
  level3Commission: 50,
};

test("accepts finite API totals and strips fields not displayed by the page", () => {
  const parsed = parseTeamStats({ ...validStats, todayDepositAmount: 5000 });

  assert.deepEqual(parsed, validStats);
});

test("rejects a missing level count instead of silently showing partial totals", () => {
  const { level2Count: _missing, ...incompleteStats } = validStats;

  assert.throws(() => parseTeamStats(incompleteStats));
});

test("rejects negative or fractional member counts", () => {
  assert.throws(() => parseTeamStats({ ...validStats, level1Count: -1 }));
  assert.throws(() => parseTeamStats({ ...validStats, level1Count: 1.5 }));
});

test("rejects non-finite commission amounts", () => {
  assert.throws(() => parseTeamStats({ ...validStats, totalCommission: Number.NaN }));
  assert.throws(() => parseTeamStats({ ...validStats, level1Commission: Number.POSITIVE_INFINITY }));
});
