import axios from "axios";

// Uses TheOddsAPI /odds/ (theoddsapi.com), not the similarly named odds-api.io or v4 service.
// Read the API key only on the server, never send it to the browser or logs.
export type OddsSport = "NBA" | "NFL";
type Outcome = { name: string; price: number; point: number | null };
type Market = { book: string; market: string; updatedAt: string | null; outcomes: Outcome[] };
type EventOdds = { id: string; home: string; away: string; start: string; markets: Market[] };
export type OddsFeed = {
  status: "connected" | "not_configured" | "unavailable" | "restricted";
  message: string;
  fetchedAt: string | null;
  events: EventOdds[];
};
export type MatchedMarket = {
  source: string;
  moneyline: null | { book: string; awayPrice: number; homePrice: number; noVigAway: number; noVigHome: number; updatedAt: string | null; fresh: boolean };
  total: null | { book: string; line: number; overPrice: number; underPrice: number; noVigOver: number; noVigUnder: number; updatedAt: string | null; fresh: boolean };
  spread: null | { book: string; homePoint: number; awayPoint: number; updatedAt: string | null; fresh: boolean };
  bestAway: null | { book: string; price: number };
  bestHome: null | { book: string; price: number };
};
const CACHE_MS = 90000;
const cache = new Map<OddsSport, { until: number; pending: Promise<OddsFeed> }>();
const finite = (x: unknown): number | null => {
  if (x === null || x === undefined || x === "") return null;
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
};
const price = (x: unknown) => {
  const n = finite(x);
  return n !== null && Math.abs(n) >= 100 ? n : null;
};
const probability = (american: number) =>
  american < 0 ? -american / (-american + 100) : 100 / (american + 100);
const round1 = (x: number) => Math.round(x * 10) / 10;
const noVig = (a: number, b: number) => {
  const x = probability(a), y = probability(b);
  return [round1(100 * x / (x + y)), round1(100 * y / (x + y))] as const;
};
const preferredBooks = ["draftkings", "fanduel", "betmgm", "caesars", "williamhill_us"];
const priority = (book: string) => {
  const at = preferredBooks.indexOf(book.toLowerCase());
  return at === -1 ? 999 : at;
};
const fresh = (iso: string | null) => {
  if (!iso) return false;
  const time = Date.parse(iso);
  return Number.isFinite(time) && Date.now() - time <= 90 * 60 * 1000 && Date.now() >= time - 5 * 60 * 1000;
};
const leagueKey: Record<OddsSport, string> = {
  NBA: "basketball_nba", NFL: "americanfootball_nfl"
};
export function normalizePayload(data: any): EventOdds[] {
  const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  return rows.flatMap((event: any) => {
    if (!event?.home_team || !event?.away_team || !event?.start_time || !Array.isArray(event.books)) return [];
    const markets: Market[] = [];
    for (const book of event.books) {
      if (!book?.book || !book?.market || !Array.isArray(book.outcomes)) continue;
      const outcomes: Outcome[] = book.outcomes.flatMap((o: any) => {
        const p = price(o?.price);
        return typeof o?.name === "string" && p !== null
          ? [{ name: o.name, price: p, point: finite(o.point) }] : [];
      });
      if (outcomes.length) markets.push({
        book: String(book.book), market: String(book.market),
        updatedAt: typeof book.updated_at === "string" ? book.updated_at : null,
        outcomes
      });
    }
    if (!markets.length) return [];
    return [{ id: String(event.event_id || ""), home: String(event.home_team),
      away: String(event.away_team), start: String(event.start_time), markets }];
  });
}
async function getFeed(sport: OddsSport): Promise<OddsFeed> {
  const key = (process.env.THE_ODDS_API_KEY || process.env.THEODDSAPI_API_KEY || process.env.ODDS_API_KEY || "").trim();
  if (!key) return {
    status: "not_configured", message: "Odds API key is not configured on this server.",
    fetchedAt: null, events: []
  };
  const params = {
    sport_key: leagueKey[sport], markets: "h2h,spreads,totals",
    bookmakers: "draftkings,fanduel,betmgm,caesars", oddsFormat: "american"
  };
  try {
    const base = "https://api.bettingdataapi.com/odds/";
    let response;
    try {
      response = await axios.get(base, { headers: { "x-api-key": key }, params, timeout: 12000 });
    } catch (err: any) {
      // Free plans may support moneylines but not spreads/totals.
      if (err.response?.status !== 403 && err.response?.status !== 400) throw err;
      response = await axios.get(base, {
        headers: { "x-api-key": key }, params: { ...params, markets: "h2h" }, timeout: 12000
      });
    }
    if (response.data?.success === false) throw new Error("Odds provider returned unsuccessful response");
    const events = normalizePayload(response.data);
    return { status: "connected", message: events.length ? "Odds loaded from TheOddsAPI." : "Provider connected; no priced upcoming games returned.",
      fetchedAt: new Date().toISOString(), events };
  } catch (err: any) {
    const code = Number(err.response?.status);
    const restricted = [400, 401, 402, 403, 429].includes(code);
    return {
      status: restricted ? "restricted" : "unavailable",
      message: code === 401 ? "Odds provider rejected the server key." :
        code === 403 ? "Odds markets not included with this key's plan." :
        code === 429 ? "Odds API request allowance exceeded." :
        "Odds provider is unavailable; no sportsbook prices were fabricated.",
      fetchedAt: null, events: []
    };
  }
}
export function fetchSportsbookOdds(sport: OddsSport) {
  const current = cache.get(sport);
  if (current && current.until > Date.now()) return current.pending;
  const pending = getFeed(sport);
  cache.set(sport, { until: Date.now() + CACHE_MS, pending });
  return pending;
}
// Team nicknames are unique within the NBA and within the NFL; use BOTH sides
// plus a kickoff-time check to avoid mismatching similarly named fixtures.
function nickname(name: string): string {
  const norm = name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ").trim();
  const segments = norm.split(/\s+/);
  return segments[segments.length - 1] || "";
}
export function matchSportsbookEvent(feed: OddsFeed, away: string, home: string, start: string): EventOdds | null {
  const kickoff = Date.parse(start);
  if (!Number.isFinite(kickoff)) return null;
  const possible = feed.events.filter(event =>
    nickname(event.away) === nickname(away) &&
    nickname(event.home) === nickname(home) &&
    Number.isFinite(Date.parse(event.start)) &&
    Math.abs(Date.parse(event.start) - kickoff) <= 5 * 60 * 60 * 1000);
  return possible.length === 1 ? possible[0] : null;
}
function choose(entries: Market[]) {
  return entries.sort((a, b) =>
    Number(fresh(b.updatedAt)) - Number(fresh(a.updatedAt)) ||
    priority(a.book) - priority(b.book) ||
    Date.parse(b.updatedAt || "") - Date.parse(a.updatedAt || "") || 0)[0];
}
export function summarizeSportsbookMarket(event: EventOdds): MatchedMarket {
  type Found = { q: Market; a: Outcome; b: Outcome };
  const findPair = (market: string, aName: string, bName: string): Found[] =>
    event.markets.filter(m => m.market === market).flatMap(q => {
      const a = q.outcomes.find(x => nickname(x.name) === nickname(aName));
      const b = q.outcomes.find(x => nickname(x.name) === nickname(bName) &&
        (market === "spreads" ? !!a && a.point !== null && x.point === -a.point : !a || a.point === null || x.point === null || x.point === a.point));
      return a && b ? [{ q, a, b }] : [];
    });
  const twoWay = findPair("h2h", event.away, event.home).filter(x => x.a.name !== x.b.name);
  const selected = choose(twoWay.map(x => x.q));
  const money = twoWay.find(x => x.q === selected);
  const totalQuotes = event.markets.filter(x => x.market === "totals").flatMap(q => {
    const over = q.outcomes.find(x => x.name.toLowerCase() === "over" && x.point !== null);
    const under = q.outcomes.find(x => x.name.toLowerCase() === "under" && x.point === over?.point);
    return over && under ? [{ q, over, under }] : [];
  });
  const totalSelected = choose(totalQuotes.map(x => x.q));
  const total = totalQuotes.find(x => x.q === totalSelected);
  const spreadQuotes = findPair("spreads", event.home, event.away).filter(x => x.a.point !== null && x.b.point !== null);
  const spreadSelected = choose(spreadQuotes.map(x => x.q));
  const spread = spreadQuotes.find(x => x.q === spreadSelected);
  const moneyVig = money ? noVig(money.a.price, money.b.price) : null;
  const totalsVig = total ? noVig(total.over.price, total.under.price) : null;
  const bestAway = twoWay.slice().sort((a, b) => b.a.price - a.a.price)[0];
  const bestHome = twoWay.slice().sort((a, b) => b.b.price - a.b.price)[0];
  return {
    source: "TheOddsAPI",
    moneyline: money && moneyVig ? {
      book: money.q.book, awayPrice: money.a.price, homePrice: money.b.price,
      noVigAway: moneyVig[0], noVigHome: moneyVig[1],
      updatedAt: money.q.updatedAt, fresh: fresh(money.q.updatedAt)
    } : null,
    total: total && totalsVig && total.over.point !== null ? {
      book: total.q.book, line: total.over.point,
      overPrice: total.over.price, underPrice: total.under.price,
      noVigOver: totalsVig[0], noVigUnder: totalsVig[1],
      updatedAt: total.q.updatedAt, fresh: fresh(total.q.updatedAt)
    } : null,
    spread: spread && spread.a.point !== null && spread.b.point !== null ? {
      book: spread.q.book, homePoint: spread.a.point, awayPoint: spread.b.point,
      updatedAt: spread.q.updatedAt, fresh: fresh(spread.q.updatedAt)
    } : null,
    bestAway: bestAway ? { book: bestAway.q.book, price: bestAway.a.price } : null,
    bestHome: bestHome ? { book: bestHome.q.book, price: bestHome.b.price } : null
  };
}
