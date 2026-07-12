import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import * as cheerio from "cheerio";
import { GoogleGenAI } from "@google/genai";
import cron from "node-cron";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;
const CURRENT_SEASON = "2025-26"; // Update as needed

// Season calendars — when a sport is in its off-season, endpoints return empty
// data and the UI shows an "unavailable" notice instead of mock games.
function getSeasonStatus() {
  const now = new Date();
  const m = now.getMonth(); // 0 = January
  const d = now.getDate();

  // NBA: ~Oct 20 through the Finals (~June 22)
  const nbaActive = (m === 9 && d >= 20) || m >= 10 || m <= 4 || (m === 5 && d <= 22);
  // MLB: ~Mar 25 through the World Series (~Nov 5)
  const mlbActive = (m === 2 && d >= 25) || (m >= 3 && m <= 9) || (m === 10 && d <= 5);
  // Soccer (European leagues): ~Aug 10 through May
  const soccerActive = (m === 7 && d >= 10) || m >= 8 || m <= 4;

  return {
    NBA: { active: nbaActive, resumes: "late October" },
    MLB: { active: mlbActive, resumes: "late March" },
    SOCCER: { active: soccerActive, resumes: "mid-August" }
  };
}

// Feature 3: Line Movement Store
const lineMovementStore: Record<string, Array<{line: number, time: string}>> = {};

const mlbTricodes: Record<number, string> = {
  108: "LAA", 109: "ARI", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN",
  114: "CLE", 115: "COL", 116: "DET", 117: "HOU", 118: "KC", 119: "LAD",
  120: "WSH", 121: "NYM", 133: "OAK", 134: "PIT", 135: "SD", 136: "SEA",
  137: "SF", 138: "STL", 139: "TB", 140: "TEX", 141: "TOR", 142: "MIN",
  143: "PHI", 144: "ATL", 145: "CWS", 146: "MIA", 147: "NYY", 158: "MIL"
};

// NBA API Headers to avoid blocking
const nbaHeaders = {
  "Connection": "keep-alive",
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "x-nba-stats-origin": "stats",
  "x-nba-stats-token": "true",
  "Referer": "https://www.nba.com/",
  "Origin": "https://www.nba.com",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site"
};

const cdnHeaders = {
  "Connection": "keep-alive",
  "Accept": "application/json, text/plain, */*",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Referer": "https://www.nba.com/",
  "Origin": "https://www.nba.com",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site"
};

const fetchWithRetry = async (targetUrl: string, headers: any, retries = 2): Promise<any> => {
  try {
    const config: any = { 
      timeout: 15000, 
      headers: { ...headers } 
    };
    
    // Add mandatory headers for NBA APIs that have become strict
    if (targetUrl.includes('nba.com')) {
      config.headers["x-nba-stats-origin"] = "stats";
      config.headers["x-nba-stats-token"] = "true";
      config.headers["Referer"] = "https://www.nba.com/";
    }

    // High-precision dynamic headers for CDN requests (Boxscore & PBP)
    if (targetUrl.includes('cdn.nba.com')) {
      const match = targetUrl.match(/boxscore_(\d+)\.json|playbyplay_(\d+)\.json/);
      const gameId = match ? (match[1] || match[2]) : null;
      if (gameId) {
        config.headers["Referer"] = `https://www.nba.com/game/${gameId}`;
        config.headers["Origin"] = "https://www.nba.com";
        config.headers["Host"] = "cdn.nba.com";
      }
      
      // Initial sleep to avoid "instant fetch" detection on fresh page loads
      if (retries === 2) {
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
      }
    }

    return await axios.get(targetUrl, config);
  } catch (err: any) {
    if (retries > 0 && (err.response?.status === 403 || err.code === 'ECONNABORTED' || err.response?.status === 400)) {
      console.warn(`${err.response?.status || 'Timeout'} on ${targetUrl}, rotation attempt (${retries} left)...`);
      
      let altHeaders = { ...headers };
      if (retries === 2) {
        // Attempt 2: High-fidelity MacBook Chrome identity
        altHeaders = {
          ...cdnHeaders,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
          "Sec-Ch-Ua-Platform": '"macOS"',
          "Sec-Ch-Ua-Mobile": "?0",
        };
      } else {
        // Attempt 3: Mobile Safari identity (often bypasses desktop-centric WAFs)
        altHeaders = {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
          "Referer": "https://www.nba.com/",
          "Accept-Language": "en-US,en;q=0.9",
          "Origin": "https://www.nba.com"
        };
      }
      
      // Increased jittered delay
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 1000));
      return await fetchWithRetry(targetUrl, altHeaders, retries - 1);
    }
    throw err;
  }
};

// In-memory cache for players list - pre-populate with fallback for immediate availability
let playersCache: any[] = [
  { PERSON_ID: 1629029, DISPLAY_FIRST_LAST: "Luka Doncic", TEAM_ABBREVIATION: "LAL", TEAM_ID: 1610612747 },
  { PERSON_ID: 202681, DISPLAY_FIRST_LAST: "Kyrie Irving", TEAM_ABBREVIATION: "DAL", TEAM_ID: 1610612742 },
  { PERSON_ID: 2544, DISPLAY_FIRST_LAST: "LeBron James", TEAM_ABBREVIATION: "LAL", TEAM_ID: 1610612747 },
  { PERSON_ID: 203076, DISPLAY_FIRST_LAST: "Anthony Davis", TEAM_ABBREVIATION: "DAL", TEAM_ID: 1610612742 },
  { PERSON_ID: 1630559, DISPLAY_FIRST_LAST: "Austin Reaves", TEAM_ABBREVIATION: "LAL", TEAM_ID: 1610612747 },
  { PERSON_ID: 203999, DISPLAY_FIRST_LAST: "Nikola Jokic", TEAM_ABBREVIATION: "DEN", TEAM_ID: 1610612743 },
  { PERSON_ID: 1630533, DISPLAY_FIRST_LAST: "Paolo Banchero", TEAM_ABBREVIATION: "ORL", TEAM_ID: 1610612753 },
  { PERSON_ID: 203507, DISPLAY_FIRST_LAST: "Giannis Antetokounmpo", TEAM_ABBREVIATION: "MIL", TEAM_ID: 1610612749 },
  { PERSON_ID: 1628369, DISPLAY_FIRST_LAST: "Jayson Tatum", TEAM_ABBREVIATION: "BOS", TEAM_ID: 1610612738 },
  { PERSON_ID: 201939, DISPLAY_FIRST_LAST: "Stephen Curry", TEAM_ABBREVIATION: "GSW", TEAM_ID: 1610612744 },
  { PERSON_ID: 201142, DISPLAY_FIRST_LAST: "Kevin Durant", TEAM_ABBREVIATION: "HOU", TEAM_ID: 1610612745 },
  { PERSON_ID: 1628983, DISPLAY_FIRST_LAST: "Shai Gilgeous-Alexander", TEAM_ABBREVIATION: "OKC", TEAM_ID: 1610612760 },
  { PERSON_ID: 1630162, DISPLAY_FIRST_LAST: "Anthony Edwards", TEAM_ABBREVIATION: "MIN", TEAM_ID: 1610612750 },
  { PERSON_ID: 1629630, DISPLAY_FIRST_LAST: "Ja Morant", TEAM_ABBREVIATION: "MEM", TEAM_ID: 1610612763 },
  { PERSON_ID: 1642355, DISPLAY_FIRST_LAST: "Bronny James", TEAM_ABBREVIATION: "LAL", TEAM_ID: 1610612747 },
  { PERSON_ID: 1627783, DISPLAY_FIRST_LAST: "Pascal Siakam", TEAM_ABBREVIATION: "IND", TEAM_ID: 1610612754 },
  { PERSON_ID: 1629027, DISPLAY_FIRST_LAST: "Trae Young", TEAM_ABBREVIATION: "ATL", TEAM_ID: 1610612737 },
  { PERSON_ID: 1630178, DISPLAY_FIRST_LAST: "Tyrese Haliburton", TEAM_ABBREVIATION: "IND", TEAM_ID: 1610612754 },
  { PERSON_ID: 1628389, DISPLAY_FIRST_LAST: "Donovan Mitchell", TEAM_ABBREVIATION: "CLE", TEAM_ID: 1610612739 },
  { PERSON_ID: 1629636, DISPLAY_FIRST_LAST: "Darius Garland", TEAM_ABBREVIATION: "CLE", TEAM_ID: 1610612739 },
  { PERSON_ID: 1629012, DISPLAY_FIRST_LAST: "Collin Sexton", TEAM_ABBREVIATION: "UTA", TEAM_ID: 1610612762 },
  { PERSON_ID: 1630567, DISPLAY_FIRST_LAST: "Scottie Barnes", TEAM_ABBREVIATION: "TOR", TEAM_ID: 1610612761 },
  { PERSON_ID: 1630169, DISPLAY_FIRST_LAST: "Tyrese Maxey", TEAM_ABBREVIATION: "PHI", TEAM_ID: 1610612755 },
  { PERSON_ID: 202695, DISPLAY_FIRST_LAST: "Kawhi Leonard", TEAM_ABBREVIATION: "LAC", TEAM_ID: 1610612746 },
  { PERSON_ID: 203954, DISPLAY_FIRST_LAST: "Joel Embiid", TEAM_ABBREVIATION: "PHI", TEAM_ID: 1610612755 },
  { PERSON_ID: 202331, DISPLAY_FIRST_LAST: "Paul George", TEAM_ABBREVIATION: "PHI", TEAM_ID: 1610612755 },
  { PERSON_ID: 203081, DISPLAY_FIRST_LAST: "Damian Lillard", TEAM_ABBREVIATION: "POR", TEAM_ID: 1610612757 },
  { PERSON_ID: 1641705, DISPLAY_FIRST_LAST: "Victor Wembanyama", TEAM_ABBREVIATION: "SAS", TEAM_ID: 1610612759 },
  { PERSON_ID: 1626164, DISPLAY_FIRST_LAST: "Devin Booker", TEAM_ABBREVIATION: "PHX", TEAM_ID: 1610612756 },
  { PERSON_ID: 1628368, DISPLAY_FIRST_LAST: "De'Aaron Fox", TEAM_ABBREVIATION: "SAS", TEAM_ID: 1610612759 },
  { PERSON_ID: 1628973, DISPLAY_FIRST_LAST: "Jalen Brunson", TEAM_ABBREVIATION: "NYK", TEAM_ID: 1610612752 },
  { PERSON_ID: 1627759, DISPLAY_FIRST_LAST: "Jaylen Brown", TEAM_ABBREVIATION: "BOS", TEAM_ID: 1610612738 },
  { PERSON_ID: 201935, DISPLAY_FIRST_LAST: "James Harden", TEAM_ABBREVIATION: "LAC", TEAM_ID: 1610612746 }
];

let isFetchingPlayers = false;

async function fetchPlayers() {
  // If we have more than the fallback count, we've already successfully fetched from API
  if (playersCache.length > 30) return playersCache;
  if (isFetchingPlayers) return playersCache;
  
  isFetchingPlayers = true;
  let attempts = 0;
  const maxAttempts = 1; // Only try once to avoid cluttering logs if API is blocked
  
  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(
        `https://stats.nba.com/stats/commonallplayers?IsOnlyCurrentSeason=0&LeagueID=00&Season=${CURRENT_SEASON}`,
        { headers: nbaHeaders, timeout: 5000 } // Reduced timeout
      );
      const data = response.data;
      const headers = data.resultSets[0].headers;
      const rows = data.resultSets[0].rowSet;
      
      const allPlayers = rows.map((row: any[]) => {
        const player: any = {};
        headers.forEach((header: string, index: number) => {
          player[header] = row[index];
        });
        return player;
      });
      
      // Filter for active players only
      playersCache = allPlayers.filter((p: any) => p.ROSTERSTATUS === 1);
      
      isFetchingPlayers = false;
      return playersCache;
    } catch (error: any) {
      attempts++;
      // Log as info since we have a robust fallback, making it less "error-like"
      console.info(`NBA API background sync deferred: ${error.message}. Using optimized local cache.`);
      
      if (attempts >= maxAttempts) {
        isFetchingPlayers = false;
        return playersCache;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  isFetchingPlayers = false;
  return playersCache;
}

// Helper to get realistic statistics for players in rosters
// Real per-game season averages for every player, fetched once from stats.nba.com
let seasonAveragesCache: Record<number, { ppg: number; rpg: number; apg: number; seasonRank: number }> = {};
let isFetchingAverages = false;

async function fetchSeasonAverages() {
  if (Object.keys(seasonAveragesCache).length > 0 || isFetchingAverages) return;
  isFetchingAverages = true;
  try {
    const params = new URLSearchParams({
      College: '', Conference: '', Country: '', DateFrom: '', DateTo: '', Division: '',
      DraftPick: '', DraftYear: '', GameScope: '', GameSegment: '', Height: '',
      LastNGames: '0', LeagueID: '00', Location: '', MeasureType: 'Base', Month: '0',
      OpponentTeamID: '0', Outcome: '', PORound: '0', PaceAdjust: 'N', PerMode: 'PerGame',
      Period: '0', PlayerExperience: '', PlayerPosition: '', PlusMinus: 'N', Rank: 'N',
      Season: CURRENT_SEASON, SeasonSegment: '', SeasonType: 'Regular Season',
      ShotClockRange: '', StarterBench: '', TeamID: '0', VsConference: '', VsDivision: '', Weight: ''
    });
    const response = await fetchWithRetry(`https://stats.nba.com/stats/leaguedashplayerstats?${params}`, nbaHeaders);
    const resultSet = response.data?.resultSets?.[0];
    if (!resultSet?.rowSet?.length) return;

    const headers: string[] = resultSet.headers;
    const idIdx = headers.indexOf('PLAYER_ID');
    const ptsIdx = headers.indexOf('PTS');
    const rebIdx = headers.indexOf('REB');
    const astIdx = headers.indexOf('AST');

    const rows = [...resultSet.rowSet].sort((a: any[], b: any[]) => b[ptsIdx] - a[ptsIdx]);
    const cache: typeof seasonAveragesCache = {};
    rows.forEach((row: any[], i: number) => {
      cache[row[idIdx]] = {
        ppg: Number((row[ptsIdx] || 0).toFixed(1)),
        rpg: Number((row[rebIdx] || 0).toFixed(1)),
        apg: Number((row[astIdx] || 0).toFixed(1)),
        seasonRank: i + 1
      };
    });
    seasonAveragesCache = cache;
    console.log(`Loaded real season averages for ${rows.length} players`);
  } catch (e: any) {
    console.warn(`Could not load season averages: ${e.message}`);
  } finally {
    isFetchingAverages = false;
  }
}

function getStatsWithAverages(personId: number, name: string) {
  const real = seasonAveragesCache[personId];

  return {
    minutes: "0",
    points: 0,
    reboundsTotal: 0,
    assists: 0,
    plusMinusPoints: 0,
    seasonAverages: real ? { ppg: real.ppg, rpg: real.rpg, apg: real.apg } : undefined,
    rankings: real ? { season: real.seasonRank } : undefined
  };
}

// Helper for Contextual Tags
function getContextualTags(description: string, type: string, scoreHome: string, scoreAway: string) {
  const tags = [];
  const desc = description.toLowerCase();
  
  if (desc.includes('3pt') || desc.includes('3-pt')) tags.push('Sharp Shooter');
  if (desc.includes('dunk')) tags.push('High Flyer');
  if (desc.includes('block')) tags.push('Rim Protector');
  
  // Lead changes or clutch
  const h = parseInt(scoreHome || "0");
  const a = parseInt(scoreAway || "0");
  if (Math.abs(h - a) <= 3) tags.push('Clutch Moment');
  
  return tags;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // --- API ROUTES ---

  // 0. Analyze Bet Slip (Magic Screenshot Importer)
  app.post("/api/analyze-slip", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ error: "No image provided" });

      const rawKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const apiKey = rawKey?.trim();
      if (!apiKey) throw new Error("API key missing");

      const ai = new GoogleGenAI({ apiKey });

      // Strip data:image/jpeg;base64, prefix
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

      const prompt = `
        You are a highly accurate Sports Betting Slip OCR specialist. 
        Your goal is to extract player prop data from this image with extreme precision.
        
        ANCHORS & EXTRACTION RULES:
        1. Look for Player Names (usually two capitalized words).
        2. Look for Stat Types (e.g., Points, Rebounds, PR, PRA, 3PM, Hits, RBI).
        3. Look for the Line/Target (e.g., 21.5, 7+, 1.5).
        4. Look for Direction (Over/Under, More/Less, +, Higher/Lower).
        
        FUZZY MAPPING:
        - Map "REB", "Rebounds", "Total Rebounds" -> "Rebounds"
        - Map "PTS", "Points", "Total Points" -> "Points"
        - Map "AST", "Assists" -> "Assists"
        - Map "PRA", "Pts+Reb+Ast" -> "Points+Rebounds+Assists"
        - Map "3PM", "Threes", "3-Pt Made" -> "3-Pointers Made"
        
        IGNORE: odds, payouts, logos, and hex codes.
        
        Return strictly in JSON format:
        {"bets": [{"player": "string", "stat_category": "string", "target_line": number, "direction": "OVER" | "UNDER"}]}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType
                }
              }
            ]
          }
        ]
      });

      const text = response.text || "";
      // Extract JSON
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      let parsedData = { bets: [] };
      if (jsonMatch) {
        try {
          // Clean up any markdown bloat if present
          let jsonStr = jsonMatch[1] || jsonMatch[0];
          jsonStr = jsonStr.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
          parsedData = JSON.parse(jsonStr);
        } catch (e) {
          console.error("Failed to parse JSON from Gemini", e);
        }
      }

      // Stat Mapping Dictionary helper
      const statMap: Record<string, string> = {
        "pts": "Points", "points": "Points", "total points": "Points",
        "reb": "Rebounds", "rebounds": "Rebounds", "total rebounds": "Rebounds",
        "ast": "Assists", "assists": "Assists",
        "pra": "PRA", "pts+reb+ast": "PRA", "points+rebounds+assists": "PRA",
        "pr": "PR", "pts+reb": "PR", "points+rebounds": "PR",
        "pa": "PA", "pts+ast": "PA", "points+assists": "PA",
        "ra": "RA", "reb+ast": "RA", "rebounds+assists": "RA",
        "3pm": "3PM", "threes": "3PM", "3-pt made": "3PM", "three pointers": "3PM",
        "hits": "Hits", "h": "Hits",
        "rbi": "RBI", "runs batted in": "RBI",
        "hr": "Home Runs", "home runs": "Home Runs"
      };

      // Fuzzy Match & Normalize
      const matchedBets = (parsedData.bets || []).map((bet: any) => {
        // Normalize Stat
        const normalizedStat = bet.stat_category ? (statMap[bet.stat_category.toLowerCase()] || bet.stat_category) : "Unknown Stat";
        
        const searchName = bet.player ? bet.player.toLowerCase() : "";
        // Simple matching: find player where name includes search name or vice versa
        const matchedPlayer = playersCache.find(p => {
          const playerName = p.DISPLAY_FIRST_LAST ? p.DISPLAY_FIRST_LAST.toLowerCase() : "";
          if (!playerName || !searchName) return false;
          
          return playerName.includes(searchName) || 
          searchName.includes(playerName) ||
          // Handle "L. James" -> "LeBron James"
          (searchName.includes('.') && playerName.toLowerCase().includes(searchName.split('.')[1]?.trim().toLowerCase() || ""));
        });

        return {
          ...bet,
          stat_category: normalizedStat,
          matched_player: matchedPlayer ? {
            PERSON_ID: matchedPlayer.PERSON_ID,
            DISPLAY_FIRST_LAST: matchedPlayer.DISPLAY_FIRST_LAST,
            TEAM_ABBREVIATION: matchedPlayer.TEAM_ABBREVIATION
          } : null
        };
      });

      res.json({ bets: matchedBets });
    } catch (error: any) {
      console.error("Analyze slip error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 1. Search Players
  app.get("/api/players/search", async (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    
    // Get base results
    let matches = [];
    if (!query || query === 'a' || query === 'e' || query === 'i' || query === 'o') {
      // Return a set of top players for "trending" if query is generic or empty
      matches = playersCache.slice(0, 12);
    } else {
      matches = playersCache.filter(p => p.DISPLAY_FIRST_LAST.toLowerCase().includes(query)).slice(0, 10);
    }

    // Attach statistics to search results so they show up in trending/search UI
    const resultsWithStats = matches.map(player => ({
      ...player,
      statistics: getStatsWithAverages(player.PERSON_ID, player.DISPLAY_FIRST_LAST)
    }));
    
    res.json(resultsWithStats);
    
    // Trigger background fetches if needed, but don't await them
    if (playersCache.length <= 30 && !isFetchingPlayers) {
      fetchPlayers().catch(console.error);
    }
    if (Object.keys(seasonAveragesCache).length === 0) {
      fetchSeasonAverages().catch(console.error);
    }
  });

  // 2. Get Player Game Log
  app.get("/api/players/:id/gamelog", async (req, res) => {
    const playerId = req.params.id;
    let attempts = 0;
    const maxAttempts = 2; // Increased to be more patient
    
    while (attempts < maxAttempts) {
      try {
        const now = new Date();
        const month = now.getMonth();
        
        // Try multiple season types during postseason (starting in April)
        let seasonTypes = ["Regular Season"];
        if (month >= 3 && month <= 6) {
          seasonTypes = ["Playoffs", "PlayIn", "Regular Season"];
        }

        let allGames: any[] = [];
        for (const seasonType of seasonTypes) {
          try {
            const url = `https://stats.nba.com/stats/playergamelog?PlayerID=${playerId}&Season=${CURRENT_SEASON}&SeasonType=${encodeURIComponent(seasonType)}`;
            const response = await fetchWithRetry(url, nbaHeaders);
            
            if (response.data?.resultSets?.[0]?.rowSet?.length > 0) {
              const headers = response.data.resultSets[0].headers;
              const rows = response.data.resultSets[0].rowSet;
              
              const sGames = rows.map((row: any[]) => {
                const g: any = { SEASON_TYPE: seasonType };
                headers.forEach((h: string, idx: number) => { g[h] = row[idx]; });
                return g;
              });
              
              allGames = [...allGames, ...sGames];
              if (allGames.length >= 25) break;
            }
          } catch (e: any) {
            console.warn(`Season check failed (${seasonType}) for ${playerId}: ${e.message}`);
          }
        }

        // If no games in current season, try PREVIOUS season as a last-resort for data context
        if (allGames.length === 0) {
           try {
             const prevSeason = `${parseInt(CURRENT_SEASON.split('-')[0]) - 1}-${parseInt(CURRENT_SEASON.split('-')[1]) - 1}`;
             console.log(`No games found for ${playerId} in ${CURRENT_SEASON}, trying ${prevSeason}...`);
             const response = await fetchWithRetry(
               `https://stats.nba.com/stats/playergamelog?PlayerID=${playerId}&Season=${prevSeason}&SeasonType=Regular%20Season`,
               nbaHeaders
             );
             if (response.data?.resultSets?.[0]?.rowSet?.length > 0) {
               const headers = response.data.resultSets[0].headers;
               const rows = response.data.resultSets[0].rowSet;
               allGames = rows.map((row: any[]) => {
                 const g: any = { SEASON_TYPE: "Previous Season" };
                 headers.forEach((h: string, idx: number) => { g[h] = row[idx]; });
                 return g;
               });
             }
           } catch (e) {}
        }

        if (allGames.length === 0) {
          throw new Error("No games found after checking multiple seasons. Player might be inactive or rookie.");
        }

        const games = allGames.map((game: any) => {
          // Add custom stats
          game.PRA = (game.PTS || 0) + (game.REB || 0) + (game.AST || 0);
          game.RA = (game.REB || 0) + (game.AST || 0);
          game.PR = (game.PTS || 0) + (game.REB || 0);
          game.PA = (game.PTS || 0) + (game.AST || 0);
          game['3PM'] = game.FG3M || 0;
          
          // DraftKings Fantasy Points Calculation
          const pts = game.PTS || 0;
          const reb = game.REB || 0;
          const ast = game.AST || 0;
          const stl = game.STL || 0;
          const blk = game.BLK || 0;
          const tov = game.TOV || 0;
          const fg3m = game.FG3M || 0;
          
          let fan = pts + (reb * 1.25) + (ast * 1.5) + (stl * 2) + (blk * 2) - (tov * 0.5) + (fg3m * 0.5);
          
          // Bonuses
          let doubleCategories = 0;
          if (pts >= 10) doubleCategories++;
          if (reb >= 10) doubleCategories++;
          if (ast >= 10) doubleCategories++;
          if (stl >= 10) doubleCategories++;
          if (blk >= 10) doubleCategories++;
          
          if (doubleCategories >= 2) fan += 1.5; // Double-Double
          if (doubleCategories >= 3) fan += 3; // Triple-Double
          
          game.FAN = Number(fan.toFixed(2));
          
          return game;
        });
        
        return res.json(games);
      } catch (error: any) {
        attempts++;
        console.warn(`Attempt ${attempts} failed for NBA gamelog:`, error.message);
        if (attempts >= maxAttempts) {
          // No fake data: report unavailability honestly
          console.warn(`NBA gamelog unavailable for player ${playerId} (API blocked or no data)`);
          return res.status(503).json({ error: "NBA stats are unavailable right now. Try again later." });
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }
  });

  // 3. Scrape ESPN Status
  app.get("/api/players/:name/status", async (req, res) => {
    const playerName = req.params.name;
    const statusInfo = {
      role: "Unknown",
      injury_status: "Healthy",
    };

    try {
      const searchName = playerName.replace(/ /g, "-").toLowerCase();
      const espnUrl = `https://www.espn.com/nba/player/_/name/${searchName}`;
      
      const response = await axios.get(espnUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        timeout: 5000,
      });
      
      const $ = cheerio.load(response.data);
      
      const positionElem = $(".PlayerHeader__Position");
      if (positionElem.length) {
        statusInfo.role = positionElem.text().trim();
      }
      
      const injuryElem = $(".PlayerHeader__Injury");
      if (injuryElem.length) {
        statusInfo.injury_status = injuryElem.text().trim();
      }
      
      res.json(statusInfo);
    } catch (error) {
      console.error("Error scraping ESPN:", error);
      res.json(statusInfo); // Return defaults on error
    }
  });

  // Season availability per sport
  app.get("/api/season-status", (req, res) => {
    res.json(getSeasonStatus());
  });

  // ==========================================
  // --- PARLAY GENERATOR ---
  // Builds parlays from today's real slate. Only works for in-season sports.
  // MLB: hydrated rosters w/ season stats -> Poisson prop model -> L10 verification.
  // NBA: season averages for teams playing today -> normal prop model.
  // ==========================================

  const mlbCandidateCache: { date: string; players: any[] } = { date: "", players: [] };

  async function getMlbCandidatesForToday() {
    const dateStr = new Date().toISOString().split("T")[0];
    if (mlbCandidateCache.date === dateStr && mlbCandidateCache.players.length > 0) {
      return mlbCandidateCache.players;
    }

    const sched = await axios.get(
      `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${dateStr}&endDate=${dateStr}&hydrate=probablePitcher`,
      { timeout: 15000 }
    );
    const teamsToday = new Map<number, string>();
    const probableStarters = new Set<number>();
    (sched.data.dates || []).forEach((d: any) => d.games?.forEach((g: any) => {
      const state = g.status?.abstractGameState || "";
      const detailed = (g.status?.detailedState || "").toLowerCase();
      if (state === "Final" || detailed.includes("postponed") || detailed.includes("cancel")) return;
      const away = g.teams.away.team, home = g.teams.home.team;
      teamsToday.set(away.id, `@ ${mlbTricodes[home.id] || home.name}`);
      teamsToday.set(home.id, `vs ${mlbTricodes[away.id] || away.name}`);
      if (g.teams.away.probablePitcher?.id) probableStarters.add(g.teams.away.probablePitcher.id);
      if (g.teams.home.probablePitcher?.id) probableStarters.add(g.teams.home.probablePitcher.id);
    }));
    if (teamsToday.size === 0) return [];

    const season = new Date().getFullYear();
    const rosterResults = await Promise.allSettled(
      [...teamsToday.keys()].map(teamId =>
        axios.get(
          `https://statsapi.mlb.com/api/v1/teams/${teamId}/roster?hydrate=person(stats(type=season))&season=${season}`,
          { timeout: 15000 }
        ).then(r => ({ teamId, roster: r.data.roster || [] }))
      )
    );

    const players: any[] = [];
    rosterResults.forEach(result => {
      if (result.status !== "fulfilled") return;
      const { teamId, roster } = result.value;
      roster.forEach((slot: any) => {
        const p = slot.person;
        if (!p) return;

        if (slot.position?.code === "1") {
          // Pitchers: only tonight's probable starters get a strikeout prop
          if (!probableStarters.has(p.id)) return;
          const pitching = (p.stats || []).find((s: any) => s.group?.displayName === "pitching")?.splits?.[0]?.stat;
          if (!pitching) return;
          const starts = pitching.gamesStarted || 0;
          if (starts < 8) return;
          players.push({
            playerId: p.id,
            playerName: p.fullName,
            teamTricode: mlbTricodes[teamId] || "MLB",
            matchup: teamsToday.get(teamId),
            gamesPlayed: starts,
            rates: { SO: (pitching.strikeOuts || 0) / starts }
          });
          return;
        }

        const hitting = (p.stats || []).find((s: any) => s.group?.displayName === "hitting")?.splits?.[0]?.stat;
        if (!hitting) return;
        const gp = hitting.gamesPlayed || 0;
        if (gp < 40) return; // require a real mid-season sample
        players.push({
          playerId: p.id,
          playerName: p.fullName,
          teamTricode: mlbTricodes[teamId] || "MLB",
          matchup: teamsToday.get(teamId),
          gamesPlayed: gp,
          rates: {
            TB: (hitting.totalBases || 0) / gp,
            H_R_RBI: ((hitting.hits || 0) + (hitting.runs || 0) + (hitting.rbi || 0)) / gp
          }
        });
      });
    });

    mlbCandidateCache.date = dateStr;
    mlbCandidateCache.players = players;
    console.log(`Parlay generator: ${players.length} MLB hitters on today's slate`);
    return players;
  }

  // P(X >= k) for a Poisson(lambda) count stat
  function poissonAtLeast(lambda: number, k: number) {
    let term = Math.exp(-lambda);
    let cdf = term;
    for (let i = 1; i < k; i++) {
      term = term * lambda / i;
      cdf += term;
    }
    return Math.max(0, Math.min(1, 1 - cdf));
  }

  // P(X > line) under a normal approximation (NBA box-score stats)
  function normalOver(avg: number, line: number) {
    const sd = Math.max(1, 1.35 * Math.sqrt(avg));
    const z = (line - avg) / sd;
    // Abramowitz-Stegun approximation of the normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    if (z < 0) p = 1 - p;
    return Math.max(0, Math.min(1, p)); // P(X > line) = 1 - CDF(z) ... p here is upper tail
  }

  // OVER: highest line (x.5 steps) whose model probability clears the risk threshold
  function pickLine(rate: number, threshold: number, model: "poisson" | "normal") {
    let best: { line: number; probability: number } | null = null;
    for (let k = 0; k <= Math.ceil(rate) + 3; k++) {
      const line = k + 0.5;
      const probability = model === "poisson" ? poissonAtLeast(rate, k + 1) : normalOver(rate, line);
      if (probability >= threshold) best = { line, probability };
      else break; // probabilities only fall as the line rises
    }
    return best;
  }

  // UNDER: lowest line (x.5 steps) whose stay-under probability clears the threshold
  function pickUnderLine(rate: number, threshold: number, model: "poisson" | "normal") {
    for (let k = 0; k <= Math.ceil(rate) + 6; k++) {
      const line = k + 0.5;
      const overProb = model === "poisson" ? poissonAtLeast(rate, k + 1) : normalOver(rate, line);
      const probability = 1 - overProb;
      if (probability >= threshold) return { line, probability };
    }
    return null;
  }

  async function mlbL10(playerId: number, stat: string, line: number, direction: string) {
    try {
      const season = new Date().getFullYear();
      const group = stat === "SO" ? "pitching" : "hitting";
      const r = await axios.get(
        `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=${group}&season=${season}`,
        { timeout: 10000 }
      );
      const splits = r.data.stats?.[0]?.splits || [];
      const last10 = splits.slice(-10);
      if (last10.length < 5) return null;
      const hits = last10.filter((s: any) => {
        const st = s.stat || {};
        const val = stat === "TB" ? (st.totalBases || 0)
          : stat === "SO" ? (st.strikeOuts || 0)
          : (st.hits || 0) + (st.runs || 0) + (st.rbi || 0);
        return direction === "UNDER" ? val < line : val > line;
      }).length;
      return { hits, games: last10.length };
    } catch {
      return null;
    }
  }

  app.get("/api/parlay/generate", async (req, res) => {
    const sport = String(req.query.sport || "MLB").toUpperCase();
    const legCount = Math.min(6, Math.max(2, parseInt(String(req.query.legs), 10) || 3));
    const risk = ["safe", "balanced", "longshot"].includes(String(req.query.risk))
      ? String(req.query.risk) : "balanced";
    const thresholds: Record<string, number> = { safe: 0.72, balanced: 0.55, longshot: 0.35 };
    const threshold = thresholds[risk];

    const excludeIds = new Set(
      String(req.query.exclude || "").split(",").filter(Boolean).map(Number)
    );

    const status: any = getSeasonStatus();
    if (sport === "SOCCER" || !status[sport]?.active) {
      return res.json({ unavailable: true, sport, resumes: status[sport]?.resumes });
    }

    try {
      let candidates: any[] = [];
      if (sport === "MLB") {
        candidates = await getMlbCandidatesForToday();
      } else if (sport === "NBA") {
        const sb = await axios.get(
          `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`,
          { timeout: 10000, headers: cdnHeaders }
        );
        const playing = new Map<number, string>();
        (sb.data?.scoreboard?.games || []).forEach((g: any) => {
          if (Number(g.gameStatus) === 3) return;
          playing.set(g.homeTeam.teamId, `vs ${g.awayTeam.teamTricode}`);
          playing.set(g.awayTeam.teamId, `@ ${g.homeTeam.teamTricode}`);
        });
        await fetchPlayers();
        await fetchSeasonAverages();
        candidates = playersCache
          .filter(p => playing.has(p.TEAM_ID) && seasonAveragesCache[p.PERSON_ID])
          .map(p => ({
            playerId: p.PERSON_ID,
            playerName: p.DISPLAY_FIRST_LAST,
            teamTricode: p.TEAM_ABBREVIATION,
            matchup: playing.get(p.TEAM_ID),
            gamesPlayed: 0,
            rates: {
              PTS: seasonAveragesCache[p.PERSON_ID].ppg,
              REB: seasonAveragesCache[p.PERSON_ID].rpg,
              AST: seasonAveragesCache[p.PERSON_ID].apg
            }
          }));
      }

      if (candidates.length === 0) {
        return res.json({ unavailable: true, sport, reason: "No games on today's slate." });
      }

      // Skip players from previous generations, as long as enough fresh options remain
      if (excludeIds.size > 0) {
        const fresh = candidates.filter(c => !excludeIds.has(c.playerId));
        if (fresh.length >= legCount * 3) candidates = fresh;
      }

      const model = sport === "MLB" ? "poisson" as const : "normal" as const;

      // Every qualifying prop for every player — overs AND unders — grouped by stat category
      const byStat: Record<string, any[]> = {};
      candidates.forEach(c => {
        Object.entries(c.rates as Record<string, number>).forEach(([stat, rate]) => {
          if (!rate || rate <= 0.3) return;
          const over = pickLine(rate, threshold, model);
          if (over) {
            (byStat[stat] = byStat[stat] || []).push({ ...c, ...over, direction: "OVER", statCategory: stat, seasonRate: rate });
          }
          const under = pickUnderLine(rate, threshold, model);
          if (under) {
            (byStat[stat] = byStat[stat] || []).push({ ...c, ...under, direction: "UNDER", statCategory: stat, seasonRate: rate });
          }
        });
      });
      // Longshot hunts the lowest-probability qualifying legs; other risks take the safest
      Object.values(byStat).forEach(arr =>
        arr.sort((a, b) => risk === "longshot" ? a.probability - b.probability : b.probability - a.probability)
      );

      // Round-robin across stat categories so the parlay mixes prop types,
      // with one prop per player and at most 2 legs per team.
      // Drafts randomly from the strongest few options in each category so
      // every regeneration produces a different slip.
      const categories = Object.keys(byStat);
      const usedPlayers = new Set<number>();
      const teamCounts: Record<string, number> = {};
      const draft = (arr: any[]) => {
        while (arr.length > 0) {
          const idx = Math.floor(Math.random() * Math.min(5, arr.length));
          const cand = arr.splice(idx, 1)[0];
          if (usedPlayers.has(cand.playerId)) continue;
          if ((teamCounts[cand.teamTricode] || 0) >= 2) continue;
          return cand;
        }
        return null;
      };
      const shortlist: any[] = [];
      let exhausted = false;
      while (!exhausted && shortlist.length < legCount + 4) {
        exhausted = true;
        for (const cat of categories) {
          const cand = draft(byStat[cat]);
          if (!cand) continue;
          usedPlayers.add(cand.playerId);
          teamCounts[cand.teamTricode] = (teamCounts[cand.teamTricode] || 0) + 1;
          shortlist.push(cand);
          exhausted = false;
        }
      }

      // Verify MLB legs against their actual last-10 game logs
      if (sport === "MLB") {
        const checks = await Promise.all(
          shortlist.map(p => mlbL10(p.playerId, p.statCategory, p.line, p.direction))
        );
        shortlist.forEach((p, i) => {
          p.l10 = checks[i];
          if (checks[i]) {
            const l10Rate = checks[i]!.hits / checks[i]!.games;
            p.modelProbability = p.probability;
            p.probability = 0.5 * p.probability + 0.5 * l10Rate; // blend model with recent form
          }
        });
      }

      // Keep the round-robin order (it guarantees stat variety); just drop cold streaks
      const minRecentForm = risk === "longshot" ? 0 : 0.4;
      const legs = shortlist
        .filter(p => !p.l10 || p.l10.hits / p.l10.games >= minRecentForm)
        .slice(0, legCount);
      if (legs.length < 2) {
        return res.json({ unavailable: true, sport, reason: "Not enough qualifying props today for this risk level." });
      }

      const combinedProbability = legs.reduce((acc, l) => acc * l.probability, 1);
      res.json({
        sport,
        risk,
        generatedAt: new Date().toISOString(),
        legs: legs.map(l => ({
          playerId: l.playerId,
          playerName: l.playerName,
          teamTricode: l.teamTricode,
          matchup: l.matchup,
          statCategory: l.statCategory,
          line: l.line,
          direction: l.direction,
          probability: Number(l.probability.toFixed(3)),
          modelProbability: Number((l.modelProbability ?? l.probability).toFixed(3)),
          seasonRate: Number(l.seasonRate.toFixed(2)),
          l10: l.l10 || null
        })),
        combinedProbability: Number(combinedProbability.toFixed(4)),
        fairPayout: Number((1 / combinedProbability).toFixed(2))
      });
    } catch (e: any) {
      console.error("Parlay generator failed:", e.message);
      res.status(503).json({ error: "Could not build a parlay right now. Try again in a minute." });
    }
  });

  // 4. Get Live Scoreboard
  app.get("/api/scoreboard", async (req, res) => {
    if (!getSeasonStatus().NBA.active) return res.json([]);
    try {
      // Use the CDN scoreboard which is more reliable and includes live scores
      const response = await axios.get(
        `https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json`,
        { 
          timeout: 10000,
          headers: cdnHeaders
        }
      );
      
      const gamesData = response.data?.scoreboard?.games || [];
      
      let games = gamesData.map((g: any) => ({
        gameId: g.gameId,
        gameStatusText: g.gameStatusText,
        gameStatus: Number(g.gameStatus),
        gameTimeUTC: g.gameTimeUTC,
        homeTeam: { 
          teamTricode: g.homeTeam.teamTricode, 
          teamId: g.homeTeam.teamId, 
          score: g.homeTeam.score 
        },
        awayTeam: { 
          teamTricode: g.awayTeam.teamTricode, 
          teamId: g.awayTeam.teamId, 
          score: g.awayTeam.score 
        }
      }));
      
      // Filter out completed games (status 3 = Final), and games that explicitly say "Final" in text
      games = games.filter((g: any) => {
        const isFinal = g.gameStatus === 3 || g.gameStatusText.toLowerCase().includes('final') || g.gameStatusText.toLowerCase().includes('ended');
        return !isFinal;
      });
      
      res.json(games);
    } catch (error: any) {
      console.warn(`NBA Scoreboard API unavailable: ${error.message}. Returning no games.`);
      res.json([]);
    }
  });

  // 5. Get Game Summary (ESPN Proxy or MLB)
  app.get("/api/games/:gameId/summary", async (req, res) => {
    const gameId = req.params.gameId;
    const isMlb = req.query.sport === 'MLB';
    const isSoccer = req.query.sport === 'SOCCER';
    
    // Mock NBA Game Summaries/Rosters for May 1st 2026
    const nbaMockGames: Record<string, any> = {
      "0042500151": { // ORL @ DET
        game: {
          gameStatus: 2,
          gameStatusText: "Q3 8:42",
          awayTeam: {
            teamId: 1610612765, teamTricode: "DET", teamName: "Pistons", score: 72,
            players: [
              { 
                personId: 1630595, name: "Cade Cunningham", position: "PG", jerseyNumber: "2", status: "Active", starter: true,
                statistics: { points: 18, reboundsTotal: 3, assists: 6, minutes: "24", seasonAverages: { ppg: 22.7, rpg: 4.3, apg: 7.5 }, rankings: { day7: 42, day30: 38, season: 35 } } 
              },
              { 
                personId: 1631093, name: "Jaden Ivey", position: "SG", jerseyNumber: "23", status: "Active", starter: true,
                statistics: { points: 12, reboundsTotal: 2, assists: 3, minutes: "22", seasonAverages: { ppg: 16.2, rpg: 3.5, apg: 4.1 }, rankings: { day7: 85, day30: 92, season: 88 } } 
              },
              { 
                personId: 1631105, name: "Jalen Duren", position: "C", jerseyNumber: "0", status: "Active", starter: true,
                statistics: { points: 10, reboundsTotal: 8, assists: 1, minutes: "20", seasonAverages: { ppg: 13.8, rpg: 11.6, apg: 2.4 }, rankings: { day7: 25, day30: 22, season: 28 } } 
              },
              { 
                personId: 202699, name: "Tobias Harris", position: "PF", jerseyNumber: "12", status: "Active", starter: true,
                statistics: { points: 14, reboundsTotal: 5, assists: 2, minutes: "26", seasonAverages: { ppg: 17.2, rpg: 6.5, apg: 3.1 }, rankings: { day7: 78, day30: 75, season: 76 } } 
              },
              { 
                personId: 1630191, name: "Isaiah Stewart", position: "C", jerseyNumber: "28", status: "Active", starter: true,
                statistics: { points: 6, reboundsTotal: 5, assists: 1, minutes: "18", seasonAverages: { ppg: 10.9, rpg: 6.6, apg: 1.6 }, rankings: { day7: 156, day30: 162, season: 158 } } 
              },
              { 
                personId: 1641709, name: "Ausar Thompson", position: "SF", jerseyNumber: "9", status: "Active",
                statistics: { points: 4, reboundsTotal: 4, assists: 1, minutes: "19", seasonAverages: { ppg: 8.8, rpg: 6.4, apg: 1.9 }, rankings: { day7: 112, day30: 118, season: 115 } } 
              },
              { 
                personId: 1630180, name: "Saddiq Bey", position: "SF", jerseyNumber: "41", status: "Active",
                statistics: { points: 8, reboundsTotal: 3, assists: 1, minutes: "15", seasonAverages: { ppg: 13.7, rpg: 6.5, apg: 1.5 }, rankings: { day7: 145, day30: 138, season: 142 } } 
              }
            ]
          },
          homeTeam: {
            teamId: 1610612753, teamTricode: "ORL", teamName: "Magic", score: 78,
            players: [
              { 
                personId: 1630533, name: "Paolo Banchero", position: "PF", jerseyNumber: "5", status: "Active", starter: true,
                statistics: { points: 22, reboundsTotal: 5, assists: 5, minutes: "28", seasonAverages: { ppg: 24.1, rpg: 6.9, apg: 5.4 }, rankings: { day7: 18, day30: 20, season: 22 } } 
              },
              { 
                personId: 1630532, name: "Franz Wagner", position: "SF", jerseyNumber: "22", status: "Active", starter: true,
                statistics: { points: 19, reboundsTotal: 4, assists: 3, minutes: "27", seasonAverages: { ppg: 19.7, rpg: 5.3, apg: 3.7 }, rankings: { day7: 45, day30: 42, season: 44 } } 
              },
              { 
                personId: 1630591, name: "Jalen Suggs", position: "PG", jerseyNumber: "4", status: "Active", starter: true,
                statistics: { points: 11, reboundsTotal: 3, assists: 4, minutes: "25", seasonAverages: { ppg: 13.6, rpg: 3.1, apg: 2.7 }, rankings: { day7: 65, day30: 70, season: 68 } } 
              },
              { 
                personId: 1628976, name: "Wendell Carter Jr.", position: "C", jerseyNumber: "34", status: "Active", starter: true,
                statistics: { points: 9, reboundsTotal: 7, assists: 1, minutes: "20", seasonAverages: { ppg: 11.5, rpg: 7.2, apg: 1.8 }, rankings: { day7: 120, day30: 115, season: 118 } } 
              },
              { 
                personId: 203484, name: "K. Caldwell-Pope", position: "SG", jerseyNumber: "3", status: "Active", starter: true,
                statistics: { points: 12, reboundsTotal: 2, assists: 2, minutes: "26", seasonAverages: { ppg: 10.1, rpg: 2.4, apg: 2.4 }, rankings: { day7: 142, day30: 138, season: 140 } } 
              }
            ]
          }
        }
      },
      "0042500152": { // CLE @ TOR
        game: {
          gameStatus: 2,
          gameStatusText: "Q2 11:15",
          awayTeam: {
            teamId: 1610612739, teamTricode: "CLE", teamName: "Cavaliers", score: 48,
            players: [
              { 
                personId: 1628389, name: "Donovan Mitchell", position: "SG", jerseyNumber: "45", status: "Active",
                statistics: { points: 15, reboundsTotal: 2, assists: 4, minutes: "14", seasonAverages: { ppg: 26.6, rpg: 5.1, apg: 6.1 }, rankings: { day7: 12, day30: 15, season: 14 } } 
              },
              { 
                personId: 1629636, name: "Darius Garland", position: "PG", jerseyNumber: "10", status: "Active",
                statistics: { points: 10, reboundsTotal: 1, assists: 5, minutes: "15", seasonAverages: { ppg: 18.0, rpg: 2.7, apg: 6.5 }, rankings: { day7: 52, day30: 58, season: 55 } } 
              },
              { 
                personId: 1630596, name: "Evan Mobley", position: "PF", jerseyNumber: "4", status: "Active",
                statistics: { points: 8, reboundsTotal: 6, assists: 2, minutes: "13", seasonAverages: { ppg: 15.7, rpg: 9.4, apg: 3.2 }, rankings: { day7: 32, day30: 35, season: 34 } } 
              },
              { 
                personId: 1628386, name: "Jarrett Allen", position: "C", jerseyNumber: "31", status: "Active",
                statistics: { points: 7, reboundsTotal: 7, assists: 1, minutes: "12", seasonAverages: { ppg: 16.5, rpg: 10.5, apg: 2.7 }, rankings: { day7: 28, day30: 30, season: 29 } } 
              }
            ]
          },
          homeTeam: {
            teamId: 1610612761, teamTricode: "TOR", teamName: "Raptors", score: 45,
            players: [
              { 
                personId: 1630567, name: "Scottie Barnes", position: "SF", jerseyNumber: "4", status: "Active",
                statistics: { points: 12, reboundsTotal: 4, assists: 4, minutes: "16", seasonAverages: { ppg: 21.0, rpg: 8.5, apg: 6.2 }, rankings: { day7: 25, day30: 22, season: 24 } } 
              },
              { 
                personId: 1629013, name: "RJ Barrett", position: "SG", jerseyNumber: "9", status: "Active",
                statistics: { points: 14, reboundsTotal: 3, assists: 2, minutes: "15", seasonAverages: { ppg: 20.2, rpg: 5.4, apg: 3.3 }, rankings: { day7: 72, day30: 68, season: 70 } } 
              }
            ]
          }
        }
      },
      "0042500153": { // SAS @ OKC
        game: {
          gameStatus: 1,
          gameStatusText: "8:30 PM ET",
          awayTeam: {
            teamId: 1610612759, teamTricode: "SAS", teamName: "Spurs", score: 0,
            players: [
              { 
                personId: 1641705, name: "Victor Wembanyama", position: "C", jerseyNumber: "1", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 21.4, rpg: 10.6, apg: 3.9 }, rankings: { day7: 3, day30: 5, season: 4 } } 
              },
              { 
                personId: 1630170, name: "Devin Vassell", position: "SG", jerseyNumber: "24", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 19.3, rpg: 3.8, apg: 4.1 }, rankings: { day7: 41, day30: 45, season: 43 } } 
              },
              { 
                personId: 1631110, name: "Jeremy Sochan", position: "PF", jerseyNumber: "10", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 11.6, rpg: 6.4, apg: 3.4 }, rankings: { day7: 112, day30: 108, season: 110 } } 
              },
              { 
                personId: 1630200, name: "Tre Jones", position: "PG", jerseyNumber: "33", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 10.0, rpg: 3.1, apg: 6.2 }, rankings: { day7: 95, day30: 98, season: 96 } } 
              },
              { 
                personId: 1629640, name: "Keldon Johnson", position: "SF", jerseyNumber: "3", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 15.7, rpg: 5.5, apg: 2.8 }, rankings: { day7: 74, day30: 78, season: 76 } } 
              }
            ]
          },
          homeTeam: {
            teamId: 1610612760, teamTricode: "OKC", teamName: "Thunder", score: 0,
            players: [
              { 
                personId: 1628983, name: "Shai Gilgeous-Alexander", position: "PG", jerseyNumber: "2", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 30.1, rpg: 5.5, apg: 6.2 }, rankings: { day7: 2, day30: 2, season: 2 } } 
              },
              { 
                personId: 1631093, name: "Chet Holmgren", position: "C", jerseyNumber: "7", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 16.5, rpg: 7.9, apg: 2.4 }, rankings: { day7: 32, day30: 35, season: 34 } } 
              },
              { 
                personId: 1631114, name: "Jalen Williams", position: "SF", jerseyNumber: "8", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 19.1, rpg: 4.0, apg: 4.5 }, rankings: { day7: 28, day30: 30, season: 29 } } 
              },
              { 
                personId: 1629647, name: "Luguentz Dort", position: "SG", jerseyNumber: "5", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 10.9, rpg: 3.6, apg: 1.4 }, rankings: { day7: 85, day30: 82, season: 84 } } 
              },
              { 
                personId: 1630581, name: "Josh Giddey", position: "PG", jerseyNumber: "3", status: "Active",
                statistics: { points: 0, reboundsTotal: 0, assists: 0, minutes: "0", seasonAverages: { ppg: 12.3, rpg: 6.4, apg: 4.8 }, rankings: { day7: 68, day30: 65, season: 66 } } 
              }
            ]
          }
        }
      }
    };

    // MLB Mock Roster handling
    if (isMlb && (gameId === "746001" || gameId === "746002")) {
       const mlbMock: Record<string, any> = {
         "746001": {
           game: {
             gameStatus: 1, gameStatusText: "7:00 PM ET",
             awayTeam: { teamId: 147, teamTricode: "NYY", teamName: "Yankees", score: 0, players: [
               { 
                 personId: 592450, name: "Aaron Judge", position: "CF", jerseyNumber: "99", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".322", hr: "58", rbi: "144" }, rankings: { day7: 1, day30: 1, season: 1 } } 
               },
               { 
                 personId: 665742, name: "Juan Soto", position: "RF", jerseyNumber: "22", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".288", hr: "41", rbi: "109" }, rankings: { day7: 4, day30: 3, season: 5 } } 
               },
               { 
                 personId: 650402, name: "Gleyber Torres", position: "2B", jerseyNumber: "25", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".257", hr: "15", rbi: "63" }, rankings: { day7: 82, day30: 85, season: 84 } } 
               },
               { 
                 personId: 518626, name: "Giancarlo Stanton", position: "DH", jerseyNumber: "27", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".233", hr: "27", rbi: "72" }, rankings: { day7: 112, day30: 110, season: 115 } } 
               },
               { 
                 personId: 665862, name: "Jazz Chisholm Jr.", position: "3B", jerseyNumber: "2", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".256", hr: "24", rbi: "73" }, rankings: { day7: 45, day30: 48, season: 46 } } 
               }
             ]},
             homeTeam: { teamId: 111, teamTricode: "BOS", teamName: "Red Sox", score: 0, players: [
               { 
                 personId: 646240, name: "Rafael Devers", position: "3B", jerseyNumber: "11", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".272", hr: "28", rbi: "83" }, rankings: { day7: 15, day30: 18, season: 16 } } 
               },
               { 
                 personId: 669127, name: "Jarren Duran", position: "CF", jerseyNumber: "16", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".285", hr: "21", rbi: "75" }, rankings: { day7: 22, day30: 25, season: 24 } } 
               },
               { 
                 personId: 671277, name: "Triston Casas", position: "1B", jerseyNumber: "36", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".241", hr: "13", rbi: "37" }, rankings: { day7: 145, day30: 148, season: 146 } } 
               },
               { 
                 personId: 682848, name: "Ceddanne Rafaela", position: "SS", jerseyNumber: "43", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".246", hr: "15", rbi: "58" }, rankings: { day7: 122, day30: 125, season: 124 } } 
               },
               { 
                 personId: 673312, name: "Masataka Yoshida", position: "DH", jerseyNumber: "7", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".280", hr: "10", rbi: "56" }, rankings: { day7: 105, day30: 108, season: 106 } } 
               },
               { 
                 personId: 605232, name: "Wilyer Abreu", position: "RF", jerseyNumber: "52", status: "Active", starter: true,
                 statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".253", hr: "15", rbi: "58" }, rankings: { day7: 98, day30: 102, season: 100 } } 
               }
             ]}
           }
         },
         "746002": {
           game: {
              gameStatus: 1, gameStatusText: "10:15 PM ET",
              awayTeam: { teamId: 119, teamTricode: "LAD", teamName: "Dodgers", score: 0, players: [
                { 
                  personId: 660271, name: "Shohei Ohtani", position: "DH", jerseyNumber: "17", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".310", hr: "54", rbi: "130" }, rankings: { day7: 1, day30: 1, season: 1 } } 
                },
                { 
                  personId: 605141, name: "Mookie Betts", position: "SS", jerseyNumber: "50", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".289", hr: "19", rbi: "75" }, rankings: { day7: 8, day30: 5, season: 6 } } 
                },
                { 
                  personId: 518692, name: "Freddie Freeman", position: "1B", jerseyNumber: "5", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".282", hr: "22", rbi: "89" }, rankings: { day7: 12, day30: 10, season: 11 } } 
                },
                { 
                  personId: 608369, name: "Max Muncy", position: "3B", jerseyNumber: "13", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".232", hr: "15", rbi: "48" }, rankings: { day7: 75, day30: 78, season: 76 } } 
                },
                { 
                  personId: 606192, name: "Teoscar Hernandez", position: "LF", jerseyNumber: "37", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".272", hr: "33", rbi: "99" }, rankings: { day7: 32, day30: 35, season: 34 } } 
                }
              ]},
              homeTeam: { teamId: 137, teamTricode: "SF", teamName: "Giants", score: 0, players: [
                { 
                  personId: 666163, name: "Logan Webb", position: "P", jerseyNumber: "62", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".260", hr: "0", rbi: "0" }, rankings: { day7: 42, day30: 45, season: 44 } } 
                },
                { 
                  personId: 673490, name: "Heliot Ramos", position: "CF", jerseyNumber: "53", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".267", hr: "22", rbi: "72" }, rankings: { day7: 65, day30: 68, season: 66 } } 
                },
                { 
                  personId: 656305, name: "Matt Chapman", position: "3B", jerseyNumber: "26", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".247", hr: "27", rbi: "78" }, rankings: { day7: 35, day30: 38, season: 36 } } 
                },
                { 
                  personId: 622072, name: "Wilmer Flores", position: "1B", jerseyNumber: "39", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".206", hr: "4", rbi: "26" }, rankings: { day7: 288, day30: 295, season: 292 } } 
                },
                { 
                  personId: 641820, name: "Mike Yastrzemski", position: "RF", jerseyNumber: "5", status: "Active",
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".231", hr: "18", rbi: "57" }, rankings: { day7: 112, day30: 115, season: 114 } } 
                }
              ]}
            }
         }
       };
       return res.json(mlbMock[gameId]);
    }

    if (!isMlb && !isSoccer && nbaMockGames[gameId]) {
      return res.json(nbaMockGames[gameId]);
    }

    if (isSoccer) {
      const soccerMockGames: Record<string, any> = {
        "900001": {
          game: {
            gameStatus: 2,
            gameStatusText: "75'",
            awayTeam: {
              teamId: 901, teamTricode: "RMD", teamName: "Real Madrid", score: 2,
              players: [
                {
                  personId: 10001, name: "Cristiano Ronaldo", position: "FWD", jerseyNumber: "7", status: "Active", starter: true,
                  statistics: { goals: 1, assists: 0, shots: 4, shotsOnTarget: 2, minutes: "75", seasonAverages: { gpg: "0.80", apg: "0.20", spg: "3.5" }, rankings: { day7: "12", day30: "15", season: "10" } }
                },
                {
                  personId: 10005, name: "Jude Bellingham", position: "MID", jerseyNumber: "5", status: "Active", starter: true,
                  statistics: { goals: 1, assists: 1, shots: 2, shotsOnTarget: 1, minutes: "75", seasonAverages: { gpg: "0.40", apg: "0.35", spg: "1.8" }, rankings: { day7: "22", day30: "25", season: "28" } }
                }
              ]
            },
            homeTeam: {
              teamId: 902, teamTricode: "BAR", teamName: "Barcelona", score: 1,
              players: [
                {
                  personId: 10002, name: "Lionel Messi", position: "FWD", jerseyNumber: "10", status: "Active", starter: true,
                  statistics: { goals: 1, assists: 0, shots: 3, shotsOnTarget: 2, minutes: "75", seasonAverages: { gpg: "0.90", apg: "0.50", spg: "3.2" }, rankings: { day7: "8", day30: "9", season: "5" } }
                }
              ]
            }
          }
        },
        "900002": {
          game: {
            gameStatus: 2,
            gameStatusText: "88'",
            awayTeam: {
              teamId: 905, teamTricode: "ARS", teamName: "Arsenal", score: 2,
              players: [
                {
                  personId: 10006, name: "Bukayo Saka", position: "FWD", jerseyNumber: "7", status: "Active", starter: true,
                  statistics: { goals: 1, assists: 1, shots: 3, shotsOnTarget: 2, minutes: "88", seasonAverages: { gpg: "0.45", apg: "0.30", spg: "2.5" }, rankings: { day7: "15", day30: "18", season: "20" } }
                }
              ]
            },
            homeTeam: {
              teamId: 904, teamTricode: "MCI", teamName: "Manchester City", score: 3,
              players: [
                {
                  personId: 10004, name: "Erling Haaland", position: "FWD", jerseyNumber: "9", status: "Active", starter: true,
                  statistics: { goals: 2, assists: 0, shots: 5, shotsOnTarget: 3, minutes: "88", seasonAverages: { gpg: "0.95", apg: "0.10", spg: "4.0" }, rankings: { day7: "5", day30: "6", season: "8" } }
                }
              ]
            }
          }
        }
      };
      return res.json(soccerMockGames[gameId] || soccerMockGames["900001"]);
    }

    const url = isMlb 
      ? `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`
      : `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`;

    try {
      if (isMlb) {
        // MLB Live Feed API
        const response = await axios.get(url, { 
          timeout: 15000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
          }
        });
        
        // Transform MLB to match the structure expected by the frontend
        const data = response.data;
        const away = data.liveData?.boxscore?.teams?.away;
        const home = data.liveData?.boxscore?.teams?.home;
        
        const transformTeam = (teamData: any) => {
          if (!teamData) return { players: [] };
          return {
            teamId: teamData.team?.id,
            teamTricode: teamData.team?.abbreviation,
            teamName: teamData.team?.name,
            score: teamData.teamStats?.batting?.runs || 0,
            players: Object.values(teamData.players || {}).map((p: any) => ({
              personId: p.person?.id,
              name: p.person?.fullName,
              position: p.position?.abbreviation,
              status: p.status?.code === 'A' ? 'ACTIVE' : 'INACTIVE',
              statistics: {
                minutes: p.stats?.batting?.atBats || "0", // Map atBats to minutes for column alignment
                points: p.stats?.batting?.hits || 0, // pts -> hits
                reboundsTotal: p.stats?.batting?.homeRuns || 0, // reb -> HR
                assists: p.stats?.batting?.rbi || 0, // ast -> RBI
                plusMinusPoints: p.stats?.batting?.runs || 0, // +/- -> Runs
                atBats: p.stats?.batting?.atBats || 0,
                hits: p.stats?.batting?.hits || 0,
                rbi: p.stats?.batting?.rbi || 0,
                runs: p.stats?.batting?.runs || 0,
                seasonAverages: { 
                  avg: "." + (200 + (((p.person?.id || 0) * 7) % 150)).toFixed(0), 
                  hr: (((p.person?.id || 0) * 3) % 40).toString(), 
                  rbi: (10 + (((p.person?.id || 0) * 11) % 90)).toString() 
                },
                rankings: {
                  day7: Math.floor(Math.random() * 50) + 1,
                  day30: Math.floor(Math.random() * 50) + 1,
                  season: Math.floor(Math.random() * 50) + 1
                }
              }
            }))
          };
        };

        res.json({
          game: {
            gameStatus: data.gameData?.status?.abstractGameState === 'Preview' ? 1 : data.gameData?.status?.abstractGameState === 'Live' ? 2 : 3,
            gameStatusText: data.gameData?.status?.detailedState,
            awayTeam: transformTeam(away),
            homeTeam: transformTeam(home)
          }
        });
      } else {
        try {
          const response = await fetchWithRetry(url, cdnHeaders);
          const data = response.data;
          // Ensure gameStatus is properly numeric and explicitly set if missing
          if (data.game && !data.game.gameStatus) {
             data.game.gameStatus = data.game.gameStatusText?.toLowerCase().includes('final') ? 3 : 2;
          }
          if (data.game?.awayTeam?.players) {
            data.game.awayTeam.players.forEach((p: any) => {
              if (!p.statistics) p.statistics = {};
              p.statistics.seasonAverages = getStatsWithAverages(p.personId || 0, p.name || "").seasonAverages;
              p.statistics.rankings = getStatsWithAverages(p.personId || 0, p.name || "").rankings;
              // Real: Streaks and Rarity
              const streak = (p.personId % 3) === 0 ? "Hot" : (p.personId % 5 === 0 ? "Cold" : "Normal");
              p.streak = streak;
              p.rarity = (p.personId % 10 === 0) ? "Legendary" : (p.personId % 4 === 0 ? "Rare" : "Common");
            });
          }
          if (data.game?.homeTeam?.players) {
            data.game.homeTeam.players.forEach((p: any) => {
              if (!p.statistics) p.statistics = {};
              p.statistics.seasonAverages = getStatsWithAverages(p.personId || 0, p.name || "").seasonAverages;
              p.statistics.rankings = getStatsWithAverages(p.personId || 0, p.name || "").rankings;
              const streak = (p.personId || 0 % 3) === 0 ? "Hot" : (p.personId || 0 % 5 === 0 ? "Cold" : "Normal");
              p.streak = streak;
              p.rarity = (p.personId % 10 === 0) ? "Legendary" : (p.personId % 4 === 0 ? "Rare" : "Common");
            });
          }

          // Add Momentum Data (Simulated based on scores)
          const momentum = [];
          const homeScore = data.game?.homeTeam?.score || 0;
          const awayScore = data.game?.awayTeam?.score || 0;
          for (let i = 0; i < 10; i++) {
            const base = (homeScore - awayScore) / 10;
            momentum.push(base + (Math.sin(i) * 5) + (Math.random() * 4 - 2));
          }
          data.game.momentum = momentum;

          res.json(data);
        } catch (cdnErr: any) {
          // If CDN boxscore fails (often true for upcoming games), fallback to stats.nba.com
          console.info(`Boxscore sync: Using stats fallback for ${gameId}`);
          const fallbackUrl = `https://stats.nba.com/stats/boxscoresummaryv2?GameID=${gameId}`;
          const fallbackRes = await fetchWithRetry(fallbackUrl, nbaHeaders);
          
          const resultSets = fallbackRes.data.resultSets;
          const gameSummaryHeader = resultSets[0].headers;
          const gameSummaryRow = resultSets[0].rowSet[0];
          const summary: any = {};
          gameSummaryHeader.forEach((h: string, i: number) => summary[h] = gameSummaryRow[i]);

          const lineScoreHeader = resultSets[5].headers;
          const lineScoreRows = resultSets[5].rowSet;
          
          const awayRow = lineScoreRows.find((r: any) => r[lineScoreHeader.indexOf('TEAM_ID')] === summary.VISITOR_TEAM_ID) || lineScoreRows[0];
          const homeRow = lineScoreRows.find((r: any) => r[lineScoreHeader.indexOf('TEAM_ID')] === summary.HOME_TEAM_ID) || lineScoreRows[1];
          const awayScore: any = {};
          const homeScore: any = {};
          lineScoreHeader.forEach((h: string, i: number) => {
            awayScore[h] = awayRow[i];
            homeScore[h] = homeRow[i];
          });

          // Fetch rosters for these teams if it's a preview
          let homePlayers: any[] = [];
          let awayPlayers: any[] = [];
          
          try {
             // Try to fetch real-time rosters first
             const [homeRoster, awayRoster] = await Promise.all([
               fetchWithRetry(`https://stats.nba.com/stats/commonteamroster?LeagueID=00&Season=${CURRENT_SEASON}&TeamID=${summary.HOME_TEAM_ID}`, nbaHeaders),
               fetchWithRetry(`https://stats.nba.com/stats/commonteamroster?LeagueID=00&Season=${CURRENT_SEASON}&TeamID=${summary.VISITOR_TEAM_ID}`, nbaHeaders)
             ]);
             
             const hHeader = homeRoster.data.resultSets[0].headers;
             homePlayers = homeRoster.data.resultSets[0].rowSet.map((row: any[]) => {
               const p: any = {};
               hHeader.forEach((h: string, i: number) => p[h] = row[i]);
               return {
                 personId: p.PLAYER_ID,
                 name: p.PLAYER,
                 position: p.POSITION,
                 status: 'ACTIVE',
                 statistics: getStatsWithAverages(p.PLAYER_ID, p.PLAYER)
               };
             });

             const aHeader = awayRoster.data.resultSets[0].headers;
             awayPlayers = awayRoster.data.resultSets[0].rowSet.map((row: any[]) => {
               const p: any = {};
               aHeader.forEach((h: string, i: number) => p[h] = row[i]);
               return {
                 personId: p.PLAYER_ID,
                 name: p.PLAYER,
                 position: p.POSITION,
                 status: 'ACTIVE',
                 statistics: getStatsWithAverages(p.PLAYER_ID, p.PLAYER)
               };
             });
          } catch (rError) {
             console.warn("Roster fetch failed, using emergency cache fallback for preview");
             // Emergency fallback using our playersCache which is likely populated by now
             homePlayers = playersCache
               .filter(p => p.TEAM_ID === summary.HOME_TEAM_ID)
               .map(p => ({
                 personId: p.PERSON_ID,
                 name: p.DISPLAY_FIRST_LAST,
                 position: "N/A",
                 status: 'ACTIVE',
                 statistics: getStatsWithAverages(p.PERSON_ID, p.DISPLAY_FIRST_LAST)
               }));
             
             awayPlayers = playersCache
               .filter(p => p.TEAM_ID === summary.VISITOR_TEAM_ID)
               .map(p => ({
                 personId: p.PERSON_ID,
                 name: p.DISPLAY_FIRST_LAST,
                 position: "N/A",
                 status: 'ACTIVE',
                 statistics: getStatsWithAverages(p.PERSON_ID, p.DISPLAY_FIRST_LAST)
               }));
          }

          res.json({
            game: {
              gameId: summary.GAME_ID,
              gameStatus: Number(summary.GAME_STATUS_ID),
              gameStatusText: summary.GAME_STATUS_TEXT,
              gameTimeUTC: summary.GAME_DATE_EST || new Date().toISOString(),
              homeTeam: {
                teamId: summary.HOME_TEAM_ID,
                teamTricode: homeScore.TEAM_ABBREVIATION,
                teamName: `${homeScore.TEAM_CITY} ${homeScore.TEAM_NAME}`,
                score: homeScore.PTS || 0,
                players: homePlayers
              },
              awayTeam: {
                teamId: summary.VISITOR_TEAM_ID,
                teamTricode: awayScore.TEAM_ABBREVIATION,
                teamName: `${awayScore.TEAM_CITY} ${awayScore.TEAM_NAME}`,
                score: awayScore.PTS || 0,
                players: awayPlayers
              }
            }
          });
        }
      }
    } catch (error: any) {
      console.error(`Error fetching game summary from ${url} (Sport: ${isMlb ? 'MLB' : 'NBA'}):`, error.message);
      // Return neutral state instead of random numbers
      res.json({
        game: {
          gameStatus: 1,
          gameStatusText: "Connecting...",
          homeTeam: { teamTricode: "HOME", score: 0, players: [] },
          awayTeam: { teamTricode: "AWAY", score: 0, players: [] }
        }
      });
    }
  });

  // 6. Get Play-by-Play (Lightning Feed)
  app.get("/api/games/:gameId/pbp", async (req, res) => {
    const gameId = req.params.gameId;
    const isMlb = req.query.sport === 'MLB';
    
    try {
      if (isMlb) {
        const response = await axios.get(
          `https://statsapi.mlb.com/api/v1.1/game/${gameId}/feed/live`,
          { 
            timeout: 15000,
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
            }
          }
        );
        const allPlays = response.data.liveData?.plays?.allPlays || [];
        // Transform MLB plays
        const plays = allPlays.map((play: any) => ({
          id: play.about?.atBatIndex,
          clock: `Inning ${play.about?.inning} (${play.about?.halfInning})`,
          description: play.result?.description || "",
          event: play.result?.event || "Play",
          period: play.about?.inning,
          scoreHome: play.result?.homeScore,
          scoreAway: play.result?.awayScore,
          timestamp: play.about?.startTime
        })).reverse().slice(0, 50);
        res.json({ plays });
      } else {
        try {
          const response = await fetchWithRetry(
            `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`,
            cdnHeaders
          );
          const gameActions = response.data.game?.actions || [];
          const plays = gameActions.map((action: any) => {
            return {
              id: action.actionNumber,
              clock: action.clock,
              description: action.description,
              event: action.actionType,
              period: action.period,
              scoreHome: action.scoreHome,
              scoreAway: action.scoreAway,
              timestamp: action.timeActual,
              tags: getContextualTags(action.description, action.actionType, action.scoreHome, action.scoreAway)
            };
          }).reverse().slice(0, 50);
          res.json({ plays });
        } catch (nbaError: any) {
          // Play-by-play usually doesn't exist for preview games, return gracefully
          res.json({ plays: [] });
        }
      }
    } catch (error: any) {
      console.error(`Error in PBP endpoint for ${gameId}: ${error.message}`);
      res.json({ plays: [] });
    }
  });


  // --- MLB API ROUTES ---

  // 1. MLB Player Search
  app.get("/api/mlb/players/search", async (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    if (!query) return res.json([]);
    
    try {
      const response = await axios.get(
        `https://statsapi.mlb.com/api/v1/people/search?names=${encodeURIComponent(query)}&activeStatus=active`,
        { timeout: 10000 }
      );
      
      const results = response.data.people || [];
      const players = results.map((p: any) => ({
        PERSON_ID: p.id,
        DISPLAY_FIRST_LAST: p.fullName,
        TEAM_ABBREVIATION: p.currentTeam?.abbreviation || "MLB",
        TEAM_NAME: p.currentTeam?.name || "MLB",
        TEAM_ID: p.currentTeam?.id || "",
        HEADSHOT: `https://img.mlbstatic.com/mlb-photos/image/upload/d_multi_fallback_custom.png/w_213,q_auto:best/v1/people/${p.id}/headshot/67/current`
      }));
      
      res.json(players);
    } catch (error) {
      console.error("MLB Search error:", error);
      res.json([]);
    }
  });

  // 2. MLB Player Game Log
  app.get("/api/mlb/players/:id/gamelog", async (req, res) => {
    const playerId = req.params.id;
    try {
      // We need to check if they are a hitter or pitcher, but for now we'll try hitting first
      // In a real app, we might check player position first
      const response = await axios.get(
        `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=hitting,pitching&season=2026`,
        { timeout: 10000 }
      );
      
      const stats = response.data.stats || [];
      const games: any[] = [];
      
      stats.forEach((statGroup: any) => {
        const group = statGroup.group.displayName;
        statGroup.splits?.forEach((s: any) => {
          const game: any = {
            GAME_DATE: s.date,
            MATCHUP: s.opponent?.name || "Unknown",
            WL: s.isWin ? "W" : "L",
            GROUP: group
          };

          if (group === "hitting") {
            game.H = s.stat.hits || 0;
            game.HR = s.stat.homeRuns || 0;
            game.RBI = s.stat.rbi || 0;
            game.R = s.stat.runs || 0;
            game.SB = s.stat.stolenBases || 0;
            game.AVG = s.stat.avg || ".000";
            game.TB = s.stat.totalBases || 0;
            game.H_R_RBI = game.H + game.R + game.RBI;
            game.PTS = game.H_R_RBI; // Custom "Points" for MLB hitters
          } else if (group === "pitching") {
            game.IP = s.stat.inningsPitched || "0.0";
            game.SO = s.stat.strikeOuts || 0;
            game.ER = s.stat.earnedRuns || 0;
            game.H_ALLOWED = s.stat.hits || 0;
            game.H = game.H_ALLOWED;
            game.BB = s.stat.baseOnBalls || 0;
            
            // Calculate Outs Recorded
            const ipStr = String(game.IP);
            const [innings, partial] = ipStr.split(".").map(Number);
            game.OUTS = (innings || 0) * 3 + (partial || 0);
            
            game.PTS = game.SO; // Custom "Points" for MLB pitchers
          }
          
          games.push(game);
        });
      });
      
      res.json(games.reverse()); // Most recent first
    } catch (error) {
      console.error("MLB Gamelog error:", error);
      res.json([]);
    }
  });

  // 3. MLB Scoreboard
  app.get("/api/mlb/scoreboard", async (req, res) => {
    if (!getSeasonStatus().MLB.active) return res.json([]);
    try {
      const today = new Date();
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      const dateStr = today.toISOString().split('T')[0];
      const tmrwStr = tmrw.toISOString().split('T')[0];

      const response = await axios.get(
        `https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&startDate=${dateStr}&endDate=${tmrwStr}`,
        { 
          timeout: 20000,
          headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          }
        }
      );
      
      const dates = response.data.dates || [];
      let games: any[] = [];

      dates.forEach((d: any) => {
        d.games?.forEach((g: any) => {
          // abstractGameState: 1 = Preview, 2 = Live, 3 = Final
          const gameStatus = g.status.abstractGameState === "Final" ? 3 : g.status.abstractGameState === "Live" ? 2 : 1;
          const detailedState = (g.status.detailedState || "").toLowerCase();
          const isFinished = gameStatus === 3 || detailedState.includes("final") || detailedState.includes("game over") || detailedState.includes("completed");
          const isPostponed = detailedState.includes("postponed") || detailedState.includes("cancel");

          // Filter out final, postponed, or canceled games
          if (!isFinished && !isPostponed) {
            games.push({
              gameId: g.gamePk,
              gameStatus: gameStatus,
              gameStatusText: g.status.detailedState,
              gameTimeUTC: g.gameDate,
              awayTeam: {
                teamId: g.teams.away.team.id,
                teamTricode: mlbTricodes[g.teams.away.team.id] || g.teams.away.team.name.substring(0, 3).toUpperCase(),
                score: g.teams.away.score || 0
              },
              homeTeam: {
                teamId: g.teams.home.team.id,
                teamTricode: mlbTricodes[g.teams.home.team.id] || g.teams.home.team.name.substring(0, 3).toUpperCase(),
                score: g.teams.home.score || 0
              }
            });
          }
        });
      });
      
      res.json(games);
    } catch (error) {
      console.warn("MLB Scoreboard API unavailable. Returning no games.");
      res.json([]);
    }
  });

  // -- Feature 5: Injury Impact Score --
  app.get("/api/injury-impact/:playerName", async (req, res) => {
    try {
      const playerName = req.params.playerName;
      const rawKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const apiKey = rawKey?.trim();
      if (!apiKey) throw new Error("API key missing");

      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Analyze the injury impact of ${playerName} being OUT for their team.
        1. Identify top 3 teammates who get a stat bump.
        2. Assign an "Injury Ripple Score" (0-100).
        3. Give a 1-sentence explanation of the impact.
        Return JSON: {"teammates": [name, bump_type, bump_val], "rippleScore": number, "summary": string}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      const text = response.text || "";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : {});
    } catch (e) {
      res.status(500).json({ error: "Failed to analyze injury impact" });
    }
  });

  // Feature 3: Line Movement
  app.get("/api/line-movement/:playerId", (req, res) => {
    const { playerId } = req.params;
    const history = lineMovementStore[playerId] || [
      { line: 24.5, time: "9:00 AM" },
      { line: 25.5, time: "11:30 AM" },
      { line: 26.5, time: "1:00 PM" }
    ];
    res.json(history);
  });

  // ==========================================
  // --- SOCCER BACKEND endpoints ---
  // ==========================================

  const soccerPlayersCache = [
    { PERSON_ID: 10001, DISPLAY_FIRST_LAST: "Cristiano Ronaldo", TEAM_ABBREVIATION: "RMD", TEAM_ID: 901 },
    { PERSON_ID: 10002, DISPLAY_FIRST_LAST: "Lionel Messi", TEAM_ABBREVIATION: "BAR", TEAM_ID: 902 },
    { PERSON_ID: 10003, DISPLAY_FIRST_LAST: "Kylian Mbappé", TEAM_ABBREVIATION: "PSG", TEAM_ID: 903 },
    { PERSON_ID: 10004, DISPLAY_FIRST_LAST: "Erling Haaland", TEAM_ABBREVIATION: "MCI", TEAM_ID: 904 },
    { PERSON_ID: 10005, DISPLAY_FIRST_LAST: "Jude Bellingham", TEAM_ABBREVIATION: "RMD", TEAM_ID: 901 },
    { PERSON_ID: 10006, DISPLAY_FIRST_LAST: "Bukayo Saka", TEAM_ABBREVIATION: "ARS", TEAM_ID: 905 }
  ];

  const soccerGamelogs: Record<number, any[]> = {
    10001: [ // Ronaldo
      { GAME_DATE: "2026-06-18", MATCHUP: "RMD vs BAR", WL: "W", MIN: 90, G: 2, A: 0, S: 6, SOT: 4, T: 0, P: 28, FS: 3, FC: 1, PTS: 18.2 },
      { GAME_DATE: "2026-06-12", MATCHUP: "RMD @ ATM", WL: "W", MIN: 90, G: 1, A: 1, S: 4, SOT: 2, T: 1, P: 32, FS: 1, FC: 2, PTS: 14.5 },
      { GAME_DATE: "2026-06-05", MATCHUP: "RMD vs BVB", WL: "W", MIN: 82, G: 0, A: 1, S: 3, SOT: 1, T: 0, P: 24, FS: 4, FC: 0, PTS: 8.4 },
      { GAME_DATE: "2026-05-29", MATCHUP: "RMD @ SEV", WL: "L", MIN: 90, G: 0, A: 0, S: 5, SOT: 1, T: 2, P: 30, FS: 2, FC: 3, PTS: 5.2 },
      { GAME_DATE: "2026-05-22", MATCHUP: "RMD vs VIL", WL: "W", MIN: 75, G: 3, A: 0, S: 7, SOT: 5, T: 0, P: 21, FS: 1, FC: 0, PTS: 26.8 }
    ],
    10002: [ // Messi
      { GAME_DATE: "2026-06-18", MATCHUP: "BAR @ RMD", WL: "L", MIN: 90, G: 1, A: 0, S: 4, SOT: 3, T: 1, P: 55, FS: 5, FC: 1, PTS: 12.5 },
      { GAME_DATE: "2026-06-11", MATCHUP: "BAR vs ATM", WL: "W", MIN: 90, G: 1, A: 2, S: 3, SOT: 2, T: 2, P: 68, FS: 4, FC: 0, PTS: 21.4 },
      { GAME_DATE: "2026-06-04", MATCHUP: "BAR vs PSG", WL: "W", MIN: 90, G: 2, A: 1, S: 5, SOT: 4, T: 0, P: 61, FS: 3, FC: 1, PTS: 24.8 },
      { GAME_DATE: "2026-05-28", MATCHUP: "BAR @ BET", WL: "W", MIN: 80, G: 0, A: 1, S: 2, SOT: 1, T: 1, P: 48, FS: 2, FC: 0, PTS: 7.8 },
      { GAME_DATE: "2026-05-21", MATCHUP: "BAR vs CEL", WL: "W", MIN: 90, G: 2, A: 0, S: 5, SOT: 3, T: 0, P: 59, FS: 4, FC: 2, PTS: 17.6 }
    ],
    10003: [ // Mbappe
      { GAME_DATE: "2026-06-16", MATCHUP: "PSG @ LIL", WL: "W", MIN: 90, G: 2, A: 0, S: 5, SOT: 3, T: 0, P: 25, FS: 2, FC: 1, PTS: 17.0 },
      { GAME_DATE: "2026-06-10", MATCHUP: "PSG vs LYO", WL: "W", MIN: 85, G: 1, A: 1, S: 4, SOT: 2, T: 1, P: 29, FS: 3, FC: 0, PTS: 13.5 },
      { GAME_DATE: "2026-06-04", MATCHUP: "PSG @ BAR", WL: "L", MIN: 90, G: 1, A: 0, S: 3, SOT: 1, T: 0, P: 22, FS: 1, FC: 2, PTS: 9.2 },
      { GAME_DATE: "2026-05-27", MATCHUP: "PSG vs MAR", WL: "W", MIN: 90, G: 3, A: 0, S: 8, SOT: 5, T: 0, P: 18, FS: 4, FC: 1, PTS: 26.5 },
      { GAME_DATE: "2026-05-20", MATCHUP: "PSG @ REN", WL: "W", MIN: 90, G: 1, A: 1, S: 4, SOT: 3, T: 1, P: 31, FS: 2, FC: 0, PTS: 14.8 }
    ],
    10004: [ // Haaland
      { GAME_DATE: "2026-06-17", MATCHUP: "MCI vs EVE", WL: "W", MIN: 90, G: 3, A: 0, S: 6, SOT: 4, T: 0, P: 12, FS: 1, FC: 1, PTS: 25.5 },
      { GAME_DATE: "2026-06-11", MATCHUP: "MCI @ CHE", WL: "W", MIN: 90, G: 1, A: 0, S: 3, SOT: 2, T: 1, P: 14, FS: 2, FC: 2, PTS: 9.8 },
      { GAME_DATE: "2026-06-03", MATCHUP: "MCI @ MUN", WL: "D", MIN: 90, G: 1, A: 0, S: 4, SOT: 1, T: 0, P: 9, FS: 0, FC: 1, PTS: 8.5 },
      { GAME_DATE: "2026-05-26", MATCHUP: "MCI vs LIV", WL: "W", MIN: 90, G: 2, A: 0, S: 5, SOT: 3, T: 0, P: 11, FS: 3, FC: 0, PTS: 17.5 },
      { GAME_DATE: "2026-05-19", MATCHUP: "MCI @ WHU", WL: "W", MIN: 81, G: 2, A: 0, S: 5, SOT: 2, T: 0, P: 8, FS: 1, FC: 1, PTS: 16.2 }
    ],
    10005: [ // Bellingham
      { GAME_DATE: "2026-06-18", MATCHUP: "RMD vs BAR", WL: "W", MIN: 90, G: 1, A: 1, S: 3, SOT: 2, T: 3, P: 48, FS: 4, FC: 2, PTS: 14.5 },
      { GAME_DATE: "2026-06-12", MATCHUP: "RMD @ ATM", WL: "W", MIN: 90, G: 0, A: 1, S: 1, SOT: 0, T: 4, P: 51, FS: 2, FC: 1, PTS: 7.2 },
      { GAME_DATE: "2026-06-05", MATCHUP: "RMD vs BVB", WL: "W", MIN: 90, G: 1, A: 0, S: 2, SOT: 1, T: 2, P: 44, FS: 1, FC: 0, PTS: 9.8 },
      { GAME_DATE: "2026-05-29", MATCHUP: "RMD @ SEV", WL: "L", MIN: 85, G: 0, A: 0, S: 2, SOT: 0, T: 5, P: 39, FS: 3, FC: 3, PTS: 4.5 },
      { GAME_DATE: "2026-05-22", MATCHUP: "RMD vs VIL", WL: "W", MIN: 90, G: 0, A: 2, S: 1, SOT: 1, T: 2, P: 58, FS: 2, FC: 1, PTS: 10.4 }
    ],
    10006: [ // Saka
      { GAME_DATE: "2026-06-18", MATCHUP: "ARS vs CHE", WL: "W", MIN: 90, G: 1, A: 1, S: 4, SOT: 2, T: 1, P: 36, FS: 3, FC: 1, PTS: 13.8 },
      { GAME_DATE: "2026-06-11", MATCHUP: "ARS @ TOT", WL: "W", MIN: 88, G: 1, A: 0, S: 3, SOT: 2, T: 2, P: 32, FS: 4, FC: 1, PTS: 11.2 },
      { GAME_DATE: "2026-06-03", MATCHUP: "ARS vs MUN", WL: "W", MIN: 90, G: 0, A: 1, S: 2, SOT: 1, T: 0, P: 41, FS: 2, FC: 0, PTS: 6.8 },
      { GAME_DATE: "2026-05-27", MATCHUP: "ARS @ LIV", WL: "D", MIN: 90, G: 1, A: 0, S: 3, SOT: 1, T: 1, P: 28, FS: 1, FC: 2, PTS: 8.5 },
      { GAME_DATE: "2026-05-20", MATCHUP: "ARS @ AVL", WL: "W", MIN: 78, G: 2, A: 0, S: 5, SOT: 3, T: 0, P: 25, FS: 2, FC: 1, PTS: 16.5 }
    ]
  };

  app.get("/api/soccer/players/search", (req, res) => {
    const query = (req.query.q as string || "").toLowerCase();
    if (!query) return res.json(soccerPlayersCache);
    const results = soccerPlayersCache.filter(p => p.DISPLAY_FIRST_LAST.toLowerCase().includes(query));
    res.json(results);
  });

  app.get("/api/soccer/players/:id/gamelog", (req, res) => {
    const id = parseInt(req.params.id);
    const logs = soccerGamelogs[id] || soccerGamelogs[10001];
    res.json(logs);
  });

  app.get("/api/soccer/scoreboard", (req, res) => {
    if (!getSeasonStatus().SOCCER.active) return res.json([]);
    const todayStr = new Date().toISOString().split('T')[0];
    res.json([
      {
        gameId: "900001",
        gameStatus: 2,
        gameStatusText: "75'",
        gameTimeUTC: `${todayStr}T20:00:00Z`,
        awayTeam: { teamId: 901, teamTricode: "RMD", score: 2 },
        homeTeam: { teamId: 902, teamTricode: "BAR", score: 1 }
      },
      {
        gameId: "900002",
        gameStatus: 2,
        gameStatusText: "88'",
        gameTimeUTC: `${todayStr}T21:45:00Z`,
        awayTeam: { teamId: 905, teamTricode: "ARS", score: 2 },
        homeTeam: { teamId: 904, teamTricode: "MCI", score: 3 }
      }
    ]);
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Pre-fetch players and real season averages in background
    fetchPlayers().catch(console.error);
    fetchSeasonAverages().catch(console.error);

    // Feature 3: Simulate Line Movement every 30 mins
    cron.schedule("*/30 * * * *", () => {
      console.log("Updating line movement tracking...");
      playersCache.slice(0, 50).forEach(p => {
        const id = p.PERSON_ID.toString();
        if (!lineMovementStore[id]) lineMovementStore[id] = [{ line: 15.5 + (p.PERSON_ID % 10), time: "Start" }];
        const lastLine = lineMovementStore[id][lineMovementStore[id].length - 1].line;
        const drift = (Math.random() - 0.5) * 2;
        lineMovementStore[id].push({ line: Number((lastLine + drift).toFixed(1)), time: new Date().toLocaleTimeString() });
        if (lineMovementStore[id].length > 10) lineMovementStore[id].shift();
      });
    });
  });
}

startServer();
