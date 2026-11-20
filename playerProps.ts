import axios from "axios";
import type { Express } from "express";

export type FormSport = "NBA" | "NFL";
export type FormGame = { date: string; eventId: string; stats: Record<string, number> };
export type FormMarket = {
  stat: string; label: string; average: number; last5Average: number;
  referenceLine: number; hits: number; sampleGames: number;
  recent: Array<{ date: string; value: number }>;
};
export type FormPlayer = {
  id: string; name: string; teamId: string; team: string;
  position: string; headshot: string | null; status: string | null;
  sampleGames: number; markets: FormMarket[];
};
const SITE = "https://site.api.espn.com/apis/site/v2/sports";
const WEB = "https://site.web.api.espn.com/apis/common/v3/sports";
const cache = new Map<string, { until: number; pending: Promise<any> }>();
const fetchJson = (url: string, params: Record<string, string|number> = {}) => {
  const key = url + JSON.stringify(params);
  const entry = cache.get(key);
  if (entry && entry.until > Date.now()) return entry.pending;
  const pending = axios.get(url, { params, timeout: 8000 })
    .then(r => r.data)
    .catch(e => { cache.delete(key); throw e; });
  cache.set(key, { until: Date.now() + 10 * 60_000, pending });
  return pending;
};
const numeric = (v: unknown): number | null => {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const t = v.trim().replace(/,/g, "");
  if (!t || t === "--" || t === "-" || t.toLowerCase() === "dnp") return null;
  const m = /^(-?\d+(?:\.\d+)?)/.exec(t);
  return m ? Number(m[1]) : null;
};
const rounded = (x: number) => Math.round(x * 10) / 10;
function statKey(name: string): string {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function getStat(row: Record<string, number>, ...names: string[]) {
  for (const n of names) if (Number.isFinite(row[n])) return row[n];
  return null;
}
function minutes(row: Record<string, number>): number | null {
  return getStat(row,"minutes","min");
}
function flatRoster(sport: FormSport, data: any): any[] {
  const groups = Array.isArray(data?.athletes) ? data.athletes : [];
  const entries = groups.flatMap((a: any) =>
    Array.isArray(a?.items) ? a.items : a?.id ? [a] : []);
  const seen = new Set<string>();
  return entries.filter((p: any) => {
    const id = String(p.id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    if (sport === "NFL") {
      if (!["QB","RB","WR","TE"].includes(String(p.position?.abbreviation || ""))) return false;
      if (["practice squad","injured reserve"].includes(String(p.status?.name||"").toLowerCase())) return false;
    }
    return true;
  });
}
function shortlist(sport: FormSport, roster: any[]) {
  if (sport === "NBA") return roster.slice(0, 20);
  const quotas: Record<string, number> = { QB: 2, RB: 4, WR: 7, TE: 3 };
  const counts: Record<string, number> = {};
  return roster.filter(p => {
    const position = String(p.position?.abbreviation || "");
    counts[position] = (counts[position] || 0) + 1;
    return counts[position] <= (quotas[position] || 0);
  });
}
const NBA_LABELS: Record<string,string> = {
  PTS:"Points", "3PM":"3-Pointers", REB:"Rebounds", AST:"Assists",
  PRA:"Pts + Reb + Ast", PR:"Pts + Reb", PA:"Pts + Ast", RA:"Reb + Ast"
};
const NFL_LABELS: Record<string,string> = {
  PASS_YDS:"Passing yards", RUSH_YDS:"Rushing yards", REC_YDS:"Receiving yards",
  REC:"Receptions", PASS_TD:"Passing TDs", TD:"Anytime TDs (rush + receive)"
};
function statValue(row: Record<string,number>, key: string): number | null {
  const pts = getStat(row,"points","pts");
  const reb = getStat(row,"totalrebounds","rebounds","reb");
  const ast = getStat(row,"assists","ast");
  const combos: Record<string,number[]|null> = {
    PRA: pts !== null && reb !== null && ast !== null ? [pts,reb,ast] : null,
    PR: pts !== null && reb !== null ? [pts,reb] : null,
    PA: pts !== null && ast !== null ? [pts,ast] : null,
    RA: reb !== null && ast !== null ? [reb,ast] : null
  };
  if (key in combos) return combos[key]?.reduce((a,b)=>a+b,0) ?? null;
  switch(key){
    case "PTS": return pts;
    case "3PM": return getStat(row,"threepointfieldgoalsmade","threepointersmade","threepointmade","3pt","fg3m");
    case "REB": return reb;
    case "AST": return ast;
    case "PASS_YDS": return getStat(row,"passingyards","passyards");
    case "RUSH_YDS": return getStat(row,"rushingyards","rushyards");
    case "REC_YDS": return getStat(row,"receivingyards","recyards");
    case "REC": return getStat(row,"receptions","rec");
    case "PASS_TD": return getStat(row,"passingtouchdowns","passingtd");
    case "TD": {
      const rush = getStat(row,"rushingtouchdowns","rushingtd");
      const receiving = getStat(row,"receivingtouchdowns","receivingtd");
      return rush !== null && receiving !== null ? rush + receiving
        : rush !== null ? rush : receiving; // Only known components; see note below.
    }
    default: return null;
  }
}
function referenceLine(stat: string, mean: number) {
  if (stat === "TD" || stat === "PASS_TD") return 0.5;
  if (["PASS_YDS","RUSH_YDS","REC_YDS"].includes(stat)) return Math.max(0.5, Math.floor(mean / 5) * 5 + 0.5);
  return Math.max(0.5, Math.floor(mean) + 0.5);
}
export function parseESPNGamelog(sport: FormSport, data: any, beforeISO: string): FormGame[] {
  const names = Array.isArray(data?.names) ? data.names : [];
  const labels = Array.isArray(data?.labels) ? data.labels : [];
  const rows = new Map<string, FormGame>();
  for (const season of data?.seasonTypes || []) {
    if (!/regular season/i.test(String(season.displayName || ""))) continue;
    for (const category of season.categories || []) {
      const cols: string[] = (category.names?.length ? category.names : names).map((n: any)=>statKey(n));
      const fallback: string[] = (category.labels?.length ? category.labels : labels).map((n: any)=>statKey(n));
      for (const event of category.events || []) {
        const eventId = String(event.eventId || "");
        const metadata = data?.events?.[eventId];
        const dt = metadata?.gameDate || metadata?.date;
        if (!eventId || !dt || Date.parse(dt) >= Date.parse(beforeISO)) continue;
        const values = Array.isArray(event.stats) ? event.stats : [];
        if (!values.length) continue;
        const prior: FormGame = rows.get(eventId) || { date: dt, eventId, stats: {} };
        const keyMap = Object.keys(prior.stats);
        for (let i=0;i<values.length;i++) {
          const n = numeric(values[i]);
          if (n === null) continue;
          const col = cols[i] || fallback[i];
          if (!col) continue;
          // Do not interpret a rate/percentage as a count or concatenate categories.
          prior.stats[col] = n;
          // NBA "3PT" is the made-attempted string, not shooting percentage.
          if (sport === "NBA" && fallback[i] === "3pt") prior.stats.threepointfieldgoalsmade = n;
        }
        if (Object.keys(prior.stats).length > keyMap.length) rows.set(eventId,prior);
      }
    }
  }
  const sorted = [...rows.values()].sort((a,b) => b.date.localeCompare(a.date));
  if(sport === "NBA") return sorted.filter(g => (minutes(g.stats) ?? 0) > 0).slice(0,10);
  return sorted.slice(0,10);
}
export function buildFormMarkets(sport: FormSport, games: FormGame[]): FormMarket[] {
  const keys = sport === "NBA" ? Object.keys(NBA_LABELS) : Object.keys(NFL_LABELS);
  const names = sport === "NBA" ? NBA_LABELS : NFL_LABELS;
  const markets: FormMarket[] = [];
  for(const stat of keys){
    const available = games.flatMap(g => {
      const v = statValue(g.stats,stat);
      return v === null || !Number.isFinite(v) ? [] : [{date:g.date,value:v}];
    });
    if(available.length < 4) continue;
    const values = available.map(g=>g.value);
    const average = values.reduce((a,b)=>a+b,0)/values.length;
    if (average <= 0 && !["TD","PASS_TD"].includes(stat)) continue;
    const line = referenceLine(stat,average);
    markets.push({
      stat,label:names[stat],average:rounded(average),
      last5Average:rounded(values.slice(0,5).reduce((a,b)=>a+b,0)/Math.min(5,values.length)),
      referenceLine:line,hits:values.filter(v=>v>line).length,sampleGames:values.length,
      recent:available
    });
  }
  return markets;
}
function rank(sport: FormSport, p: FormPlayer) {
  const by=(key:string)=>p.markets.find(m=>m.stat===key)?.average || 0;
  return sport==="NBA"
    ? by("PTS") + 1.5*by("AST") + 0.8*by("REB")
    : by("PASS_YDS")/15 + by("RUSH_YDS")/5 + by("REC_YDS")/5 + by("REC")*2 + by("TD")*8;
}
async function teamPlayers(sport: FormSport, team: {id:string;name:string;abbrev:string}, gameDate: string) {
  const league=sport==="NBA" ? "basketball/nba" : "football/nfl";
  const roster=await fetchJson(SITE+"/"+league+"/teams/"+team.id+"/roster");
  const players=shortlist(sport,flatRoster(sport,roster));
  const payloads: Array<FormPlayer | null>=[];
  // Bound concurrency; this route loads only when a matchup is expanded.
  for(let i=0;i<players.length;i+=6){
    const responses=await Promise.allSettled(players.slice(i,i+6).map(async athlete => {
      const data=await fetchJson(WEB+"/"+league+"/athletes/"+athlete.id+"/gamelog");
      const games=parseESPNGamelog(sport,data,gameDate);
      const markets=buildFormMarkets(sport,games);
      if(games.length<4 || !markets.length) return null;
      return {
        id:String(athlete.id),name:String(athlete.displayName||athlete.fullName||"Unknown"),
        teamId:team.id,team:team.abbrev,position:String(athlete.position?.abbreviation||""),
        headshot:typeof athlete.headshot?.href==="string"?athlete.headshot.href:null,
        status:String(athlete.status?.name||"Unknown"),sampleGames:games.length,
        markets
      } as FormPlayer;
    }));
    for(const response of responses) if(response.status==="fulfilled"&&response.value) payloads.push(response.value);
  }
  return (payloads.filter(Boolean) as FormPlayer[]).sort((a,b)=>rank(sport,b)-rank(sport,a)).slice(0,5);
}
function summaryTeams(data:any):Array<{id:string;name:string;abbrev:string;homeAway:string}>{
  const contestants=data?.header?.competitions?.[0]?.competitors || [];
  return contestants.flatMap((c:any)=>{
    const t=c.team||{};
    const id=String(t.id||c.id||"");
    if(!/^\d+$/.test(id))return [];
    return [{id,name:String(t.displayName||t.name||""),abbrev:String(t.abbreviation||""),homeAway:String(c.homeAway||"")}];
  });
}
export function registerPlayerForm(app:Express){
  app.get("/api/edge-lab/matchup/:eventId/player-form",async(req,res)=>{
    const sport=String(req.query.sport||"NBA").toUpperCase() as FormSport;
    const eventId=String(req.params.eventId||"");
    if(!["NBA","NFL"].includes(sport)||!/^\d{6,12}$/.test(eventId))
      return res.status(400).json({error:"Valid ESPN matchup ID and NBA/NFL sport required"});
    const league=sport==="NBA"?"basketball/nba":"football/nfl";
    try{
      const summary=await fetchJson(SITE+"/"+league+"/summary",{event:eventId});
      const teams=summaryTeams(summary);
      const date=String(summary?.header?.competitions?.[0]?.date||summary?.header?.competitions?.[0]?.startDate||"");
      if(teams.length!==2||!Number.isFinite(Date.parse(date)))
        return res.status(503).json({error:"ESPN matchup and team identifiers are unavailable."});
      // Allow historical comparisons; only include games strictly before this matchup.
      const teamResults=await Promise.allSettled(teams.map(team=>teamPlayers(sport,team,date)));
      const players=teamResults.flatMap((r,i)=>r.status==="fulfilled"?r.value:[]);
      return res.json({
        sport,eventId,date,teams:teams.map(t=>({id:t.id,abbrev:t.abbrev,name:t.name})),
        players,referenceOnly:true,
        source:"ESPN athlete regular-season game logs",
        note:"These are descriptive last-10 game statistics and hit rates against adjustable reference lines, NOT sportsbook prop quotes or calibrated future-game probabilities. Past hits may not represent a future-game edge. Current injuries, confirmed starters and projections are not incorporated.",
        unavailable:players.length===0,
        reason:players.length===0?"ESPN did not return at least four usable regular-season game logs for eligible players. No player figures were invented.":null,
        updatedAt:new Date().toISOString()
      });
    }catch(e:any){
      console.warn("Slate player-form fetch failed",e.message);
      return res.status(503).json({error:"Verified player game logs are temporarily unavailable."});
    }
  });
}
