import axios from "axios";
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:3000";
const samples = [
  { sport: "NBA", eventId: "401909305", expected: "PTS" },
  { sport: "NFL", eventId: "401873070", expected: "PASS_YDS" }
];
for (const sample of samples) {
  const url = origin + "/api/edge-lab/matchup/" + sample.eventId + "/player-form";
  const { data } = await axios.get(url, { params: { sport: sample.sport }, timeout: 120_000 });
  assert.equal(data.sport, sample.sport);
  assert.ok(data.players?.length > 0, sample.sport + ": expected verified player cards");
  assert.ok(data.players.some((p:any)=>p.markets?.length && p.markets.some((m:any)=>m.recent?.length >= 4)), sample.sport + ": expected real game history");
  const featured = data.players.filter((p:any)=>p.markets.some((m:any)=>m.stat===sample.expected));
  console.log(JSON.stringify({type:"player_form_smoke",sport:sample.sport,players:data.players.length,teams:data.teams.map((t:any)=>t.abbrev),
    expectedMarket:sample.expected,example:featured[0] ? {name:featured[0].name,markets:featured[0].markets.map((m:any)=>m.stat),sampleGames:featured[0].sampleGames} : null}));
  if(sample.sport==="NBA")assert.ok(featured.length>0,"NBA must include points props");
  if(sample.sport==="NFL")assert.ok(featured.length>0,"NFL must include passing yard props");
}
