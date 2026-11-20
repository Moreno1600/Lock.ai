import test from "node:test";
import assert from "node:assert/strict";
import { parseESPNGamelog, buildFormMarkets } from "../playerProps.js";

const events: Record<string, any> = {};
for (let i = 0; i < 10; i++) {
  const date = new Date(Date.UTC(2026,10,1+i)).toISOString();
  events["g"+i] = { gameDate: date, gameResult: "W" };
}
test("NBA regular season gamelog produces points, rebounds, 3PM, assists and combos", () => {
  const data={
    labels:["MIN","FG","3PT","REB","AST","PTS"],
    names:["minutes","fieldGoals","threePointFieldGoals","rebounds","assists","points"],
    events,
    seasonTypes:[{displayName:"2026-27 Regular Season",categories:[{events:
      Array.from({length:10},(_,i)=>({eventId:"g"+i,stats:["32","8-16",String(i%5)+"-8",String(5+i%4),String(3+i%3),String(20+i)]}))}]}]
  };
  const games=parseESPNGamelog("NBA",data,"2026-11-20T00:00:00.000Z");
  assert.equal(games.length,10);
  assert.equal(games[0].stats.threepointfieldgoalsmade,4);
  assert.equal(games[0].stats.points,29);
  const m=buildFormMarkets("NBA",games);
  for(const name of ["PTS","3PM","REB","AST","PRA","PR","PA","RA"])
    assert.ok(m.some(p=>p.stat===name),name+" missing");
  assert.equal(m.find(p=>p.stat==="PTS")?.average,24.5);
  assert.equal(m.find(p=>p.stat==="PTS")?.sampleGames,10);
  assert.equal(m.find(p=>p.stat==="3PM")?.recent[0].value,4);
});
test("NFL repeated YDS/TD labels use named columns rather than confuse passing with rushing", () => {
  const data={
    labels:["CMP","ATT","YDS","TD","CAR","YDS","TD","REC","YDS","TD"],
    names:["completions","passingAttempts","passingYards","passingTouchdowns","rushingAttempts","rushingYards","rushingTouchdowns","receptions","receivingYards","receivingTouchdowns"],
    events,
    seasonTypes:[{displayName:"2026 Regular Season",categories:[{events:
      Array.from({length:10},(_,i)=>({eventId:"g"+i,stats:["20","32",String(250+i*3),"2","4",String(25+i),"1","0","0","0"]}))}]}]
  };
  const games=parseESPNGamelog("NFL",data,"2026-11-20T00:00:00.000Z");
  const m=buildFormMarkets("NFL",games);
  assert.equal(m.find(p=>p.stat==="PASS_YDS")?.average,263.5);
  assert.equal(m.find(p=>p.stat==="RUSH_YDS")?.average,29.5);
  assert.equal(m.find(p=>p.stat==="PASS_TD")?.average,2);
  assert.equal(m.find(p=>p.stat==="TD")?.average,1);
  assert.equal(m.find(p=>p.stat==="REC_YDS"),undefined);
});
test("never treats DNP or preseason games as actual regular-season form", () => {
  const data={
    labels:["MIN","REB","AST","PTS"],
    names:["minutes","rebounds","assists","points"],
    events,
    seasonTypes:[
      {displayName:"2026-27 Preseason",categories:[{events:[{eventId:"g0",stats:["40","10","7","45"]}]}]},
      {displayName:"2026-27 Regular Season",categories:[{events:[
        {eventId:"g1",stats:["DNP","--","--","--"]},
        {eventId:"g2",stats:["30","7","4","22"]},
        {eventId:"g3",stats:["31","8","5","23"]}
      ]}]}
    ]
  };
  const games=parseESPNGamelog("NBA",data,"2026-11-20T00:00:00.000Z");
  assert.equal(games.length,2);
  assert.equal(games[0].stats.points,23);
  assert.deepEqual(buildFormMarkets("NBA",games),[]);
});
