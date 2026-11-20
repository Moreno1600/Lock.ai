import axios from "axios";
import type { Express } from "express";
import { fetchSportsbookOdds, matchSportsbookEvent, summarizeSportsbookMarket } from "./oddsFeed.js";
import { loadTeamHistory, loadScoreboardFallback, type HistoryTeam, type HistoryGame } from "./slateHistory.js";

/**
 * Lock.ai Slate Lab: transparent 10,000-draw, team-level simulations.
 * Uses actual ESPN fixtures and completed results. The opportunity/drive model is
 * simplified, NOT measured play-by-play or a calibrated betting model.
 * No player-prop hit rates or market edges are invented when prop prices are absent.
 */
type Sport = "NBA" | "NFL";
type ScoredGame = { date: string; scored: number; allowed: number; lastGameLeader?: string };
type Team = { id: string; name: string; abbrev: string; homeAway: string };
const API = "https://site.api.espn.com/apis/site/v2/sports";
const cache = new Map<string, { expires: number; pending: Promise<any> }>();
const http = (url: string, params: Record<string, any> = {}) => {
  const key = url + JSON.stringify(params);
  const old = cache.get(key);
  if (old && old.expires > Date.now()) return old.pending;
  const pending = axios.get(url, { params, timeout: 9000 }).then(r => r.data).catch(error => {
    cache.delete(key);
    throw error;
  });
  cache.set(key, { expires: Date.now() + 120_000, pending });
  return pending;
};
const dayKey = (iso: string) => {
  const pieces = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date(iso));
  const item = (type: string) => pieces.find(p => p.type === type)?.value || "";
  return item("year") + item("month") + item("day");
};
const validNumber = (n: any): number | null => {
  if (n === null || n === undefined || n === "") return null;
  const parsed = Number(n);
  return Number.isFinite(parsed) ? parsed : null;
};
const getScore = (candidate: any): number | null =>
  validNumber(typeof candidate?.score === "object" ? candidate.score?.value ?? candidate.score?.displayValue : candidate?.score);
const completed = (event: any) =>
  event?.status?.type?.completed === true ||
  /STATUS_FINAL|FINAL/i.test(String(event?.status?.type?.name || event?.status?.type?.description || ""));
const average = (values: number[]) => values.reduce((sum, n) => sum + n, 0) / values.length;
const rounded = (value: number) => Math.round(value * 10) / 10;
const pct = (count: number) => rounded(count / 100);
const numAmerican = (value: any): number | null => {
  if (value === undefined || value === null) return null;
  const n = Number(String(value).replace(/[^0-9+.-]/g, ""));
  return Number.isFinite(n) && Math.abs(n) >= 100 ? n : null;
};
const oddsToProbability = (american: number) => american < 0
  ? -american / (-american + 100)
  : 100 / (american + 100);
function parseMarket(event: any) {
  const competition = event.competitions?.[0] || {};
  const odds = (competition.odds || event.odds || [])[0];
  if (!odds) return { spread: null, total: null, noVigAway: null, noVigHome: null, source: null };
  const total = validNumber(odds.overUnder);
  const spread = typeof odds.details === "string" && odds.details.trim() ? odds.details.trim() : null;
  const away = numAmerican(odds.awayTeamOdds?.moneyLine ?? odds.awayTeamOdds?.moneyline);
  const home = numAmerican(odds.homeTeamOdds?.moneyLine ?? odds.homeTeamOdds?.moneyline);
  if (away === null || home === null) return {
    spread, total, noVigAway: null, noVigHome: null,
    source: odds.provider?.name || odds.provider?.displayName || "ESPN-listed market"
  };
  const awayImp = oddsToProbability(away), homeImp = oddsToProbability(home);
  return {
    spread, total, noVigAway: rounded(100 * awayImp / (awayImp + homeImp)),
    noVigHome: rounded(100 * homeImp / (awayImp + homeImp)),
    source: odds.provider?.name || odds.provider?.displayName || "ESPN-listed market"
  };
}
async function leader(sport: Sport, team: Team): Promise<string | null> {
  const path = sport === "NBA" ? "basketball/nba" : "football/nfl";
  try {
    const data = await http(API + "/" + path + "/teams/" + encodeURIComponent(team.id) + "/leaders");
    const groups = Array.isArray(data.leaders) ? data.leaders : Array.isArray(data.categories) ? data.categories : [];
    for (const group of groups) {
      const best = group.leaders?.[0] || group.athletes?.[0];
      const athlete = best?.athlete || best;
      const player = athlete?.displayName || athlete?.fullName;
      if (player) {
        const stat = group.displayName || group.name || "team production";
        const amount = best?.displayValue ? " (" + best.displayValue + ")" : "";
        return player + " (" + team.abbrev + "): ESPN-listed " + stat + " leader" + amount + "; matchup role and availability not verified";
      }
    }
  } catch { /* An absent team leader must not be fabricated. */ }
  return null;
}
const drawInt = (mean: number, deviation: number) =>
  Math.round(mean + deviation * Math.sqrt(-2 * Math.log(Math.max(Number.EPSILON, Math.random()))) *
    Math.cos(2 * Math.PI * Math.random()));
function possessionPoints(pointsPerPossession: number) {
  // Model assumptions, not observed shot or possession distributions.
  const pZero = Math.max(0.26, Math.min(0.60, (2 - pointsPerPossession) / 2));
  const r = Math.random();
  if (r < pZero) return 0;
  if (r < pZero + 0.13) return 1;
  if (r < 0.87) return 2;
  return 3;
}
function nflDrivePoints(pointsPerDrive: number) {
  // Synthetic drive outcome: 65% of projected points via TDs, 35% via FGs.
  // Drive counts and scoring mix are priors, not observed play-by-play rates.
  const pTd = Math.min(0.50, 0.65 * pointsPerDrive / 7);
  const pFg = Math.min(0.45, 0.35 * pointsPerDrive / 3);
  const r = Math.random();
  if (r < pTd) return 7;
  if (r < pTd + pFg) return 3;
  return 0;
}
function simulation(sport: Sport, awayForm: ScoredGame[], homeForm: ScoredGame[], totalLine: number | null) {
  const runs = 10000;
  const aOff = average(awayForm.map(g => g.scored));
  const aDef = average(awayForm.map(g => g.allowed));
  const hOff = average(homeForm.map(g => g.scored));
  const hDef = average(homeForm.map(g => g.allowed));
  const aMean = (aOff + hDef) / 2;
  const hMean = (hOff + aDef) / 2 + (sport === "NBA" ? 1.5 : 1.2);
  let awayWins = 0, homeWins = 0, draws = 0, over = 0, under = 0, pushes = 0;
  let sumAway = 0, sumHome = 0;
  for (let i = 0; i < runs; i++) {
    // Resample recent team-level form rather than assert current detailed usage.
    const ar = awayForm[Math.floor(Math.random() * awayForm.length)];
    const hr = homeForm[Math.floor(Math.random() * homeForm.length)];
    const awayExpectation = Math.max(1, 0.70 * aMean + 0.30 * (ar.scored + hr.allowed) / 2);
    const homeExpectation = Math.max(1, 0.70 * hMean + 0.30 * (hr.scored + ar.allowed) / 2);
    let awayPoints = 0, homePoints = 0;
    if (sport === "NBA") {
      // Approximate offensive possessions; genuine pace/rotation stats are not provided.
      const opportunities = Math.max(80, Math.min(115, drawInt(98, 5)));
      const awayRate = Math.max(0.55, Math.min(1.75, awayExpectation / opportunities));
      const homeRate = Math.max(0.55, Math.min(1.75, homeExpectation / opportunities));
      for (let p = 0; p < opportunities; p++) {
        awayPoints += possessionPoints(awayRate);
        homePoints += possessionPoints(homeRate);
      }
      if (awayPoints === homePoints) {
        // Overtime is simplified; do not force a tied NBA final.
        const overtime = Math.max(1, drawInt(5, 1));
        for (let p = 0; p < overtime; p++) {
          awayPoints += possessionPoints(awayRate);
          homePoints += possessionPoints(homeRate);
        }
        if (awayPoints === homePoints) homePoints += Math.random() < 0.5 ? 1 : -1;
      }
    } else {
      const opportunities = Math.max(7, Math.min(16, drawInt(11, 2)));
      for (let d = 0; d < opportunities; d++) {
        awayPoints += nflDrivePoints(awayExpectation / opportunities);
        homePoints += nflDrivePoints(homeExpectation / opportunities);
      }
    }
    sumAway += awayPoints; sumHome += homePoints;
    if (awayPoints > homePoints) awayWins++;
    else if (homePoints > awayPoints) homeWins++;
    else draws++;
    if (totalLine !== null) {
      if (awayPoints + homePoints > totalLine) over++;
      else if (awayPoints + homePoints < totalLine) under++;
      else pushes++;
    }
  }
  return {
    runs, winAway: pct(awayWins), winHome: pct(homeWins), tie: pct(draws),
    over: totalLine === null ? null : pct(over),
    under: totalLine === null ? null : pct(under),
    push: totalLine === null ? null : pct(pushes),
    projectedAway: rounded(sumAway / runs), projectedHome: rounded(sumHome / runs),
    samples: { away: awayForm.length, home: homeForm.length }
  };
}
function teamsForEvent(event: any) {
  const entries = event.competitions?.[0]?.competitors || [];
  const extract = (homeAway: string): Team | null => {
    const e = entries.find((c: any) => c.homeAway === homeAway);
    if (!e?.team?.id) return null;
    return { id: String(e.team.id), name: String(e.team.displayName || e.team.name || "Unknown"),
      abbrev: String(e.team.abbreviation || ""), homeAway };
  };
  const away = extract("away"), home = extract("home");
  return away && home ? { away, home } : null;
}
export function registerSlateLab(app: Express) {
  app.get("/api/edge-lab/slate", async (req, res) => {
    const sport = String(req.query.sport || "NBA").toUpperCase() as Sport;
    const date = String(req.query.date || dayKey(new Date().toISOString()));
    if (!["NBA", "NFL"].includes(sport) || !/^\d{8}$/.test(date)) {
      return res.status(400).json({ error: "Valid NBA/NFL sport and YYYYMMDD date required" });
    }
    const key = "slate:" + sport + ":" + date;
    const existing = cache.get(key);
    if (existing && existing.expires > Date.now()) return res.json(await existing.pending);
    try {
      const league = sport === "NBA" ? "basketball/nba" : "football/nfl";
      const source = await http(API + "/" + league + "/scoreboard",
        sport === "NBA" ? { dates: date, limit: 100 } : { limit: 100 });
      const sportsbook = await fetchSportsbookOdds(sport);
      const events = (source.events || []).filter((event: any) => {
        if (completed(event) || !event.date) return false;
        if (event.status?.type?.state === "in") return false; // Pregame model cannot forecast a live game's remaining plays. // Never backtest using a game's final result.
        const dateOfGame = dayKey(event.date);
        if (sport === "NBA") return dateOfGame === date;
        // ESPN's NFL scoreboard is a weekly slate; restrict to the selected 7-day window.
        const first = Date.UTC(+date.slice(0, 4), +date.slice(4, 6) - 1, +date.slice(6, 8));
        const current = Date.UTC(+dateOfGame.slice(0, 4), +dateOfGame.slice(4, 6) - 1, +dateOfGame.slice(6, 8));
        return current >= first && current < first + 7 * 86_400_000;
      }).slice(0, 25);
      // Build a shared verified-result pool once per slate so missing team-schedule
      // scores can be recovered from completed league scoreboards without duplicate calls.
      const allTeams = new Map<string, HistoryTeam>();
      for (const event of events) {
        const pair = teamsForEvent(event);
        if (pair) {
          allTeams.set(pair.away.id, pair.away);
          allTeams.set(pair.home.id, pair.home);
        }
      }
      const teamList = [...allTeams.values()];
      let histories: Record<string, HistoryGame[]> = {};
      for (let index = 0; index < teamList.length; index += 5) {
        const batch = await Promise.allSettled(teamList.slice(index,index + 5)
          .map(team => loadTeamHistory(sport, team, new Date().toISOString(), http)));
        batch.forEach((result,i) => {
          const team = teamList[index + i];
          histories[team.id] = result.status === "fulfilled" ? result.value : [];
        });
      }
      if (teamList.length) {
        histories = await loadScoreboardFallback(sport, teamList, new Date().toISOString(), http, histories);
      }
      // Bound ESPN requests to three games at a time.
      const games: any[] = [];
      for (let index = 0; index < events.length; index += 3) {
        const batch = await Promise.all(events.slice(index, index + 3).map(async (event: any) => {
        const pair = teamsForEvent(event);
        if (!pair) return null;
        const espnMarket = parseMarket(event);
        const providerEvent = matchSportsbookEvent(sportsbook, pair.away.name, pair.home.name, event.date);
        const quoted = providerEvent ? summarizeSportsbookMarket(providerEvent) : null;
        // Favor verified recent sportsbook totals; never blend odds from different books.
        const trustedTotal = quoted?.total?.fresh ? quoted.total : null;
        const totalLine = trustedTotal?.line ?? espnMarket.total;
        const trustedMoneyline = quoted?.moneyline?.fresh ? quoted.moneyline : null;
        const market = {
          spread: quoted?.spread?.fresh ? pair.home.abbrev + " " + String(quoted.spread.homePoint) : espnMarket.spread,
          total: totalLine,
          noVigAway: trustedMoneyline?.noVigAway ?? null,
          noVigHome: trustedMoneyline?.noVigHome ?? null,
          source: trustedTotal || trustedMoneyline || quoted?.spread?.fresh ? "TheOddsAPI" : espnMarket.source
        };
        const missing: string[] = [];
        // Provider connection failures belong in one top-level diagnostic, not on every game.
        if (sportsbook.status === "connected" && !providerEvent) missing.push("No matched sportsbook lines for this game");
        else if (sportsbook.status === "connected" && !trustedMoneyline) missing.push("Fresh two-sided moneyline prices unavailable");
        if (quoted?.total && !quoted.total.fresh) missing.push("Provider totals quote timestamp is stale or missing");
        if (quoted?.moneyline && !quoted.moneyline.fresh) missing.push("Provider moneyline quote timestamp is stale or missing");
        let model: any = null;
        let players: string[] = [];
        const af = histories[pair.away.id] || [];
        const hf = histories[pair.home.id] || [];
        const [aLeader, hLeader] = await Promise.allSettled([
          af.some(g => g.lastGameLeader) ? Promise.resolve(null) : leader(sport, pair.away),
          hf.some(g => g.lastGameLeader) ? Promise.resolve(null) : leader(sport, pair.home)
        ]);
        const minSample = sport === "NBA" ? 5 : 4;
        if (af.length < minSample || hf.length < minSample) {
          missing.push("Insufficient verified recent game scores (needs " + minSample + "+ per team)");
        } else model = simulation(sport, af, hf, market.total);
        const awayContext = af.find(g => g.lastGameLeader)?.lastGameLeader;
        const homeContext = hf.find(g => g.lastGameLeader)?.lastGameLeader;
        if (awayContext) players.push(awayContext);
        else if (aLeader.status === "fulfilled" && aLeader.value) players.push(aLeader.value);
        if (homeContext) players.push(homeContext);
        else if (hLeader.status === "fulfilled" && hLeader.value) players.push(hLeader.value);
        if (!players.length) missing.push("Verified individual player usage and team leaders");
        if (market.total === null) missing.push("Verified pregame total");
        if (market.spread === null) missing.push("Verified pregame spread");
        missing.push("Detailed injuries, rotations and coaching tendencies are not yet modeled");
        if (sport === "NFL") missing.push("Verified outdoor weather and play-level red-zone roles not incorporated");
        missing.push("Player-prop and anytime-TD models are not yet connected");
        // NFL markets are generally two-way, so remove model ties before a two-way comparison.
        const winSum = model ? model.winAway + model.winHome : 0;
        const comparableAway = model && sport === "NFL" && winSum > 0 ? rounded(100 * model.winAway / winSum) : model?.winAway;
        const comparableHome = model && sport === "NFL" && winSum > 0 ? rounded(100 * model.winHome / winSum) : model?.winHome;
        const mlGap = model && market.noVigAway !== null && market.noVigHome !== null ? [
          { team: pair.away.name, gap: rounded(comparableAway - market.noVigAway), sim: comparableAway, market: market.noVigAway },
          { team: pair.home.name, gap: rounded(comparableHome - market.noVigHome), sim: comparableHome, market: market.noVigHome }
        ].filter(v => v.gap >= 8).sort((x, y) => y.gap - x.gap) : [];
        // Two-way totals markets refund pushes. Compare on the non-push outcomes only.
        const nonPushTotal = model && model.over !== null && model.under !== null
          ? model.over + model.under : 0;
        const comparableOver = nonPushTotal > 0 ? rounded(100 * model.over / nonPushTotal) : null;
        const comparableUnder = nonPushTotal > 0 ? rounded(100 * model.under / nonPushTotal) : null;
        const totalGap = model && trustedTotal && comparableOver !== null && comparableUnder !== null ? [
          { side: "Over", line: trustedTotal.line, gap: rounded(comparableOver - trustedTotal.noVigOver), sim: comparableOver, market: trustedTotal.noVigOver },
          { side: "Under", line: trustedTotal.line, gap: rounded(comparableUnder - trustedTotal.noVigUnder), sim: comparableUnder, market: trustedTotal.noVigUnder }
        ].filter(v => v.gap >= 8).sort((x, y) => y.gap - x.gap) : [];
        return {
          id: String(event.id), date: event.date, sport, away: pair.away.name, home: pair.home.name,
          line: market.spread, totalLine: market.total,
          marketSource: market.source, marketNoVigAway: market.noVigAway, marketNoVigHome: market.noVigHome,
          sportsbookOdds: quoted, totalWatch: totalGap,
          model, players, anytimeTouchdowns: [], playerPropEdges: [], moneylineWatch: mlGap,
          verifiedThreshold: 8, missing
        };
        }));
        games.push(...batch);
      }
      const payload = {
        sport, date, fetchedAt: new Date().toISOString(), games: games.filter(Boolean),
        sportsbook: { status: sportsbook.status, message: sportsbook.message, fetchedAt: sportsbook.fetchedAt },
        note: "Exploratory 10,000-trial team scoring model using ESPN completed game scores. Not a calibrated play-by-play model; player roles, injuries, and weather are not included. Market data is optional.",
        dataSource: "ESPN public game and team history; TheOddsAPI market prices where securely configured and matchable",
        window: sport === "NBA" ? "Selected calendar day" : "Selected day plus the next six days"
      };
      cache.set(key, { expires: Date.now() + 90_000, pending: Promise.resolve(payload) });
      return res.json(payload);
    } catch (error: any) {
      console.warn("Edge Lab slate unavailable", error.message);
      return res.status(503).json({ error: "Verified ESPN slate data unavailable. No predictions were fabricated." });
    }
  });
}
