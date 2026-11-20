// ESPN schedule responses sometimes omit completed scores; merge them with
// independently verified league scoreboard history. Never fabricate results.
export type HistorySport = "NBA" | "NFL";
export type HistoryTeam = { id: string; name: string; abbrev: string };
export type HistoryGame = { id: string; date: string; scored: number; allowed: number; lastGameLeader?: string };
type FetchJson = (url: string, params?: Record<string, any>) => Promise<any>;
const root = "https://site.api.espn.com/apis/site/v2/sports";
const league = (sport: HistorySport) => sport === "NBA" ? "basketball/nba" : "football/nfl";
const value = (score: any): number | null => {
  const raw = typeof score === "object" && score !== null
    ? score.value ?? score.displayValue : score;
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const finalStatus = (item: any) => item?.status?.type?.completed === true ||
  item?.status?.type?.state === "post" ||
  /FINAL/i.test(String(item?.status?.type?.name || ""));
const teamMatches = (entry: any, team: HistoryTeam) =>
  String(entry?.team?.id ?? entry?.id ?? "") === team.id ||
  String(entry?.team?.abbreviation || "").toUpperCase() === team.abbrev.toUpperCase();
export function completedHistory(events: any[], team: HistoryTeam, beforeISO: string, maxGames = 12): HistoryGame[] {
  const results = new Map<string, HistoryGame>();
  for (const event of events || []) {
    if (!event?.date || Date.parse(event.date) >= Date.parse(beforeISO)) continue;
    if (event.season?.type === 1) continue; // no preseason
    const contest = event.competitions?.[0];
    if (!contest || !(finalStatus(event) || finalStatus(contest))) continue;
    const competitors = contest.competitors || [];
    const own = competitors.find((entry: any) => teamMatches(entry, team));
    const opponent = competitors.find((entry: any) => entry !== own);
    if (!own || !opponent) continue;
    const scored = value(own.score), allowed = value(opponent.score);
    if (scored === null || allowed === null) continue;
    let lastGameLeader: string | undefined;
    const leaderGroups = contest.leaders || own.leaders || [];
    for (const group of leaderGroups) {
      const leader = (group.leaders || []).find((l: any) =>
        teamMatches({ team: l.team || l.athlete?.team }, team)
      );
      const name = leader?.athlete?.displayName || leader?.athlete?.fullName;
      if (name) {
        lastGameLeader = String(name) + " (" + team.abbrev + "): " +
          String(group.displayName || group.name || "recent box-score leader") +
          (leader.displayValue ? " · " + leader.displayValue : "");
        break;
      }
    }
    const id = String(event.id || contest.id || event.date + team.id);
    results.set(id, { id, date: event.date, scored, allowed, lastGameLeader });
  }
  return [...results.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, maxGames);
}
const compactDay = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
const pastDay = (iso: string, daysBefore: number) =>
  new Date(Date.parse(iso) - daysBefore * 86400000).toISOString();
export async function loadTeamHistory(
  sport: HistorySport, team: HistoryTeam, beforeISO: string, fetchJson: FetchJson
): Promise<HistoryGame[]> {
  const path = root + "/" + league(sport);
  const season = Number(beforeISO.slice(0, 4)) + (sport === "NBA" && Number(beforeISO.slice(5, 7)) >= 7 ? 1 : 0);
  const results = new Map<string, HistoryGame>();
  for (const year of [season, season - 1]) {
    if (results.size >= (sport === "NBA" ? 8 : 5)) break;
    try {
      const data = await fetchJson(path + "/teams/" + encodeURIComponent(team.id) + "/schedule",
        { season: year, limit: 120 });
      for (const game of completedHistory(data.events || [], team, beforeISO)) results.set(game.id, game);
    } catch { /* try alternate history source */ }
  }
  return [...results.values()].sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, sport === "NBA" ? 12 : 8);
}
export async function loadScoreboardFallback(
  sport: HistorySport, teams: HistoryTeam[], beforeISO: string,
  fetchJson: FetchJson, current: Record<string, HistoryGame[]>
): Promise<Record<string, HistoryGame[]>> {
  const maximum = sport === "NBA" ? 12 : 8;
  const minimum = sport === "NBA" ? 5 : 4;
  const all = new Map<string, HistoryGame[]>();
  for (const t of teams) all.set(t.id, [...(current[t.id] || [])]);
  const missing = () => teams.some(t => (all.get(t.id)?.length || 0) < minimum);
  if (!missing()) return Object.fromEntries(all);
  const path = root + "/" + league(sport) + "/scoreboard";
  const addEvents = (events: any[]) => {
    for (const t of teams) {
      const map = new Map((all.get(t.id) || []).map(g => [g.id, g]));
      for (const g of completedHistory(events, t, beforeISO, maximum)) map.set(g.id, g);
      all.set(t.id, [...map.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, maximum));
    }
  };
  // Date ranges are supported by some ESPN feeds; if a feed ignores ranges,
  // explicitly validate results and try smaller buckets instead.
  const days = sport === "NBA" ? 30 : 63;
  try {
    const data = await fetchJson(path, {
      dates: compactDay(pastDay(beforeISO, days)) + "-" + compactDay(pastDay(beforeISO, 1)),
      limit: 500
    });
    addEvents(data.events || []);
  } catch { /* try discrete scoreboards */ }
  if (!missing()) return Object.fromEntries(all);
  const dates: string[] = [];
  const step = sport === "NBA" ? 1 : 7;
  for (let n = 1; n <= days; n += step) dates.push(compactDay(pastDay(beforeISO, n)));
  for (let i = 0; i < dates.length && missing(); i += 4) {
    const batches = await Promise.allSettled(
      dates.slice(i, i + 4).map(d => fetchJson(path, { dates: d, limit: 100 }))
    );
    for (const batch of batches) if (batch.status === "fulfilled") addEvents(batch.value.events || []);
  }
  return Object.fromEntries(all);
}
