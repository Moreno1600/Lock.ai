import assert from "node:assert/strict";
import test from "node:test";
import { completedHistory, loadTeamHistory, loadScoreboardFallback } from "../slateHistory.js";

const past = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
const hawks = { id: "1", name: "Atlanta Hawks", abbrev: "ATL" };
const hornets = { id: "30", name: "Charlotte Hornets", abbrev: "CHA" };
const finalGame = (i: number, options?: { statusInCompetition?: boolean; missingScore?: boolean }) => {
  const status = { type: { completed: true, state: "post", name: "STATUS_FINAL" } };
  return {
    id: "event_" + i,
    date: past(i),
    ...(options?.statusInCompetition ? {} : { status }),
    competitions: [{
      ...(options?.statusInCompetition ? { status } : {}),
      competitors: [
        { homeAway: "home", team: { id: "1", abbreviation: "ATL" }, score: options?.missingScore ? null : { value: 115 + i } },
        { homeAway: "away", team: { id: "30", abbreviation: "CHA" }, score: String(102 + i) }
      ]
    }]
  };
};
test("reads completed game scores when ESPN uses competition-level final status", () => {
  const items = completedHistory([finalGame(1, { statusInCompetition: true })], hawks, new Date().toISOString());
  assert.equal(items.length, 1);
  assert.equal(items[0].scored, 116);
  assert.equal(items[0].allowed, 103);
});
test("ignores games with missing scores, unfinished events and future events", () => {
  const live = finalGame(3);
  live.status = { type: { completed: false, state: "in", name: "STATUS_IN_PROGRESS" } };
  const incomplete = finalGame(2, { missingScore: true });
  const future = finalGame(-1);
  const items = completedHistory([live, incomplete, future, finalGame(1)], hornets, new Date().toISOString());
  assert.equal(items.length, 1);
  assert.equal(items[0].scored, 103);
});
test("recovers actual completed league scoreboard scores when team schedules lack them", async () => {
  const fetchJson = async (url: string) =>
    url.includes("/scoreboard") ? { events: [1,2,3,4,5,6].map(i => finalGame(i)) } : { events: [] };
  const teams = [hawks,hornets];
  const result = await loadScoreboardFallback("NBA", teams, new Date().toISOString(), fetchJson,
    { "1": [], "30": [] });
  assert.equal(result["1"].length, 6);
  assert.equal(result["30"].length, 6);
  assert.equal(result["1"][0].date > result["1"][1].date, true);
  assert.equal(result["30"][0].scored, 103);
});
test("uses verified team schedule scores before fallback", async () => {
  const fetchJson = async (url: string) =>
    url.endsWith("/schedule") ? { events: [finalGame(1), finalGame(3), finalGame(5),finalGame(7),finalGame(9)] } : { events: [] };
  const result = await loadTeamHistory("NBA", hawks, new Date().toISOString(), fetchJson);
  assert.equal(result.length, 5);
  assert.equal(result[0].scored, 116);
});
