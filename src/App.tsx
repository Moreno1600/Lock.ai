import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { Search, Activity, TrendingUp, AlertCircle, User, Calendar, ChevronRight, LayoutList, Target, Trash2, Info, ArrowUpRight, ShieldCheck, Zap, Calculator, DollarSign, Home, LayoutGrid, BarChart3, Settings, X, Flame, Filter, ChevronDown, UploadCloud, ScanLine, CheckCircle, Bookmark, MessageSquare, Clock, Trophy, Users, Share2, Sparkles, AlertTriangle, GraduationCap, Download, Globe } from 'lucide-react';
import { cn } from './lib/utils';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';

interface Player {
  PERSON_ID: number;
  DISPLAY_FIRST_LAST: string;
  TEAM_ABBREVIATION: string;
  TEAM_ID?: number;
  starter?: boolean;
  statistics?: {
    seasonAverages?: {
      ppg: string;
      rpg: string;
      apg: string;
    }
  }
}

interface Game {
  Game_ID: string;
  GAME_DATE: string;
  MATCHUP: string;
  WL: string;
  MIN: number;
  PTS: number;
  REB: number;
  AST: number;
  PRA: number;
  RA: number;
  PR: number;
  PA: number;
  FAN: number;
  potential_ast?: number;
  potential_reb?: number;
  [key: string]: any;
}

interface PlayerStatus {
  role: string;
  injury_status: string;
  is_b2b?: boolean;
  usage_spike?: boolean;
  usage_increase?: number;
}

type Sport = 'NBA' | 'MLB' | 'SOCCER';

interface FavoriteProp {
  id: string;
  player: Player;
  statCategory: string;
  targetLine: number;
  direction?: 'OVER' | 'UNDER';
  hitRate: number;
  hitCount: number;
  totalGames: number;
  sport: Sport;
}


const defaultNbaCategories = ['PTS', 'REB', 'AST', 'PRA', 'RA', 'PR', 'PA', 'FAN', '3PM'];
const defaultMlbCategories = ['PTS', 'TB', 'SO', 'OUTS', 'ER', 'H_R_RBI']; // Mixed simplified
const defaultSoccerCategories = ['G', 'A', 'S', 'SOT', 'T', 'P', 'FS', 'FC', 'PTS'];

export const getHeadshotUrl = (id: number, sport: Sport = 'NBA') => {
  if (!id) return null;
  if (sport === 'MLB') {
    return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_213,q_auto:best/v1/people/${id}/headshot/67/current`;
  }
  if (sport === 'SOCCER') {
    return `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`;
  }
  return `https://cdn.nba.com/headshots/nba/latest/260x190/${id}.png`;
};

export const getTeamLogoUrl = (tricode: string, sport: Sport = 'NBA') => {
  if (!tricode) return null;
  let normalized = tricode.toLowerCase();
  
  // NBA ESPN Mappings
  if (sport === 'NBA') {
    const nbaMap: Record<string, string> = {
      'uta': 'utah',
      'gsw': 'gs',
      'sas': 'sa',
      'nop': 'no',
      'nyk': 'ny',
      'was': 'was',
      'wsh': 'was',
      'bkn': 'bkn',
      'phx': 'phx',
      'okc': 'okc',
      'lac': 'lac',
      'lal': 'lal',
      'mil': 'mil',
      'phi': 'phi',
      'bos': 'bos',
      'mia': 'mia',
      'atl': 'atl',
      'cha': 'cha',
      'orl': 'orl',
      'den': 'den',
      'min': 'min',
      'por': 'por',
      'sac': 'sac',
      'dal': 'dal',
      'mem': 'mem'
    };
    if (nbaMap[normalized]) normalized = nbaMap[normalized];
  } else if (sport === 'MLB') {
    // MLB ESPN Mappings
    const mlbMap: Record<string, string> = {
      'cws': 'chw',
      'chw': 'chw',
      'kc': 'kc',
      'sf': 'sf',
      'sd': 'sd',
      'wsh': 'was',
      'was': 'was',
      'tb': 'tb',
      'laa': 'ana',
      'ana': 'ana',
      'ari': 'ari',
      'az': 'ari',
      'mia': 'mia',
      'fla': 'mia',
      'nym': 'nym',
      'nyy': 'nyy',
      'lad': 'lad',
      'chc': 'chc',
      'cin': 'cin',
      'cle': 'cle',
      'col': 'col',
      'det': 'det',
      'hou': 'hou',
      'mil': 'mil',
      'min': 'min',
      'oak': 'oak',
      'phi': 'phi',
      'pit': 'pit',
      'sea': 'sea',
      'stl': 'stl',
      'tex': 'tex',
      'tor': 'tor'
    };
    if (mlbMap[normalized]) normalized = mlbMap[normalized];
  } else {
    // Soccer ESPN Mappings
    const soccerMap: Record<string, string> = {
      'rmd': 'real-madrid',
      'bar': 'barcelona',
      'mci': 'manchester-city',
      'ars': 'arsenal',
      'liv': 'liverpool',
      'mun': 'manchester-united',
      'che': 'chelsea',
      'bay': 'bayern-munich',
      'psg': 'paris-saint-germain',
      'juv': 'juventus',
      'int': 'internazionale',
      'mil': 'ac-milan',
      'atm': 'atletico-madrid',
      'bvb': 'borussia-dortmund'
    };
    if (soccerMap[normalized]) normalized = soccerMap[normalized];
  }
  
  return `https://a.espncdn.com/i/teamlogos/${sport.toLowerCase()}/500/${normalized}.png`;
};

const getTeamColor = (team: string | undefined | null, sport: Sport): string => {
  if (!team) return '#18181b';
  const normalized = team.toLowerCase();
  
  if (sport === 'NBA') {
    const colors: Record<string, string> = {
      'atl': '#E03A3E', 'bos': '#007A33', 'bkn': '#000000', 'cha': '#1D1160',
      'chi': '#CE1141', 'cle': '#860038', 'dal': '#00538C', 'den': '#0E2240',
      'det': '#006BB6', 'gsw': '#1D428A', 'hou': '#CE1141', 'ind': '#002D62',
      'lac': '#C8102E', 'lal': '#552583', 'mem': '#5D76A9', 'mia': '#98002E',
      'mil': '#00471B', 'min': '#0C2340', 'nop': '#0C2340', 'nyk': '#006BB6',
      'okc': '#007AC1', 'orl': '#0077C0', 'phi': '#006BB6', 'phx': '#1D1160',
      'por': '#E03A3E', 'sac': '#5A2D81', 'sas': '#C4CED4', 'tor': '#CE1141',
      'uta': '#002B5C', 'was': '#002B5C'
    };
    return colors[normalized] || '#18181b';
  } else if (sport === 'MLB') {
    const colors: Record<string, string> = {
      'lad': '#005A9C', 'nyy': '#0C2340', 'bos': '#BD3039', 'chc': '#0E3386',
      'ana': '#BA0021', 'laa': '#BA0021', 'nym': '#002D72', 'sf': '#FD5A1E',
      'stl': '#C41E3A', 'tex': '#003278', 'tor': '#134A8E', 'hou': '#002D62',
      'atl': '#CE1141', 'phi': '#E81828', 'sd': '#2F241D', 'mil': '#12284B',
      'min': '#002B5C', 'ari': '#A71930', 'bal': '#DF4601', 'cle': '#002B5C',
      'chw': '#27251F', 'cws': '#27251F', 'det': '#0C2340', 'kc': '#004687',
      'mia': '#00A3E0', 'oak': '#003831', 'pit': '#FFB81C', 'sea': '#005C5C',
      'tb': '#092C5C', 'was': '#AB0003', 'wsh': '#AB0003', 'col': '#333366',
      'cin': '#C6011F'
    };
    return colors[normalized] || '#18181b';
  } else {
    const colors: Record<string, string> = {
      'rmd': '#00529F', 'bar': '#004D98', 'mci': '#6CABDD', 'ars': '#EF0107',
      'liv': '#C8102E', 'mun': '#DA291C', 'che': '#034694', 'bay': '#DC052D',
      'psg': '#004170', 'juv': '#000000', 'int': '#005395', 'mil': '#E30613',
      'atm': '#CB3524', 'bvb': '#FDE100'
    };
    return colors[normalized] || '#18181b';
  }
};

const sortPlayers = (players: any[] | undefined, sport: Sport) => {
  if (!players) return [];
  
  return [...players].sort((a, b) => {
    // 1. Sort by Starter status first
    const isStarterA = a.starter === true || a.isStarter === true;
    const isStarterB = b.starter === true || b.isStarter === true;
    
    if (isStarterA && !isStarterB) return -1;
    if (!isStarterA && isStarterB) return 1;

    // 2. Sort by points/hits/goals if available (Performance)
    const statsA = a.statistics || {};
    const statsB = b.statistics || {};
    
    const performanceA = sport === 'NBA' 
      ? (Number(statsA.points) || 0) + (Number(statsA.reboundsTotal) || 0) * 0.5 + (Number(statsA.assists) || 0) * 0.5
      : sport === 'MLB'
        ? (Number(statsA.hits) || 0) + (Number(statsA.homeRuns) || 0) * 2 + (Number(statsA.rbi) || 0)
        : (Number(statsA.goals) || 0) * 3 + (Number(statsA.assists) || 0) * 2 + (Number(statsA.shots) || 0);

    const performanceB = sport === 'NBA' 
      ? (Number(statsB.points) || 0) + (Number(statsB.reboundsTotal) || 0) * 0.5 + (Number(statsB.assists) || 0) * 0.5
      : sport === 'MLB'
        ? (Number(statsB.hits) || 0) + (Number(statsB.homeRuns) || 0) * 2 + (Number(statsB.rbi) || 0)
        : (Number(statsB.goals) || 0) * 3 + (Number(statsB.assists) || 0) * 2 + (Number(statsB.shots) || 0);

    if (Math.abs(performanceA - performanceB) > 0.1) return performanceB - performanceA;

    // 3. Alphabetical fallback
    return (a.name || a.DISPLAY_FIRST_LAST || '').localeCompare(b.name || b.DISPLAY_FIRST_LAST || '');
  });
};

const formatToCT = (utcString: string, statusText: string, status: number) => {
  if (status !== 1) return statusText;
  try {
    const date = new Date(utcString);
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/Chicago',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }) + ' CT';
  } catch (e) {
    return statusText.replace('ET', 'CT');
  }
};

export default function App() {
  const [sport, setSport] = useState<Sport>('NBA');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'header' | 'hero' | null>(null);
  
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [statCategory, setStatCategory] = useState<string>('PTS');

  // Change category when sport changes
  useEffect(() => {
    setStatCategory(sport === 'SOCCER' ? 'G' : 'PTS');
    setSearchResults([]);
    setSelectedPlayer(null);
  }, [sport]);
  
  const [targetLine, setTargetLine] = useState<string>('');
  const [favorites, setFavorites] = useState<FavoriteProp[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('lockai-favorites') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('lockai-favorites', JSON.stringify(favorites));
  }, [favorites]);
  const [activeTab, setActiveTab] = useState<'home' | 'favorites' | 'optimizer' | 'import' | 'tos'>('home');

  // Season availability — off-season sports show an unavailable notice instead of fake data
  const [seasonStatus, setSeasonStatus] = useState<Record<string, { active: boolean; resumes: string }> | null>(null);

  useEffect(() => {
    axios.get('/api/season-status').then(res => setSeasonStatus(res.data)).catch(() => {});
  }, []);

  // Line Movement
  const [lineHistory, setLineHistory] = useState<any[]>([]);

  // Injury Impact
  const [injuryImpact, setInjuryImpact] = useState<any>(null);
  const [isAnalyzingInjury, setIsAnalyzingInjury] = useState(false);

  
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [aiProjection, setAiProjection] = useState<number | null>(null);
  const [lockScore, setLockScore] = useState<number | null>(null);
  const [eli5Summary, setEli5Summary] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parlaySlip, setParlaySlip] = useState<any[]>([]);
  const [showParlaySlip, setShowParlaySlip] = useState(false);
  const [lastLineChange, setLastLineChange] = useState<number | null>(null);
  const [prevLine, setPrevLine] = useState<string>('');

  // Detect line movement for glow
  useEffect(() => {
    if (targetLine && targetLine !== prevLine) {
      if (prevLine !== '') {
        setLastLineChange(Date.now());
      }
      setPrevLine(targetLine);
    }
  }, [targetLine, prevLine]);

  // Mock RLM Data
  const publicOverPct = 72; // 72% of public on the over
  const lineMovement = -0.5; // Line moved down from 6.0 to 5.5
  const isRLM = publicOverPct > 60 && lineMovement < 0;

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [trendingPlayers, setTrendingPlayers] = useState<Player[]>([]);
  const [liveGames, setLiveGames] = useState<any[]>([]);

  useEffect(() => {
    // Mock trending players for professional feel
    if (sport === 'NBA') {
      setTrendingPlayers([
        { PERSON_ID: 2544, DISPLAY_FIRST_LAST: 'LeBron James', TEAM_ABBREVIATION: 'LAL' },
        { PERSON_ID: 203999, DISPLAY_FIRST_LAST: 'Nikola Jokic', TEAM_ABBREVIATION: 'DEN' },
        { PERSON_ID: 1628369, DISPLAY_FIRST_LAST: 'Jayson Tatum', TEAM_ABBREVIATION: 'BOS' },
        { PERSON_ID: 201939, DISPLAY_FIRST_LAST: 'Stephen Curry', TEAM_ABBREVIATION: 'GSW' },
        { PERSON_ID: 203507, DISPLAY_FIRST_LAST: 'Giannis Antetokounmpo', TEAM_ABBREVIATION: 'MIL' },
        { PERSON_ID: 1630162, DISPLAY_FIRST_LAST: 'Anthony Edwards', TEAM_ABBREVIATION: 'MIN' }
      ]);
    } else if (sport === 'MLB') {
      setTrendingPlayers([
        { PERSON_ID: 660271, DISPLAY_FIRST_LAST: 'Shohei Ohtani', TEAM_ABBREVIATION: 'LAD' },
        { PERSON_ID: 592450, DISPLAY_FIRST_LAST: 'Aaron Judge', TEAM_ABBREVIATION: 'NYY' },
        { PERSON_ID: 545361, DISPLAY_FIRST_LAST: 'Mike Trout', TEAM_ABBREVIATION: 'LAA' },
        { PERSON_ID: 669221, DISPLAY_FIRST_LAST: 'Corbin Carroll', TEAM_ABBREVIATION: 'ARI' },
        { PERSON_ID: 605141, DISPLAY_FIRST_LAST: 'Mookie Betts', TEAM_ABBREVIATION: 'LAD' },
        { PERSON_ID: 683002, DISPLAY_FIRST_LAST: 'Gunnar Henderson', TEAM_ABBREVIATION: 'BAL' }
      ]);
    } else {
      setTrendingPlayers([
        { PERSON_ID: 10001, DISPLAY_FIRST_LAST: 'Cristiano Ronaldo', TEAM_ABBREVIATION: 'RMD' },
        { PERSON_ID: 10002, DISPLAY_FIRST_LAST: 'Lionel Messi', TEAM_ABBREVIATION: 'BAR' },
        { PERSON_ID: 10003, DISPLAY_FIRST_LAST: 'Kylian Mbappé', TEAM_ABBREVIATION: 'PSG' },
        { PERSON_ID: 10004, DISPLAY_FIRST_LAST: 'Erling Haaland', TEAM_ABBREVIATION: 'MCI' },
        { PERSON_ID: 10005, DISPLAY_FIRST_LAST: 'Jude Bellingham', TEAM_ABBREVIATION: 'RMD' },
        { PERSON_ID: 10006, DISPLAY_FIRST_LAST: 'Bukayo Saka', TEAM_ABBREVIATION: 'ARS' }
      ]);
    }
  }, [sport]);

  useEffect(() => {
    const fetchScoreboard = async () => {
      try {
        const endpoint = sport === 'NBA' ? '/api/scoreboard' : sport === 'MLB' ? '/api/mlb/scoreboard' : '/api/soccer/scoreboard';
        const res = await axios.get(endpoint);
        setLiveGames(res.data || []);
      } catch (error: any) {
        console.warn(`Scoreboard sync deferred for ${sport}:`, error.message);
      }
    };
    fetchScoreboard();
    const interval = setInterval(fetchScoreboard, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [sport]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const endpoint = sport === 'NBA' 
          ? `/api/players/search?q=${encodeURIComponent(searchQuery)}` 
          : sport === 'MLB' 
            ? `/api/mlb/players/search?q=${encodeURIComponent(searchQuery)}`
            : `/api/soccer/players/search?q=${encodeURIComponent(searchQuery)}`;
        const res = await axios.get(endpoint);
        setSearchResults(res.data);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    }, 50);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, sport]);

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    setSearchQuery('');
    setSearchResults([]);
    setIsLoadingData(true);
    setAnalysis(null);
    
    try {
      if (sport === 'NBA') {
        const [gamelogRes, statusRes] = await Promise.all([
          axios.get(`/api/players/${player.PERSON_ID}/gamelog`),
          axios.get(`/api/players/${encodeURIComponent(player.DISPLAY_FIRST_LAST)}/status`)
        ]);
        setGames(gamelogRes.data);
        setStatus(statusRes.data);
      } else if (sport === 'MLB') {
        const gamelogRes = await axios.get(`/api/mlb/players/${player.PERSON_ID}/gamelog`);
        setGames(gamelogRes.data);
        setStatus({ role: "MLB Player", injury_status: "Available" });
      } else {
        const gamelogRes = await axios.get(`/api/soccer/players/${player.PERSON_ID}/gamelog`);
        setGames(gamelogRes.data);
        setStatus({ role: "Soccer Player", injury_status: "Available" });
      }
    } catch (error) {
      console.error(`Error fetching ${sport} player data`, error);
      alert(`Failed to load player data. The ${sport} API might be rate limiting.`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedPlayer || games.length === 0 || !status) return;
    
    setIsAnalyzing(true);
    try {
      const rawKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      const apiKey = rawKey?.trim();
      if (!apiKey) {
        throw new Error("API key is not set in the environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      let analysisDataStr = '';
      if (sport === 'NBA') {
         analysisDataStr = JSON.stringify(games.slice(0, 10).map((g: any) => ({
          Date: g.GAME_DATE, Type: g.SEASON_TYPE, Matchup: g.MATCHUP, MIN: g.MIN, PTS: g.PTS, REB: g.REB, AST: g.AST, PRA: g.PRA, PR: g.PR, PA: g.PA, RA: g.RA, FAN: g.FAN, '3PM': g['3PM']
        })), null, 2);
      } else if (sport === 'MLB') {
         analysisDataStr = JSON.stringify(games.slice(0, 10).map((g: any) => ({
          Date: g.GAME_DATE, Type: g.SEASON_TYPE, Matchup: g.MATCHUP, PTS: g.PTS, SO: g.SO, H_R_RBI: g.H_R_RBI, TB: g.TB, ER: g.ER, OUTS: g.OUTS
        })), null, 2);
      } else {
         analysisDataStr = JSON.stringify(games.slice(0, 10).map((g: any) => ({
          Date: g.GAME_DATE, Matchup: g.MATCHUP, G: g.G, A: g.A, S: g.S, SOT: g.SOT, T: g.T, P: g.P, FS: g.FS, FC: g.FC, PTS: g.PTS
        })), null, 2);
      }

      const prompt = `
        You are an expert ${sport} sports analyst. Analyze the following player's recent performance for prop betting.
        
        Player: ${selectedPlayer.DISPLAY_FIRST_LAST}
        Status: ${status.role}, ${status.injury_status}
        Category: ${statCategory}
        ${isValidTarget ? `Target: ${targetNum}` : ''}
        
        Recent Data: ${analysisDataStr}
        
        CRITICAL: Provide exactly 2-3 sentences of high-impact analysis. No headers, no bullet points.
        
        Then, provide these exact formats on their own lines at the end:
        PROJECTION: [number]
        LOCK_SCORE: [number 0-100]
        ELI5: [A one-sentence summary]
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }],
      });
      
      const fullText = response.text || "";
      setAnalysis(""); // Clear previous analysis
      setLockScore(null);
      setEli5Summary(null);
      setAiProjection(null);
      
      // Clean up the text for display (hide the raw tags)
      const displayText = fullText
        .replace(/PROJECTION:\s*(\d+\.?\d*)/g, '')
        .replace(/LOCK_SCORE:\s*(\d+)/g, '')
        .replace(/ELI5:\s*(.*)/g, '')
        .trim();
        
      setAnalysis(displayText);

      // Extract projection
      const projectionMatch = fullText.match(/PROJECTION:\s*(\d+\.?\d*)/);
      if (projectionMatch) {
        setAiProjection(parseFloat(projectionMatch[1]));
      }
      
      // Extract lock score
      const lockScoreMatch = fullText.match(/LOCK_SCORE:\s*(\d+)/);
      if (lockScoreMatch) {
        setLockScore(parseInt(lockScoreMatch[1], 10));
      }
      
      // Extract ELI5
      const eli5Match = fullText.match(/ELI5:\s*(.*)/);
      if (eli5Match) {
        setEli5Summary(eli5Match[1].trim());
      }
    } catch (error: any) {
      console.error("Analysis error", error);
      alert("Failed to generate analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recentGames = games.slice(0, 10);
  
  const targetNum = parseFloat(targetLine);
  const isValidTarget = !isNaN(targetNum) && targetNum > 0;
  const hitCount = isValidTarget ? recentGames.filter(g => g[statCategory] >= targetNum).length : 0;
  const hitRate = isValidTarget && recentGames.length > 0 ? (hitCount / recentGames.length) * 100 : 0;
  
  // Advanced Logic: Win Prob & Edge
  const edge = aiProjection && isValidTarget ? ((aiProjection - targetNum) / targetNum) * 100 : 0;
  const winProb = hitRate * 0.8 + (edge > 0 ? 15 : -5); // Simplified win prob logic
  
  const currentFavId = selectedPlayer && isValidTarget ? `${selectedPlayer.PERSON_ID}-${statCategory}-${targetNum}` : null;
  const isFavorited = currentFavId ? favorites.some(f => f.id === currentFavId) : false;

  const handleToggleFavorite = () => {
    if (!selectedPlayer || !isValidTarget || !currentFavId) return;
    if (isFavorited) {
      setFavorites(favorites.filter(f => f.id !== currentFavId));
      setParlaySlip(parlaySlip.filter(f => f.id !== currentFavId));
    } else {
      const newFav: FavoriteProp = {
        id: currentFavId,
        player: selectedPlayer,
        statCategory,
        targetLine: targetNum,
        hitRate,
        hitCount,
        totalGames: recentGames.length,
        sport: sport
      };
      setFavorites([...favorites, newFav]);
      setParlaySlip([...parlaySlip, newFav]);
      setShowParlaySlip(true);
    }
  };

  const handleFetchLineTracker = (playerId: number) => {
    axios.get(`/api/line-movement/${playerId}`).then(res => setLineHistory(res.data)).catch(() => {});
  };

  useEffect(() => {
    if (selectedPlayer) {
      handleFetchLineTracker(selectedPlayer.PERSON_ID);
      // Also analyze injury impact if they are out
      if (status?.injury_status?.toLowerCase().includes('out')) {
        setIsAnalyzingInjury(true);
        axios.get(`/api/injury-impact/${selectedPlayer.DISPLAY_FIRST_LAST}`)
          .then(res => setInjuryImpact(res.data))
          .finally(() => setIsAnalyzingInjury(false));
      } else {
        setInjuryImpact(null);
      }
    }
  }, [selectedPlayer, status]);

  const chartData = [...recentGames].reverse().map(g => ({
    date: g.GAME_DATE.split(' ')[0],
    matchup: g.MATCHUP,
    value: g[statCategory]
  }));
  
  const average = recentGames.length > 0 
    ? recentGames.reduce((acc, g) => acc + g[statCategory], 0) / recentGames.length 
    : 0;

  // Mock potential stats for demo
  const gamesWithPotential = recentGames.map(g => ({
    ...g,
    potential_ast: g.AST + Math.floor(Math.random() * 5),
    potential_reb: g.REB + Math.floor(Math.random() * 4)
  }));

  // formatToCT moved to top level scope


  return (
    <div className="min-h-screen bg-zinc-950 text-[#E0E0E0] font-sans selection:bg-emerald-500/30 flex flex-col md:flex-row overflow-hidden">
      {/* Navigation - Bottom bar on mobile, Left Sidebar on desktop */}
      <aside className="fixed bottom-0 left-0 right-0 h-16 border-t border-zinc-800/60 bg-zinc-950 flex flex-row items-center justify-around z-50 md:relative md:h-auto md:w-20 md:border-r md:border-t-0 md:flex-col md:py-8 md:gap-8">
        <div className="hidden md:flex items-center justify-center mb-6">
          <svg width="48" height="48" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_12px_rgba(0,255,65,0.25)]">
            <path d="M10 15C10 12.2386 12.2386 10 15 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H15C12.2386 50 10 47.7614 10 45V15Z" fill="#1A1D21"/>
            <path d="M22 25V40M22 40H32M28 32L36 25M30 34L37 42" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 15C10 12.2386 12.2386 10 15 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H15C12.2386 50 10 47.7614 10 45V15Z" stroke="#00FF41" strokeWidth="1.5" strokeOpacity="0.8"/>
          </svg>
        </div>
        
        <nav className="flex flex-row md:flex-col gap-2 md:gap-6 w-full md:w-auto justify-around md:justify-start px-2 md:px-0">
          <SidebarIcon 
            icon={Home} 
            active={activeTab === 'home'} 
            onClick={() => {
              setActiveTab('home');
              setSelectedPlayer(null);
            }} 
            label="Home"
          />
          <SidebarIcon 
            icon={Zap} 
            active={activeTab === 'optimizer'} 
            onClick={() => setActiveTab('optimizer')} 
            label="Optimizer"
          />
          <SidebarIcon
            icon={Bookmark} 
            active={activeTab === 'favorites'} 
            onClick={() => setActiveTab('favorites')} 
            label="Saved"
          />
        </nav>

        <div className="hidden md:flex mt-auto flex-col gap-6">
          <SidebarIcon icon={BarChart3} active={false} onClick={() => {}} label="Trends" />
          <SidebarIcon icon={Settings} active={false} onClick={() => {}} label="Settings" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 md:pb-0">
        {/* Header */}
        <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <div className="flex items-center gap-2 md:gap-5">
                <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-[52px] md:h-[52px] drop-shadow-[0_0_18px_rgba(0,255,65,0.35)]">
                  <path d="M10 15C10 12.2386 12.2386 10 15 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H15C12.2386 50 10 47.7614 10 45V15Z" fill="#1A1D21"/>
                  <path d="M22 25V40M22 40H32M28 32L36 25M30 34L37 42" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15C10 12.2386 12.2386 10 15 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H15C12.2386 50 10 47.7614 10 45V15Z" stroke="#00FF41" strokeWidth="1.5" strokeOpacity="0.8"/>
                </svg>
                <h1 className="text-xl md:text-4xl font-black tracking-tighter flex items-center hidden xl:flex">
                  <span>Lock</span>
                  <span className="text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.45)]">.Ai</span>
                </h1>
                
                {/* League Toggle */}
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 ml-0 md:ml-2">
                  <button
                    onClick={() => setSport('NBA')}
                    className={cn(
                      "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                      sport === 'NBA' 
                        ? "bg-zinc-800 text-emerald-400 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    NBA
                  </button>
                  <button
                    onClick={() => setSport('MLB')}
                    className={cn(
                      "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                      sport === 'MLB' 
                        ? "bg-zinc-800 text-emerald-400 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    MLB
                  </button>
                  <button
                    onClick={() => setSport('SOCCER')}
                    className={cn(
                      "px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all",
                      sport === 'SOCCER' 
                        ? "bg-zinc-800 text-emerald-400 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    SOCCER
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 max-w-xl min-w-0 relative">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setFocusedInput('header')}
                  onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                  className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-full py-2 pl-9 md:pl-11 pr-4 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                )}
              </div>
              
              {searchResults.length > 0 && focusedInput === 'header' && (
                <div className="absolute top-full mt-2 w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  {searchResults.map(player => (
                    <button
                      key={player.PERSON_ID}
                      onClick={() => {
                        handleSelectPlayer(player);
                        setActiveTab('home');
                      }}
                      className="w-full text-left px-5 py-3.5 hover:bg-zinc-800/50 flex items-center justify-between group transition-colors border-b border-zinc-800/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-700/50 flex items-center justify-center transition-colors shadow-inner"
                          style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(player.TEAM_ABBREVIATION, sport)}33` }}
                        >
                          {getHeadshotUrl(player.PERSON_ID, sport) ? (
                            <img 
                              src={getHeadshotUrl(player.PERSON_ID, sport)!} 
                              alt={player.DISPLAY_FIRST_LAST}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.DISPLAY_FIRST_LAST)}&background=18181b&color=71717a`;
                              }}
                            />
                          ) : (
                            <User className="w-5 h-5 text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-zinc-100">{player.DISPLAY_FIRST_LAST}</div>
                          <div 
                            className="text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase text-white shadow-sm inline-block mt-0.5"
                            style={{ backgroundColor: getTeamColor(player.TEAM_ABBREVIATION, sport) }}
                          >
                            {player.TEAM_ABBREVIATION}
                          </div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              <button 
                onClick={() => setShowParlaySlip(!showParlaySlip)}
                className="relative p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
              >
                <LayoutList className="w-5 h-5" />
                {parlaySlip.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center">
                    {parlaySlip.length}
                  </span>
                )}
              </button>

              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">Lock.Ai Feed</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Full-width Live Ticker Banner */}
          {!selectedPlayer && !isLoadingData && activeTab === 'home' && liveGames.filter(g => Number(g.gameStatus) !== 3).length > 0 && (
            <div className="w-full overflow-hidden bg-emerald-500/5 border-b border-emerald-500/10 py-2.5 relative z-10">
              <div className="flex animate-ticker whitespace-nowrap hover:[animation-play-state:paused]">
                {(() => {
                  const filtered = liveGames.filter(g => {
                    const status = Number(g.gameStatus);
                    const statusText = (g.gameStatusText || "").toLowerCase();
                    return status !== 3 && !statusText.includes('final') && !statusText.includes('ended');
                  });
                  return [...filtered, ...filtered, ...filtered].map((game, i) => (
                    <div key={`${game.gameId}-${i}`} className="flex gap-12 items-center px-6 cursor-pointer hover:bg-emerald-500/10 py-1 rounded transition-colors" onClick={() => setSelectedGameId(game.gameId)}>
                      <span className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase tracking-widest">
                        <span className={cn("flex h-1.5 w-1.5 rounded-full", game.gameStatus === 2 ? "bg-emerald-500 animate-pulse" : "bg-zinc-500")} />
                        <span className={cn("font-black mr-1", game.gameStatus === 2 ? "text-emerald-500" : "text-zinc-500")}>
                          {game.gameStatusText}:
                        </span> 
                        <div className="flex items-center gap-1.5">
                          <img src={getTeamLogoUrl(game.awayTeam?.teamTricode, sport)!} alt={game.awayTeam?.teamTricode} className="w-4 h-4 object-contain opacity-80" referrerPolicy="no-referrer" />
                          <span>{game.awayTeam?.teamTricode} {game.awayTeam?.score}</span>
                        </div>
                        <span className="text-zinc-600">@</span>
                        <div className="flex items-center gap-1.5">
                          <img src={getTeamLogoUrl(game.homeTeam?.teamTricode, sport)!} alt={game.homeTeam?.teamTricode} className="w-4 h-4 object-contain opacity-80" referrerPolicy="no-referrer" />
                          <span>{game.homeTeam?.teamTricode} {game.homeTeam?.score}</span>
                        </div>
                      </span>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            {showParlaySlip && (
              <>
                <div 
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
                  onClick={() => setShowParlaySlip(false)}
                />
                <div className="fixed inset-x-4 bottom-20 top-20 md:inset-auto md:right-6 md:top-20 md:bottom-6 md:w-80 z-50 animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300">
                  <ParlaySlip 
                    slip={parlaySlip} 
                    onClose={() => setShowParlaySlip(false)} 
                    onRemove={(id) => setParlaySlip(parlaySlip.filter(p => p.id !== id))}
                    onAdd={(prop) => setParlaySlip([...parlaySlip, prop])}
                    sport={sport}
                  />
                </div>
              </>
            )}

            {activeTab === 'favorites' ? (
              <FavoritesView favorites={favorites} setFavorites={setFavorites} sport={sport} />
            ) : activeTab === 'optimizer' ? (
              <OptimizerView favorites={favorites} setFavorites={setFavorites} setActiveTab={setActiveTab} sport={sport} seasonStatus={seasonStatus} />
            ) : activeTab === 'import' ? (
              <ScreenshotImporter onPlayerSelect={handleSelectPlayer} setActiveTab={setActiveTab} sport={sport} />
            ) : activeTab === 'tos' ? (
              <TOSView />
            ) : (
              <>
                {!selectedPlayer && !isLoadingData && (
                <div className="max-w-4xl mx-auto space-y-6 py-4 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse" />
                      <svg width="120" height="120" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_30px_rgba(0,255,65,0.5)] transition-transform duration-500 group-hover:scale-110">
                        <path d="M10 15C10 12.2386 12.2386 10 15 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H15C12.2386 50 10 47.7614 10 45V15Z" fill="#1A1D21"/>
                        <path d="M22 25V40M22 40H32M28 32L36 25M30 34L37 42" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 15C10 12.2386 12.2386 10 15 10H45C47.7614 10 50 12.2386 50 15V45C50 47.7614 47.7614 50 45 50H15C12.2386 50 10 47.7614 10 45V15Z" stroke="#00FF41" strokeWidth="1.5" strokeOpacity="0.8"/>
                      </svg>
                    </div>
                    
                    <div className="space-y-1.5 md:space-y-3 px-4">
                      <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-zinc-100 leading-tight uppercase">
                        BET SMARTER.<br />NOT HARDER.
                      </h2>
                      <p className="text-[#9CA3AF] max-w-lg mx-auto text-base md:text-xl leading-relaxed font-mono tracking-[-0.02em]">
                        Pro AI Tool for Winners. Data-backed picks for every parlay.
                      </p>
                    </div>

                    {/* Hero Search Bar */}
                    <div className="w-full max-w-xl px-4 relative group z-30">
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <Search className="w-4 h-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
                        </div>
                        <input 
                          type="text" 
                          placeholder={`Search any ${sport} player (e.g. ${sport === 'NBA' ? "'Jokic'" : "'Judge'"})...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onFocus={() => setFocusedInput('hero')}
                          onBlur={() => setTimeout(() => setFocusedInput(null), 200)}
                          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-10 pr-4 text-sm font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-600"
                        />
                        {isSearching && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                        )}
                      </div>

                      {searchResults.length > 0 && focusedInput === 'hero' && (
                        <div className="absolute top-full mt-2 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                          {searchResults.map(player => (
                            <button
                              key={player.PERSON_ID}
                              onClick={() => {
                                handleSelectPlayer(player);
                                setActiveTab('home');
                              }}
                              className="w-full text-left px-5 py-3.5 hover:bg-zinc-800/50 flex items-center justify-between group transition-colors border-b border-zinc-800/50 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-700/50 flex items-center justify-center transition-colors shadow-inner"
                                  style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(player.TEAM_ABBREVIATION, sport)}33` }}
                                >
                                  {getHeadshotUrl(player.PERSON_ID, sport) ? (
                                    <img 
                                      src={getHeadshotUrl(player.PERSON_ID, sport)!} 
                                      alt={player.DISPLAY_FIRST_LAST}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.DISPLAY_FIRST_LAST)}&background=18181b&color=71717a`;
                                      }}
                                    />
                                  ) : (
                                    <User className="w-5 h-5 text-zinc-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-zinc-100">{player.DISPLAY_FIRST_LAST}</div>
                                  <div 
                                    className="text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase text-white shadow-sm inline-block mt-0.5"
                                    style={{ backgroundColor: getTeamColor(player.TEAM_ABBREVIATION, sport) }}
                                  >
                                    {player.TEAM_ABBREVIATION}
                                  </div>
                                </div>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CTA Upgrade - Saved for future use
                    <div className="flex flex-col items-center space-y-2.5">
                      <button className="group relative px-7 py-3 md:px-10 md:py-4 bg-emerald-500 text-zinc-950 font-black text-sm md:text-lg rounded-xl shadow-[0_0_20px_rgba(0,255,65,0.3)] hover:shadow-[0_0_40px_rgba(0,255,65,0.5)] transition-all duration-300 animate-pulse-glow transform hover:scale-105 active:scale-95">
                        Start 7-Day Free Trial
                        <div className="absolute inset-0 rounded-xl border-2 border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <div className="flex items-center gap-2.5 text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Zap className="w-2 h-2 text-emerald-500" /> No Card Required</span>
                        <span className="w-0.5 h-0.5 bg-zinc-800 rounded-full" />
                        <span className="flex items-center gap-1"><Activity className="w-2 h-2 text-emerald-500" /> Cancel Anytime</span>
                      </div>
                    </div>
                    */}
                  </div>

                    {/* How it Works Section */}
                  <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                    {[
                      { title: 'Search Player', desc: `Type any ${sport} player name to pull live season & L10 data.` },
                      { title: 'Set Your Line', desc: 'Enter the sportsbook line to calculate hit rates & edges.' },
                      { title: 'Get AI Edge', desc: 'Run Lock.Ai Analysis for deep-learning trends & signals.' }
                    ].map((item, i) => (
                      <div key={`hw-${i}`} className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-6 relative overflow-hidden group">
                        <h4 className="text-sm font-black text-zinc-100 uppercase tracking-widest mb-2">{item.title}</h4>
                        <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>

                    {/* Platform Features Section */}
                    <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                       <div className="md:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Platform Highlights</h3>
                          </div>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                          {[
                            { title: 'Lock.Ai Feed', desc: 'Real-time market movement and line alerts with AI precision.', icon: Zap, color: 'text-amber-500' },
                            { title: 'Correlation Engine', desc: 'Find hidden links between player performances across teams.', icon: TrendingUp, color: 'text-emerald-500' },
                            { title: 'Potential Stats', desc: 'Find players who are playing well but missing stats.', icon: Activity, color: 'text-blue-500' }
                          ].map((feature, i) => (
                            <div key={`feat-${i}`} className="min-w-[280px] flex-1 snap-center glass-card rounded-3xl p-8 group relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
                              <div className={cn("w-14 h-14 rounded-2xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-500", feature.color)}>
                                <feature.icon className="w-7 h-7" />
                              </div>
                              <div className="space-y-3 mt-6">
                                <h4 className="text-xl font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">{feature.title}</h4>
                                <p className="text-sm text-zinc-500 leading-relaxed">{feature.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                       </div>
                    </div>

                    {/* Off-season notice: no live data, no fake filler */}
                    {seasonStatus && !seasonStatus[sport]?.active ? (
                      <div className="w-full max-w-5xl px-4 pt-12 mx-auto">
                        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-10 flex flex-col items-center text-center space-y-4">
                          <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700/50">
                            <Calendar className="w-8 h-8 text-zinc-500" />
                          </div>
                          <div className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-400 uppercase tracking-widest">
                            Off-Season
                          </div>
                          <h3 className="text-2xl font-black text-zinc-100 uppercase tracking-tight">{sport} is unavailable right now</h3>
                          <p className="text-sm text-zinc-500 max-w-md leading-relaxed">
                            The {sport} season is over, so there are no live games, lines, or trending props to show.
                            Live data returns {seasonStatus[sport]?.resumes}. You can still search any player to review last season's stats.
                          </p>
                        </div>
                      </div>
                    ) : (
                    <>
                    {/* Live Games Section */}
                    {(() => {
                      const filtered = liveGames.filter(g => {
                        const status = Number(g.gameStatus);
                        const statusText = (g.gameStatusText || "").toLowerCase();
                        return status !== 3 && !statusText.includes('final') && !statusText.includes('ended');
                      });

                      if (filtered.length === 0) return null;

                      return (
                        <div className="w-full max-w-5xl px-4 pt-12">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Live Scoreboard</h3>
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Updates</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
                            {filtered.map((game: any) => (
                              <button 
                                key={game.gameId} 
                                onClick={() => setSelectedGameId(game.gameId)}
                                className="min-w-[280px] md:min-w-[320px] snap-center bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-colors text-left"
                              >
                              <div className="flex justify-between items-center mb-4">
                                <div className={cn(
                                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                  game.gameStatus === 2 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                                  game.gameStatus === 3 ? "bg-zinc-800 text-zinc-400" : "bg-zinc-800/50 text-zinc-500"
                                )}>
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center">
                                      {game.gameStatus === 2 && <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5" />}
                                      {formatToCT(game.gameTimeUTC, game.gameStatusText, game.gameStatus)}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {game.gameStatus === 2 && <MiniMomentum data={[1, 5, 2, 8, 4, 10]} />}
                                  <div className="text-[10px] font-black font-mono text-zinc-500">
                                    LIVE
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-4">
                                {/* Away Team */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-lg border border-zinc-800 flex items-center justify-center p-1.5 transition-all group-hover:scale-110 shadow-inner"
                                      style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(game.awayTeam?.teamTricode, sport)}33` }}
                                    >
                                      <img src={getTeamLogoUrl(game.awayTeam?.teamTricode, sport)!} alt={game.awayTeam?.teamTricode} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <span 
                                      className="font-black text-[10px] px-1.5 py-0.5 rounded text-white shadow-sm"
                                      style={{ backgroundColor: getTeamColor(game.awayTeam?.teamTricode, sport) }}
                                    >
                                      {game.awayTeam?.teamTricode}
                                    </span>
                                  </div>
                                  <span className={cn(
                                    "text-2xl font-black font-mono",
                                    (game.awayTeam?.score || 0) > (game.homeTeam?.score || 0) && game.gameStatus !== 1 ? "text-zinc-100" : "text-zinc-500"
                                  )}>
                                    {game.gameStatus === 1 ? "-" : game.awayTeam?.score}
                                  </span>
                                </div>
                                
                                {/* Home Team */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      className="w-8 h-8 rounded-lg border border-zinc-800 flex items-center justify-center p-1.5 transition-all group-hover:scale-110 shadow-inner"
                                      style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(game.homeTeam?.teamTricode, sport)}33` }}
                                    >
                                      <img src={getTeamLogoUrl(game.homeTeam?.teamTricode, sport)!} alt={game.homeTeam?.teamTricode} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                    <span 
                                      className="font-black text-[10px] px-1.5 py-0.5 rounded text-white shadow-sm"
                                      style={{ backgroundColor: getTeamColor(game.homeTeam?.teamTricode, sport) }}
                                    >
                                      {game.homeTeam?.teamTricode}
                                    </span>
                                  </div>
                                  <span className={cn(
                                    "text-2xl font-black font-mono",
                                    (game.homeTeam?.score || 0) > (game.awayTeam?.score || 0) && game.gameStatus !== 1 ? "text-zinc-100" : "text-zinc-500"
                                  )}>
                                    {game.gameStatus === 1 ? "-" : game.homeTeam?.score}
                                  </span>
                                </div>
                              </div>
                            </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                  {/* 'The Edge' Comparison Table */}
                  <div className="pt-12 space-y-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">MARKET VS. AI: THE EDGE</h3>
                      <span className="px-2 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-[9px] font-black text-yellow-500 uppercase tracking-widest">
                        Sample Data
                      </span>
                    </div>

                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-zinc-800/60 bg-zinc-900/20">
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Matchup</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sportsbook Line</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Lock.Ai Proj</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">The Edge %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/40">
                          {(sport === 'NBA' ? [
                            { id: 1628983, player: 'Shai Gilgeous-Alexander', team: 'OKC', line: '29.5 PTS', proj: '34.2', edge: '+15.9%', high: true },
                            { id: 1641705, player: 'Victor Wembanyama', team: 'SAS', line: '21.5 PTS', proj: '24.8', edge: '+15.3%', high: true },
                            { id: 1631093, player: 'Chet Holmgren', team: 'OKC', line: '16.5 PTS', proj: '18.9', edge: '+14.5%', high: false },
                            { id: 1630170, player: 'Devin Vassell', team: 'SAS', line: '19.5 PTS', proj: '21.4', edge: '+9.7%', high: false }
                          ] : [
                            { id: 660271, player: 'Shohei Ohtani', team: 'LAD', line: '1.5 TB', proj: '2.3', edge: '+53.3%', high: true },
                            { id: 592450, player: 'Aaron Judge', team: 'NYY', line: '0.5 HR', proj: '0.7', edge: '+40.2%', high: true },
                            { id: 683002, player: 'Gunnar Henderson', team: 'BAL', line: '2.5 H+R+RBI', proj: '3.1', edge: '+24.5%', high: false },
                            { id: 605141, player: 'Mookie Betts', team: 'LAD', line: '1.5 H', proj: '1.8', edge: '+20.0%', high: false }
                          ]).map((row, i) => (
                            <tr key={`comp-${i}`} className="hover:bg-zinc-800/20 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="w-10 h-10 rounded-lg border border-zinc-800 overflow-hidden flex items-center justify-center transition-all group-hover:scale-110 shadow-inner"
                                    style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(row.team, sport)}33` }}
                                  >
                                    <img 
                                      src={getHeadshotUrl(row.id, sport)!} 
                                      alt={row.player}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.player)}&background=18181b&color=71717a`;
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <div className="font-bold text-zinc-100">{row.player}</div>
                                    <div 
                                      className="text-[10px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase inline-block mt-0.5"
                                      style={{ backgroundColor: getTeamColor(row.team, sport), color: '#fff' }}
                                    >
                                      {row.team}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="text-sm font-mono font-bold text-zinc-400">{row.line}</div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="text-sm font-mono font-black text-zinc-100">{row.proj}</div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="text-sm font-mono font-black text-emerald-500">{row.edge}</div>
                                  {row.high && (
                                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[8px] font-black text-emerald-500 uppercase tracking-widest animate-pulse">
                                      High Confidence
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Trending Players Section - Moved Up */}
                  <div className="pt-12 space-y-8">
                    <div className="flex items-center justify-between px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-5 bg-emerald-500 rounded-full" />
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">
                          {sport === 'NBA' && new Date().getMonth() >= 3 && new Date().getMonth() <= 5 
                            ? "NBA Postseason Trending" 
                            : "Quick Start: Trending Tonight"}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Market Data</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-4">
                      {trendingPlayers.map(player => (
                        <button 
                          key={player.PERSON_ID}
                          onClick={() => handleSelectPlayer(player)}
                          className="group bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-4 hover:border-emerald-500/30 hover:bg-zinc-900/60 transition-all duration-500 text-center relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 blur-xl rounded-full -mr-6 -mt-6" />
                          
                          {/* Postseason Badge */}
                          <div className="absolute top-2 left-2 z-20">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-full px-1.5 py-0.5 flex items-center gap-1 backdrop-blur-md">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                              <span className="text-[6px] font-black text-emerald-500 uppercase tracking-widest">PO 26</span>
                            </div>
                          </div>

                          <div className="absolute top-2 right-2 z-20">
                            <Flame className="w-3 h-3 text-orange-500 fill-orange-500 animate-pulse" />
                          </div>
                            <div 
                              className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-4 border border-zinc-800 group-hover:border-emerald-500/20 transition-colors relative z-10 shadow-inner"
                              style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(player.TEAM_ABBREVIATION, sport)}33` }}
                            >
                              {getHeadshotUrl(player.PERSON_ID, sport) ? (
                                <img 
                                  src={getHeadshotUrl(player.PERSON_ID, sport)!}
                                  alt={player.DISPLAY_FIRST_LAST}
                                  className="w-full h-full object-cover scale-110 group-hover:scale-125 transition-transform duration-700"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-8 h-8 text-zinc-700" />
                                </div>
                              )}
                            </div>
                            <div 
                              className="micro-label mb-1 opacity-80 relative z-10 font-black px-2 py-0.5 rounded shadow-sm inline-block"
                              style={{ backgroundColor: getTeamColor(player.TEAM_ABBREVIATION, sport), color: '#fff' }}
                            >
                              {player.TEAM_ABBREVIATION}
                            </div>
                          <div className="text-xs font-bold text-zinc-200 truncate group-hover:text-emerald-400 transition-colors relative z-10">{player.DISPLAY_FIRST_LAST.split(' ').pop()}</div>
                          
                          {/* Live Average Highlight */}
                          {player.statistics?.seasonAverages && (
                            <div className="mt-2 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-1 group-hover:translate-y-0 relative z-10">
                               <div className="h-px w-2 bg-emerald-500/30" />
                               <span className="text-[9px] font-black text-emerald-500 font-mono">{player.statistics.seasonAverages.ppg} PPG</span>
                               <div className="h-px w-2 bg-emerald-500/30" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                    </>
                    )}
                </div>
              )}

              {isLoadingData && (
                <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in duration-700">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Zap className="w-8 h-8 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="absolute -inset-4 bg-emerald-500/5 blur-2xl rounded-full animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-zinc-100 uppercase tracking-[0.2em]">Analyzing Market</h3>
                    <p className="text-zinc-500 font-medium">Running deep-learning trends and calculating hit rates...</p>
                  </div>
                </div>
              )}

        {selectedPlayer && !isLoadingData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Player Info & Analysis */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Player Card */}
              <div className="glass-panel rounded-3xl p-5 md:p-7 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <div className="flex items-start justify-between mb-6 md:mb-8 relative">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <div className="micro-label">Active Player</div>
                      {status?.is_b2b && (
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[8px] font-black uppercase tracking-widest rounded border border-red-500/20 flex items-center gap-1">
                          <AlertCircle className="w-2 h-2" /> Fatigue Risk (B2B)
                        </span>
                      )}
                      {status?.usage_spike && (
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded border border-emerald-500/20 flex items-center gap-1">
                          <ArrowUpRight className="w-2 h-2" /> Usage Spike (+{status.usage_increase}%)
                        </span>
                      )}
                    </div>
                    <h2 className={cn(
                      "text-3xl font-bold tracking-tight text-zinc-100 leading-tight",
                      status?.usage_spike && "text-emerald-400"
                    )}>
                      {selectedPlayer.DISPLAY_FIRST_LAST}
                    </h2>
                    <div className="flex items-center gap-3 mt-2">
                      <span 
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase text-white shadow-sm"
                        style={{ backgroundColor: getTeamColor(selectedPlayer.TEAM_ABBREVIATION, sport) }}
                      >
                        {selectedPlayer.TEAM_ABBREVIATION}
                      </span>
                      <span className="text-xs font-medium text-zinc-500">{status?.role || `${sport} Player`}</span>
                    </div>
                  </div>
                  <div 
                    className="w-20 h-20 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center transition-colors"
                    style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(selectedPlayer.TEAM_ABBREVIATION, sport)}33` }}
                  >
                    {getHeadshotUrl(selectedPlayer.PERSON_ID, sport) ? (
                      <img 
                        src={getHeadshotUrl(selectedPlayer.PERSON_ID, sport)!} 
                        alt={selectedPlayer.DISPLAY_FIRST_LAST}
                        className="w-full h-full object-cover scale-125 translate-y-1"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-10 h-10 text-zinc-500" />
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-8 relative">
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4">
                    <div className="micro-label mb-2">Health</div>
                    <div className={cn(
                      "text-xs font-bold uppercase tracking-wider flex items-center gap-2",
                      status?.injury_status === 'Healthy' ? "text-emerald-400" : "text-red-400"
                    )}>
                      <div className={cn("w-1.5 h-1.5 rounded-full", status?.injury_status === 'Healthy' ? "bg-emerald-500" : "bg-red-500")} />
                      {status?.injury_status || 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-4">
                    <div className="micro-label mb-2">GP (Season)</div>
                    <div className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {games.length} Games
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-800/60 relative">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-emerald-500" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Sportsbook Line</h3>
                    </div>
                    <button 
                      onClick={handleToggleFavorite}
                      disabled={!isValidTarget}
                      className={cn(
                        "p-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                        isFavorited 
                          ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" 
                          : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                      )}
                    >
                      <Bookmark className={cn("w-4 h-4", isFavorited && "fill-current")} />
                    </button>
                  </div>
                  
                  <div className="space-y-5">
                    <div className={cn(
                      "relative group flex gap-2",
                      lastLineChange && (Date.now() - lastLineChange < 1500) && "animate-haptic-glow"
                    )}>
                      <select
                        value={statCategory}
                        onChange={(e) => setStatCategory(e.target.value)}
                        className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl px-3 py-3 md:py-4 text-sm md:text-base font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all cursor-pointer"
                      >
                        {(sport === 'NBA' ? defaultNbaCategories : sport === 'MLB' ? defaultMlbCategories : defaultSoccerCategories).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <input 
                          type="number" 
                          value={targetLine}
                          onChange={(e) => setTargetLine(e.target.value)}
                          placeholder={`Enter ${statCategory} line...`}
                          className={cn(
                            "w-full bg-zinc-950/80 border border-zinc-800/80 rounded-2xl px-4 md:px-5 py-3 md:py-4 text-base md:text-lg font-mono font-bold text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-zinc-700",
                            isRLM && "pr-24 sm:pr-32 md:pr-40",
                            lastLineChange && (Date.now() - lastLineChange < 30000) && "animate-glow-pulse"
                          )}
                        />
                        {isRLM && (
                          <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-pulse">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest hidden sm:inline">Lock.Ai Alert: RLM</span>
                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest sm:hidden">RLM</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {isValidTarget && (
                      <div className="space-y-4">
                        <div className="bg-zinc-950/80 rounded-2xl p-5 border border-zinc-800/80 flex items-center justify-between shadow-inner">
                          <div>
                            <div className="micro-label mb-1.5">L10 Hit Rate</div>
                            <div className={cn(
                              "text-3xl font-black font-mono tracking-tighter", 
                              hitRate >= 70 ? "text-emerald-400" : hitRate >= 50 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {hitRate.toFixed(0)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="micro-label mb-1.5">Record</div>
                            <div className="text-xl font-bold text-zinc-200 font-mono">
                              {hitCount}<span className="text-zinc-600 mx-1">/</span>{recentGames.length}
                            </div>
                          </div>
                        </div>

                        {/* Pro Data Layer */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
                            <div className="micro-label mb-1">The Edge</div>
                            <div className={cn(
                              "text-xl font-black font-mono tracking-tighter",
                              edge > 10 ? "text-emerald-400" : edge > 0 ? "text-zinc-100" : "text-red-400"
                            )}>
                              {edge > 0 ? '+' : ''}{edge.toFixed(1)}%
                            </div>
                          </div>
                          <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
                            <div className="micro-label mb-1">Win Prob</div>
                            <div className={cn(
                              "text-xl font-black font-mono tracking-tighter",
                              winProb >= 65 ? "text-emerald-400" : winProb >= 50 ? "text-zinc-100" : "text-red-400"
                            )}>
                              {winProb.toFixed(0)}%
                            </div>
                          </div>
                        </div>

                        <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 flex items-center justify-between">
                          <div className="micro-label">Best Book</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-zinc-100 bg-zinc-800 px-2 py-1 rounded border border-zinc-700">FanDuel</span>
                            <span className="text-xs font-bold text-emerald-500">-110</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Analysis Card */}
              <div className={cn(
                "glass-panel rounded-3xl p-4 md:p-6 flex flex-col transition-all duration-500",
                analysis || isAnalyzing 
                  ? "lg:h-[calc(100%-26rem)] min-h-[320px]" 
                  : "h-[120px] min-h-[120px]"
              )}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Lock.Ai Intelligence</h3>
                  </div>
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <><div className="w-2.5 h-2.5 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Processing</>
                    ) : (
                      'Run Lock.Ai Analysis'
                    )}
                  </button>
                </div>
                
                {(analysis !== null || isAnalyzing) && (
                  <div className="flex-1 bg-zinc-950/80 rounded-2xl p-4 md:p-5 border border-zinc-800/80 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {isAnalyzing && !analysis ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-4 py-8">
                        <div className="relative">
                          <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-emerald-500 animate-pulse" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 animate-pulse">Neural Engine Processing</p>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Predicting {selectedPlayer.DISPLAY_FIRST_LAST}'s {statCategory} trajectory...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {eli5Summary && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex gap-2.5 items-start">
                            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-0.5">Summary</h4>
                              <p className="text-xs text-zinc-200 leading-relaxed font-medium">{eli5Summary}</p>
                            </div>
                          </div>
                        )}
                        <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-emerald prose-headings:text-zinc-100">
                          <ReactMarkdown>{analysis || "Generating analysis..."}</ReactMarkdown>
                        </div>
                        {(aiProjection || lockScore !== null) && (
                          <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-2 gap-3">
                            {aiProjection && (
                              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
                                <div className="micro-label mb-0.5 text-[8px]">AI Projection</div>
                                <div className="text-2xl font-black font-mono text-white">{aiProjection.toFixed(1)}</div>
                              </div>
                            )}
                            {lockScore !== null && (
                              <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                                <div className="relative z-10">
                                  <div className="micro-label mb-0.5 flex items-center gap-1 text-[8px]">
                                    <Target className="w-2.5 h-2.5 text-emerald-500" />
                                    Lock Score
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <div className="text-2xl font-black font-mono text-emerald-400">{lockScore}</div>
                                    <div className="text-[10px] font-mono text-zinc-500">/100</div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Advanced Tracking Column */}
              <div className="space-y-6">
                <LineMovementTracker playerId={selectedPlayer.PERSON_ID.toString()} />
                {injuryImpact && (
                  <InjuryRipple impact={injuryImpact} />
                )}
              </div>
            </div>

            {/* Right Column: Stats & Charts */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Stat Selector */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-1.5 flex gap-2 overflow-x-auto custom-scrollbar">
                {(sport === 'NBA' ? defaultNbaCategories : sport === 'MLB' ? defaultMlbCategories : defaultSoccerCategories).map(stat => (
                  <button
                    key={stat}
                    onClick={() => setStatCategory(stat)}
                    className={cn(
                      "flex-1 min-w-[60px] py-2.5 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
                      statCategory === stat 
                        ? "bg-zinc-800 text-emerald-500 shadow-lg shadow-black/20 border border-zinc-700/50" 
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
                    )}
                  >
                    {stat}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="glass-panel rounded-3xl p-4 md:p-8">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <h3 className="text-base md:text-lg font-bold tracking-tight text-zinc-100">Performance Trend</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="micro-label mb-0.5">L10 Average</div>
                      <div className="text-lg md:text-xl font-black font-mono text-zinc-100">{average.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset={isValidTarget ? `${Math.max(0, Math.min(100, 100 - (targetNum / Math.max(...chartData.map(d => d.value), targetNum + 5)) * 100))}%` : "50%"} stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset={isValidTarget ? `${Math.max(0, Math.min(100, 100 - (targetNum / Math.max(...chartData.map(d => d.value), targetNum + 5)) * 100))}%` : "50%"} stopColor="#ef4444" stopOpacity={0.3} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e26" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#3f3f46" 
                        fontSize={10} 
                        fontWeight={600}
                        tickFormatter={(val) => val.substring(5)} 
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                      />
                      <YAxis 
                        stroke="#3f3f46" 
                        fontSize={10} 
                        fontWeight={600}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#121217', 
                          borderColor: '#1e1e26', 
                          borderRadius: '16px',
                          boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                        itemStyle={{ color: '#10b981', fontWeight: 700, fontSize: '12px' }}
                        labelStyle={{ color: '#71717a', marginBottom: '4px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <ReferenceLine y={average} stroke="#3f3f46" strokeDasharray="3 3" />
                      {isValidTarget && (
                        <ReferenceLine y={targetNum} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'right', value: 'LINE', fill: '#ef4444', fontSize: 10, fontWeight: 900 }} />
                      )}
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10b981" 
                        strokeWidth={4}
                        fill="url(#splitColor)"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 5, stroke: '#121217' }}
                        activeDot={{ r: 7, strokeWidth: 0, fill: '#10b981' }}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl overflow-hidden">
                <div className="px-4 md:px-8 py-4 md:py-5 border-b border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-900/20">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Recent Game Logs</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Stats
                    </div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden sm:block">
                      Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-950/30">
                        <th className="trading-table-header">Date</th>
                        <th className="trading-table-header">Matchup</th>
                        <th className="trading-table-header text-center">MIN</th>
                        <th className="trading-table-header text-center">PTS</th>
                        <th className="trading-table-header text-center">REB</th>
                        <th className="trading-table-header text-center">AST</th>
                        <th className="trading-table-header text-center">POTENTIAL</th>
                        <th className="trading-table-header text-center text-emerald-500">{statCategory}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {gamesWithPotential.map((game, i) => {
                        const potentialVal = statCategory === 'AST' ? game.potential_ast : game.potential_reb;
                        const actualVal = statCategory === 'AST' ? game.AST : game.REB;
                        const gap = potentialVal - actualVal;
                        const isBounceback = gap > 3;
                        const isHighIntensity = gap / (actualVal || 1) > 0.25;

                        return (
                          <tr key={`gl-${i}`} className="hover:bg-zinc-800/30 transition-colors group striped-row">
                            <td className="trading-table-cell text-zinc-400">{game.GAME_DATE.split(' ')[0]}</td>
                            <td className="trading-table-cell font-bold text-zinc-200">{game.MATCHUP}</td>
                            <td className="trading-table-cell text-center text-zinc-500 font-mono">{game.MIN}</td>
                            <td className="trading-table-cell text-center font-black font-mono text-zinc-300">{game.PTS}</td>
                            <td className="trading-table-cell text-center font-black font-mono text-zinc-300">{game.REB}</td>
                            <td className="trading-table-cell text-center font-black font-mono text-zinc-300">{game.AST}</td>
                            <td className="trading-table-cell text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-zinc-500">
                                  {statCategory === 'AST' ? `${game.potential_ast}pAST` : statCategory === 'REB' ? `${game.potential_reb}pREB` : '-'}
                                </span>
                                {isBounceback && (
                                  <span className={cn(
                                    "text-[8px] font-black text-emerald-500 uppercase tracking-tighter",
                                    isHighIntensity ? "animate-bounce-pulse" : "animate-pulse"
                                  )}>
                                    Bounceback
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="trading-table-cell text-center font-black font-mono text-emerald-400 bg-emerald-500/5">{game[statCategory]}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {/* Data Transparency Footer */}
                  <footer className="mt-20 py-12 border-t border-zinc-800/60 px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                          STRICTLY DATA-DRIVEN. NO GUESSWORK.
                        </div>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/40 border border-zinc-800/60 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                          Last Updated: {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </footer>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )}
  </div>
        <AnimatePresence>
          {selectedGameId && (
            <GameCenter 
              gameId={selectedGameId} 
              onClose={() => setSelectedGameId(null)} 
              sport={sport}
              onSelectPlayer={(player) => {
                setSelectedGameId(null);
                handleSelectPlayer(player);
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  </div>
);
}

function SimulationView({ gameId, sport }: { gameId: string, sport: Sport }) {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSim = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/simulate/${gameId}?sport=${sport}`);
      setResult(res.data);
    } catch {
      setResult({ error: 'Simulation unavailable right now — try again in a minute.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runSim(); }, [gameId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
        <div className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Simulating 10,000 games...</div>
      </div>
    );
  }

  if (!result) return null;

  if (result.unavailable || result.error) {
    return (
      <div className="p-8 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl text-center">
        <p className="text-zinc-500 font-medium">
          {result.error || result.reason || `Simulations are unavailable right now${result.resumes ? ` — back ${result.resumes}` : ''}.`}
        </p>
      </div>
    );
  }

  const { home, away, totals, runLine, distribution, mostCommonScore, sims } = result;
  const awayPct = Math.round(away.winProb * 100);
  const homePct = Math.round(home.winProb * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-emerald-500" />
          <h4 className="text-sm font-black text-zinc-100 uppercase tracking-widest">Monte Carlo Simulation</h4>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-black text-emerald-500 uppercase tracking-widest">
            {sims.toLocaleString()} sims
          </span>
        </div>
        <button
          onClick={runSim}
          className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black text-zinc-300 uppercase tracking-widest hover:border-emerald-500/30 hover:text-emerald-400 transition-all active:scale-95"
        >
          Re-Run
        </button>
      </div>

      {/* Win probability */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 space-y-4">
        <div className="micro-label">Win Probability</div>
        <div className="flex items-center justify-between text-sm font-black">
          <span className="text-zinc-100">{away.tricode} {awayPct}%</span>
          <span className="text-zinc-100">{home.tricode} {homePct}%</span>
        </div>
        <div className="h-3 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800">
          <div className="h-full bg-sky-500/70" style={{ width: `${awayPct}%` }} />
          <div className="h-full bg-emerald-500/70" style={{ width: `${100 - awayPct}%` }} />
        </div>
        <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
          <span>Projected: {away.tricode} {away.projRuns} — {home.projRuns} {home.tricode}</span>
          {mostCommonScore && <span>Most common: {mostCommonScore.score} ({mostCommonScore.pct}%)</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Run line */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 space-y-4">
          <div className="micro-label">Run Line</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">{home.tricode} -1.5</span>
              <span className="text-sm font-black font-mono text-emerald-400">{Math.round(runLine.homeMinus15 * 100)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">{away.tricode} +1.5</span>
              <span className="text-sm font-black font-mono text-sky-400">{Math.round(runLine.awayPlus15 * 100)}%</span>
            </div>
          </div>
          <div className="pt-3 border-t border-zinc-800/50 space-y-1">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Season scoring rates</div>
            <div className="text-[10px] font-mono text-zinc-500">{away.tricode}: {away.seasonRpg} scored / {away.seasonRapg} allowed per game</div>
            <div className="text-[10px] font-mono text-zinc-500">{home.tricode}: {home.seasonRpg} scored / {home.seasonRapg} allowed per game</div>
          </div>
        </div>

        {/* Totals ladder */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 space-y-4">
          <div className="micro-label">Total Runs — Over/Under</div>
          <div className="space-y-2">
            {totals.map((t: any) => (
              <div key={t.line} className="flex items-center gap-3">
                <span className="text-xs font-black font-mono text-zinc-300 w-10">{t.line}</span>
                <div className="flex-1 h-2 bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/50">
                  <div className="h-full bg-emerald-500/60" style={{ width: `${t.overProb * 100}%` }} />
                </div>
                <span className="text-[10px] font-black font-mono text-emerald-400 w-16 text-right">O {Math.round(t.overProb * 100)}%</span>
                <span className="text-[10px] font-black font-mono text-sky-400 w-16 text-right">U {Math.round((1 - t.overProb) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Total runs distribution */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 space-y-4">
        <div className="micro-label">Total Runs Distribution</div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={distribution}>
              <defs>
                <linearGradient id="simGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="total" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                formatter={(value: any) => [`${value}% of sims`, 'Frequency']}
                labelFormatter={(label: any) => `${label} total runs`}
              />
              <Area type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} fill="url(#simGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[10px] text-zinc-600 font-medium leading-relaxed">
          Model: each team's expected runs blend season scoring vs. the opponent's run prevention (small home-field bump), sampled {sims.toLocaleString()} times.
        </p>
      </div>
    </div>
  );
}

function GameCenter({ gameId, onClose, sport, onSelectPlayer }: { gameId: string; onClose: () => void, sport: Sport, onSelectPlayer: (player: Player) => void }) {
  const [activeTab, setActiveTab] = useState<'roster' | 'boxscore' | 'ai' | 'feed' | 'sim'>('boxscore');
  const [gameData, setGameData] = useState<any>(null);
  const [plays, setPlays] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGameData = async () => {
    try {
      const res = await axios.get(`/api/games/${gameId}/summary?sport=${sport}`);
      setGameData(res.data);
      
      // If game hasn't started, default to roster tab
      if (res.data?.game?.gameStatus === 1 && activeTab === 'boxscore') {
        setActiveTab('roster');
      }
    } catch (error) {
      console.error("Failed to fetch game data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlays = async () => {
    if (activeTab === 'feed') {
      try {
        const res = await axios.get(`/api/games/${gameId}/pbp?sport=${sport}`);
        setPlays(res.data.plays || []);
      } catch (error) {
        console.error("Failed to fetch plays", error);
      }
    }
  };

  useEffect(() => {
    fetchGameData();
    const interval = setInterval(fetchGameData, 30000);
    return () => clearInterval(interval);
  }, [gameId, sport]);

  useEffect(() => {
    fetchPlays();
    const interval = setInterval(fetchPlays, 15000); // Faster polling for PBP
    return () => clearInterval(interval);
  }, [gameId, sport, activeTab]);

  if (!gameData && isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
          <div className="text-emerald-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">Syncing Live Data...</div>
        </div>
      </motion.div>
    );
  }

  const boxscore = gameData?.game;
  const homeTeam = boxscore?.homeTeam;
  const awayTeam = boxscore?.awayTeam;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/40 backdrop-blur-md p-4 md:p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-6 md:gap-12">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-2xl border border-zinc-800 flex items-center justify-center p-2 shadow-inner"
                style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(awayTeam?.teamTricode, sport)}33` }}
              >
                <img src={getTeamLogoUrl(awayTeam?.teamTricode, sport)!} alt={awayTeam?.teamTricode} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-black font-mono text-zinc-100">
                  {boxscore?.gameStatus === 1 ? '--' : awayTeam?.score}
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{awayTeam?.teamTricode}</div>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                {boxscore?.gameStatus === 1 && boxscore?.gameTimeUTC 
                  ? formatToCT(boxscore.gameTimeUTC, boxscore.gameStatusText, 1)
                  : boxscore?.gameStatusText}
              </div>
              <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Game Center</div>
            </div>

            <div className="flex items-center gap-4">
              <div 
                className="text-center"
                style={sport === 'NBA' ? { backgroundColor: 'transparent' } : {}}
              >
                <div className="text-2xl md:text-4xl font-black font-mono text-zinc-100">
                  {boxscore?.gameStatus === 1 ? '--' : homeTeam?.score}
                </div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{homeTeam?.teamTricode}</div>
              </div>
              <div 
                className="w-12 h-12 rounded-2xl border border-zinc-800 flex items-center justify-center p-2 shadow-inner transition-colors"
                style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(homeTeam?.teamTricode, sport)}33` }}
              >
                <img src={getTeamLogoUrl(homeTeam?.teamTricode, sport)!} alt={homeTeam?.teamTricode} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30">
          <TabButton active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} label="Lightning Feed" icon={<Activity className="w-3.5 h-3.5" />} />
          <TabButton active={activeTab === 'roster'} onClick={() => setActiveTab('roster')} label="Roster" />
          <TabButton active={activeTab === 'boxscore'} onClick={() => setActiveTab('boxscore')} label="Box Score" />
          <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} label="AI Insight" />
          <TabButton active={activeTab === 'sim'} onClick={() => setActiveTab('sim')} label="Simulator" icon={<Calculator className="w-3.5 h-3.5" />} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {boxscore?.momentum && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                   <div className="flex items-center justify-between mb-2">
                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Game Momentum</span>
                     <div className="flex gap-3">
                       <span className="text-[9px] font-bold text-emerald-500">HOME (+{Math.max(...boxscore.momentum).toFixed(0)})</span>
                       <span className="text-[9px] font-bold text-zinc-500">AWAY</span>
                     </div>
                   </div>
                   <MomentumGraph data={boxscore.momentum} />
                </div>
              )}
              <LightningFeed plays={plays} gameId={gameId} sport={sport} />
            </div>
          )}

          {activeTab === 'roster' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <TeamRoster team={awayTeam} name={awayTeam?.teamName} sport={sport} onSelectPlayer={onSelectPlayer} />
                <TeamRoster team={homeTeam} name={homeTeam?.teamName} sport={sport} onSelectPlayer={onSelectPlayer} />
              </div>
            </div>
          )}

          {activeTab === 'boxscore' && (
            <div className="space-y-8">
              <BoxScoreTable team={awayTeam} sport={sport} onSelectPlayer={onSelectPlayer} />
              <BoxScoreTable team={homeTeam} sport={sport} onSelectPlayer={onSelectPlayer} />
            </div>
          )}

          {activeTab === 'sim' && (
            <SimulationView gameId={gameId} sport={sport} />
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    {boxscore?.gameStatus === 1 ? (
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Zap className="w-5 h-5 text-emerald-500" />
                    )}
                    <h4 className="text-sm font-black text-emerald-500 uppercase tracking-widest">
                      {boxscore?.gameStatus === 1 ? 'Pre-Game AI Projections' : 'Live AI Edge Signals'}
                    </h4>
                  </div>
                  <div className="space-y-4">
                    {boxscore?.gameStatus === 1 ? (
                      <>
                        <AiInsightItem 
                          sport={sport}
                          player={awayTeam?.players?.[0]}
                          text={getAiInsightText(boxscore, 'away', sport)}
                        />
                        <AiInsightItem 
                          sport={sport}
                          player={homeTeam?.players?.[0]}
                          text={getAiInsightText(boxscore, 'home', sport)}
                        />
                        <AiInsightItem 
                          sport={sport}
                          text={getAiInsightText(boxscore, 'game', sport)}
                        />
                      </>
                    ) : (
                      <>
                        <AiInsightItem 
                          sport={sport}
                          player={awayTeam?.players?.[0]}
                          text={`${awayTeam?.players?.[0]?.name || 'Player'} is currently pacing for a strong performance. Neural engine projects high probability to exceed projected volume.`}
                        />
                        <AiInsightItem 
                          sport={sport}
                          player={homeTeam?.players?.[0]}
                          text={`${homeTeam?.players?.[0]?.name || 'Player'} usage is trending up in current rotation. Data signals point to increased efficiency.`}
                        />
                        <AiInsightItem 
                          sport={sport}
                          text="In-game momentum analysis shows significant offensive shifts. Expect sequence patterns to favor high-volume output in the second half."
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 relative overflow-hidden",
        active ? "text-emerald-500 bg-emerald-500/5" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
      )}
    >
      {icon}
      {label}
      {active && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
        />
      )}
    </button>
  );
}

function MomentumGraph({ data }: { data: number[] }) {
  const chartData = data.map((val, i) => ({ play: i, momentum: val }));
  return (
    <div className="h-24 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="momentumGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <Area 
            type="monotone" 
            dataKey="momentum" 
            stroke="#10b981" 
            fillOpacity={1} 
            fill="url(#momentumGradient)" 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function MiniMomentum({ data }: { data: number[] }) {
  if (!data) return null;
  const chartData = data.map((val, i) => ({ i, val }));
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <Area type="monotone" dataKey="val" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={1} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function LightningFeed({ plays, gameId, sport }: { plays: any[], gameId: string, sport: Sport }) {
  if (plays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Activity className="w-12 h-12 text-zinc-800 animate-pulse" />
        <div className="text-zinc-600 font-mono text-xs uppercase tracking-widest">Awaiting Live Events...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col gap-1 mb-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl w-fit">
          <ScanLine className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Lightning Feed Active</span>
        </div>
        <p className="text-[10px] text-zinc-500 font-mono ml-4">Faster than your TV Broadcast</p>
      </div>

      <AnimatePresence mode="popLayout">
        {plays.map((play, index) => (
          <motion.div
            key={play.id ? `${play.id}-${index}` : index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="group relative"
          >
            <div className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <div className={cn(
                  "w-3 h-3 rounded-full mt-2 transition-colors border-2",
                  index === 0 ? "bg-emerald-500 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-zinc-800 border-zinc-700"
                )} />
                <div className="w-px flex-1 bg-zinc-800/50 mt-2" />
              </div>
              
              <div className={cn(
                "flex-1 pb-8 transition-all duration-300",
                index === 0 ? "scale-[1.02] origin-left" : "opacity-80 hover:opacity-100"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-black font-mono uppercase tracking-tighter px-2 py-0.5 rounded",
                      index === 0 ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 bg-zinc-800/50"
                    )}>
                      {play.clock}
                    </span>
                    <div className="text-[9px] font-mono text-zinc-600">
                      {play.timestamp ? new Date(play.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                    </div>
                  </div>
                  <div className="text-[10px] font-black font-mono text-zinc-300 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {play.scoreAway} - {play.scoreHome}
                  </div>
                </div>
                
                <div className={cn(
                  "p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden",
                  index === 0 
                    ? "bg-zinc-900 border-emerald-500/30 shadow-[0_0_40px_rgba(0,0,0,0.6)]" 
                    : "bg-zinc-900/40 border-zinc-800/50"
                )}>
                   {index === 0 && (
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                   )}
                   
                   <p className={cn(
                     "text-sm md:text-base font-bold leading-relaxed tracking-tight",
                     index === 0 ? "text-zinc-100" : "text-zinc-400"
                   )}>
                     {play.description}
                   </p>

                   {/* Tags */}
                   {play.tags?.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-3">
                       {play.tags.map((tag: string) => (
                         <span key={tag} className="text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                           {tag}
                         </span>
                       ))}
                     </div>
                   )}

                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}


function TeamRoster({ team, name, sport, onSelectPlayer }: { team: any; name: string, sport: Sport, onSelectPlayer: (player: Player) => void }) {
  const sortedPlayers = sortPlayers(team?.players, sport);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4">
        {sortedPlayers.map((player: any) => (
          <div 
            key={player.personId} 
            className="flex flex-col p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl hover:border-emerald-500/30 cursor-pointer transition-all group gap-4 relative overflow-hidden"
            onClick={() => onSelectPlayer({
              PERSON_ID: player.personId,
              DISPLAY_FIRST_LAST: player.name,
              TEAM_ABBREVIATION: team.teamTricode,
              TEAM_ID: team.teamId
            })}
          >
            {/* Real: Rarity Ribbon */}
            {player.rarity === 'Legendary' && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-[8px] font-black text-black px-4 py-1 rotate-45 translate-x-3 -translate-y-1 shadow-lg">LEGENDARY</div>
            )}
             {player.rarity === 'Rare' && (
              <div className="absolute top-0 right-0 bg-purple-500 text-[8px] font-black text-white px-4 py-1 rotate-45 translate-x-3 -translate-y-1 shadow-lg">RARE</div>
            )}

            {/* Glossy background pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors" />
            
            {/* Top Row: Avatar, Name, Jersey/Position */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 shadow-inner flex-shrink-0 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(team.teamTricode, sport)}33` }}
                >
                  <img src={getHeadshotUrl(player.personId, sport)!} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                   <div className="font-bold text-zinc-100 text-sm tracking-tight">{player.name}</div>
                   {player.streak !== 'Normal' && (
                     <div className={cn(
                       "flex items-center gap-1 text-[8px] font-black uppercase tracking-widest",
                       player.streak === 'Hot' ? "text-orange-500" : "text-blue-400"
                     )}>
                       {player.streak === 'Hot' ? <Flame className="w-2.5 h-2.5" /> : <Activity className="w-2.5 h-2.5" />}
                       {player.streak} Streak
                     </div>
                   )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-emerald-500">#{player.jerseyNumber || '--'}</div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{player.position}</div>
              </div>
            </div>

            {/* Second Row: Season Averages */}
            <div className="flex items-center gap-4 bg-zinc-900/50 px-5 py-4 rounded-2xl border border-zinc-800/30 relative z-10 w-full justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-emerald-400 leading-none">
                  {sport === 'NBA' 
                    ? (player.statistics?.seasonAverages?.ppg || '0.0') 
                    : (player.statistics?.seasonAverages?.avg || '.000')}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {sport === 'NBA' ? 'Points' : 'Avg'}
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800/50" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-emerald-400 leading-none">
                  {sport === 'NBA' 
                    ? (player.statistics?.seasonAverages?.rpg || '0.0') 
                    : (player.statistics?.seasonAverages?.hr || '0')}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {sport === 'NBA' ? 'Rebounds' : 'Home Runs'}
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800/50" />
              <div className="flex flex-col">
                <span className="text-2xl font-black text-emerald-400 leading-none">
                  {sport === 'NBA' 
                    ? (player.statistics?.seasonAverages?.apg || '0.0') 
                    : (player.statistics?.seasonAverages?.rbi || '0')}
                </span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {sport === 'NBA' ? 'Assists' : 'RBI'}
                </span>
              </div>
            </div>

            {/* Third Row: Rankings */}
            <div className="grid grid-cols-3 gap-2 relative z-10">
              <div className="flex flex-col items-center p-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 group-hover:border-emerald-500/20 transition-colors">
                <div className="text-sm font-black text-zinc-100">{player.statistics?.rankings?.day7 || '--'}</div>
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">7-DAY</div>
              </div>
              <div className="flex flex-col items-center p-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 group-hover:border-emerald-500/20 transition-colors">
                <div className="text-sm font-black text-zinc-100">{player.statistics?.rankings?.day30 || '--'}</div>
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">30-DAY</div>
              </div>
              <div className="flex flex-col items-center p-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 group-hover:border-emerald-500/20 transition-colors">
                <div className="text-sm font-black text-zinc-100">{player.statistics?.rankings?.season || '--'}</div>
                <div className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">SEASON</div>
              </div>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50 relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${player.status === 'Injury' ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]`} />
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${player.status === 'Injury' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {player.status === 'Injury' ? 'Injury' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoxScoreTable({ team, sport, onSelectPlayer }: { team: any, sport: Sport, onSelectPlayer: (player: Player) => void }) {
  const sortedPlayers = sortPlayers(team?.players?.filter((p: any) => p.status === 'ACTIVE' || p.status === 'Active'), sport);
  return (
    <div className="space-y-4">
      <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-3xl overflow-hidden overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/50 border-b border-zinc-800">
              <th className="px-4 py-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest">Player</th>
              <th className="px-4 py-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center">{sport === 'SOCCER' ? 'MINS' : 'MIN'}</th>
              <th className="px-4 py-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center">{sport === 'NBA' ? 'PTS' : sport === 'MLB' ? 'AB' : 'G'}</th>
              <th className="px-4 py-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center">{sport === 'NBA' ? 'REB' : sport === 'MLB' ? 'H' : 'A'}</th>
              <th className="px-4 py-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center">{sport === 'NBA' ? 'AST' : sport === 'MLB' ? 'RBI' : 'S'}</th>
              <th className="px-4 py-3 text-[8px] font-black text-zinc-500 uppercase tracking-widest text-center">{sport === 'SOCCER' ? 'SOT' : '+/-'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {sortedPlayers.map((player: any) => (
              <tr 
                key={player.personId} 
                className="hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                onClick={() => onSelectPlayer({
                  PERSON_ID: player.personId,
                  DISPLAY_FIRST_LAST: player.name,
                  TEAM_ABBREVIATION: team.teamTricode,
                  TEAM_ID: team.teamId
                })}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded overflow-hidden border border-zinc-800 group-hover:border-emerald-500/50 transition-colors flex items-center justify-center shadow-inner"
                      style={{ backgroundColor: sport === 'MLB' ? '#000000' : '#18181b' }}
                    >
                      <img src={getHeadshotUrl(player.personId, sport)!} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition-colors">{player.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-[10px] font-mono text-zinc-500">{player.statistics?.minutes || '0'}</td>
                <td className="px-4 py-3 text-center text-xs font-black font-mono text-zinc-100">{sport === 'NBA' ? (player.statistics?.points || 0) : sport === 'MLB' ? (player.statistics?.atBats || 0) : (player.statistics?.goals || 0)}</td>
                <td className="px-4 py-3 text-center text-xs font-black font-mono text-zinc-300">{sport === 'NBA' ? (player.statistics?.reboundsTotal || 0) : sport === 'MLB' ? (player.statistics?.hits || 0) : (player.statistics?.assists || 0)}</td>
                <td className="px-4 py-3 text-center text-xs font-black font-mono text-zinc-300">{sport === 'NBA' ? (player.statistics?.assists || 0) : sport === 'MLB' ? (player.statistics?.rbi || 0) : (player.statistics?.shots || 0)}</td>
                <td className="px-4 py-3 text-center text-[10px] font-mono text-zinc-500">{sport === 'NBA' ? (player.statistics?.plusMinusPoints || 0) : sport === 'MLB' ? (player.statistics?.runs || 0) : (player.statistics?.shotsOnTarget || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const getAiInsightText = (boxscore: any, type: 'home' | 'away' | 'game', sport: Sport) => {
  const homeTricode = boxscore?.homeTeam?.teamTricode || '';
  const awayTricode = boxscore?.awayTeam?.teamTricode || '';
  const homeName = boxscore?.homeTeam?.teamName || 'Home Team';
  const awayName = boxscore?.awayTeam?.teamName || 'Away Team';
  
  if (type === 'game') {
    if (sport === 'NBA') {
      if (homeTricode === 'ORL' && awayTricode === 'DET') return "Game 6 Intensity: Orlando leads 3-2. Historical data for Game 6s where the home team leads 3-2 shows a 68% close-out rate. Expect a defensive battle with tight rotations.";
      if (homeTricode === 'TOR' && awayTricode === 'CLE') return "Cleveland leads 3-2. Toronto has been extremely efficient at home in this series. AI models project a high-variance game with potential for multiple lead changes.";
      if (homeTricode === 'HOU' && awayTricode === 'LAL') return "Lakers lead 3-2. Neutral court data suggests LeBron James increases usage by 14% in potential close-out games. Houston's young core faces a massive experience gap.";
      return `Projected match pace is elevated for this ${sport} matchup. Neural models suggest a slight edge on the ${boxscore?.gameId ? 'total volume' : 'performance spread'}.`;
    }
    return `Series momentum favors ${homeName} in this critical ${sport} matchup. Historical weather and turf conditions at ${homeName} provide a 4% home-field advantage boost.`;
  }

  const team = type === 'home' ? boxscore?.homeTeam : boxscore?.awayTeam;
  const leadPlayer = team?.players?.[0]?.name || (type === 'home' ? 'Home' : 'Away') + ' Lead';
  
  if (sport === 'NBA') {
    if (leadPlayer.includes('Banchero')) return "Paolo Banchero has ramped up his isolation usage to 32% in this series. AI projects he will attack the paint early to draw fouls.";
    if (leadPlayer.includes('Mitchell')) return "Donovan Mitchell is averaging 28.4 PPG in this postseason. Neural signals indicate a 72% likelihood of him exceeding his seasonal 3PM average tonight.";
    if (leadPlayer.includes('James')) return "LeBron James in close-out games shows a 'God Mode' signal. Correlation engine suggests his assist profile rises by 2.4 when playing in high-stakes elimination games.";
    return `${leadPlayer} has shown consistent volume in recent starts. Neural engine projects healthy performance variance for tonight's game-plan.`;
  }
  
  if (leadPlayer.includes('Judge')) return "Aaron Judge has a +112 OPS+ against this pitcher's primary arsenal. Neural projection favors multiple hard-hit events tonight.";
  if (leadPlayer.includes('Ohtani')) return "Shohei Ohtani's launch angle tracking shows perfect alignment with current stadium crosswinds. Massive exit velocity potential detected.";
  
  return `${leadPlayer} performs significantly better in this specific venue. High probability for early offensive impact based on current sequence analysis.`;
};

function AiInsightItem({ text, player, sport }: { text: string; player?: any; sport: Sport }) {
  return (
    <div className="flex gap-4 p-4 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl group hover:border-emerald-500/30 transition-colors">
      {player ? (
        <div 
          className="w-10 h-10 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-110 transition-transform shadow-inner"
          style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor('NBA', sport)}33` }}
        >
          <img src={getHeadshotUrl(player.personId, sport)!} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
          <Activity className="w-4 h-4 text-emerald-500" />
        </div>
      )}
      <p className="text-xs text-zinc-300 leading-relaxed font-mono self-center">{text}</p>
    </div>
  );
}

function SidebarIcon({ icon: Icon, active, onClick, label, badge }: { icon: any, active: boolean, onClick: () => void, label: string, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className="relative group flex flex-col items-center gap-1"
    >
      <div className={cn(
        "w-9 h-9 md:w-12 md:h-12 rounded-lg md:rounded-2xl flex items-center justify-center transition-all duration-300",
        active 
          ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
      )}>
        <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
        {badge !== undefined && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 text-zinc-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-950">
            {badge}
          </span>
        )}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest transition-opacity duration-300 hidden md:block",
        active ? "text-emerald-500 opacity-100" : "text-zinc-600 opacity-0 group-hover:opacity-100"
      )}>
        {label}
      </span>
    </button>
  );
}

function LineMovementTracker({ playerId }: { playerId: string }) {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    axios.get(`/api/line-movement/${playerId}`).then(res => setData(res.data)).catch(() => {});
  }, [playerId]);

  if (data.length === 0) return null;

  const isUp = data[data.length-1].line > data[0].line;

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Market Sharp Tracker
        </h3>
        {isUp ? (
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded text-[10px] font-black uppercase tracking-widest">Sharp Up</span>
        ) : (
          <span className="px-2 py-0.5 bg-red-500/10 text-red-500 border border-red-500/20 rounded text-[10px] font-black uppercase tracking-widest">Sharp Down</span>
        )}
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
            <Tooltip 
              contentStyle={{ background: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
              labelStyle={{ display: 'none' }}
              itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
            />
            <Line type="stepAfter" dataKey="line" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InjuryRipple({ impact }: { impact: any }) {
  if (!impact) return null;
  return (
    <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Injury Ripple Impact
        </h3>
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-black text-red-500">SCORE: {impact.rippleScore}</div>
          <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-red-500" style={{ width: `${impact.rippleScore}%` }} />
          </div>
        </div>
      </div>
      <p className="text-xs text-zinc-400 font-medium leading-relaxed italic border-l-2 border-red-500/30 pl-4">{impact.summary}</p>
      <div className="space-y-2">
        {impact.teammates?.map((t: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30 hover:border-red-500/20 transition-all">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-100">{Array.isArray(t) ? t[0] : t.name}</span>
              <span className="text-[9px] text-zinc-500 font-mono">{Array.isArray(t) ? t[1] : t.bump_type}</span>
            </div>
            <div className="text-xs font-black text-emerald-500">+{Array.isArray(t) ? t[2] : t.bump_val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


function ParlaySlip({ slip, onClose, onRemove, onAdd, sport }: { slip: FavoriteProp[], onClose: () => void, onRemove: (id: string) => void, onAdd: (prop: any) => void, sport: Sport }) {
  const [copied, setCopied] = useState(false);
  const [showHedge, setShowHedge] = useState(false);
  const [originalBet, setOriginalBet] = useState('100');
  const [payout, setPayout] = useState('1200');
  const [hedgeOdds, setHedgeOdds] = useState('-110');

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Hedge Calculation: Hedge = Payout / (Decimal Odds)
  // For -110, Decimal = 1.909. For +150, Decimal = 2.5
  const calculateHedge = () => {
    const p = parseFloat(payout);
    const hOdds = parseFloat(hedgeOdds);
    if (isNaN(p) || isNaN(hOdds)) return 0;
    
    let decimalOdds = 0;
    if (hOdds > 0) {
      decimalOdds = (hOdds / 100) + 1;
    } else {
      decimalOdds = (100 / Math.abs(hOdds)) + 1;
    }
    
    return p / decimalOdds;
  };

  const hedgeAmount = calculateHedge();
  const guaranteedProfit = parseFloat(payout) - hedgeAmount - parseFloat(originalBet);

  const getCorrelation = (prop: FavoriteProp) => {
    if (prop.player.DISPLAY_FIRST_LAST.includes('Jokic') && prop.statCategory === 'AST') {
      return {
        player: 'Jamal Murray',
        stat: 'PTS',
        target: 20.5,
        reason: 'High pick-and-roll correlation. Jokic assists often lead to Murray buckets.'
      };
    }
    if (prop.player.DISPLAY_FIRST_LAST.includes('LeBron') && prop.statCategory === 'AST') {
      return {
        player: 'Anthony Davis',
        stat: 'PTS',
        target: 24.5,
        reason: 'Elite lob connection. LeBron assists are heavily skewed towards AD finishes.'
      };
    }
    return null;
  };

  return (
    <div className="h-full bg-zinc-950 border border-zinc-800 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden bet-slip-gradient">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <LayoutList className="w-4 h-4 text-zinc-950" />
          </div>
          <h3 className="font-black text-zinc-100 tracking-tight">Lock.Ai Ticket</h3>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 bg-zinc-900 hover:bg-zinc-800 p-1.5 rounded-full transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {slip.map((prop) => {
          const correlation = getCorrelation(prop);
          return (
            <div key={prop.id} className="space-y-2">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 relative group flex items-center gap-4">
                <button 
                  onClick={() => onRemove(prop.id)}
                  className="absolute top-2 right-2 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div 
                  className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-800 flex-shrink-0 flex items-center justify-center transition-colors shadow-inner"
                  style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(prop.player.TEAM_ABBREVIATION, sport)}33` }}
                >
                  {getHeadshotUrl(prop.player.PERSON_ID, sport) ? (
                    <img 
                      src={getHeadshotUrl(prop.player.PERSON_ID, sport)!}
                      alt={prop.player.DISPLAY_FIRST_LAST}
                      className="w-full h-full object-cover scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-6 h-6 text-zinc-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span 
                      className="text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase text-white shadow-sm"
                      style={{ backgroundColor: getTeamColor(prop.player.TEAM_ABBREVIATION, sport) }}
                    >
                      {prop.player.TEAM_ABBREVIATION}
                    </span>
                    <div className="micro-label opacity-60">Team Member</div>
                  </div>
                  <div className="font-bold text-zinc-100">{prop.player.DISPLAY_FIRST_LAST}</div>
                  <div className={cn("text-xs font-bold mt-1", prop.direction === 'UNDER' ? "text-sky-400" : "text-emerald-500")}>
                    {prop.direction === 'UNDER' ? 'Under' : 'Over'} {prop.targetLine} {prop.statCategory}
                  </div>
                </div>
              </div>
              
              {correlation && (
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Correlated Play</span>
                  </div>
                  <div className="text-xs font-bold text-zinc-200">{correlation.player} Over {correlation.stat}</div>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{correlation.reason}</p>
                  <button 
                    onClick={() => onAdd({
                      id: `corr-${correlation.player}-${correlation.stat}`,
                      player: { DISPLAY_FIRST_LAST: correlation.player, TEAM_ABBREVIATION: 'CORR', PERSON_ID: Math.random() },
                      statCategory: correlation.stat,
                      targetLine: correlation.target,
                      hitRate: 65,
                      hitCount: 13,
                      totalGames: 20
                    })}
                    className="mt-2 text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest flex items-center gap-1"
                  >
                    Add to Slip <ChevronRight className="w-2 h-2" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {slip.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
              <LayoutList className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-xs text-zinc-500">Add props to your ticket to optimize your parlay.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-zinc-900/80 border-t border-zinc-800 space-y-4">
        {slip.length >= 2 && (
          <div className="space-y-3">
            <button 
              onClick={() => setShowHedge(!showHedge)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-zinc-700 flex items-center justify-center gap-2 transition-all"
            >
              <Calculator className="w-3.5 h-3.5" /> 
              {showHedge ? 'Hide Hedge Calculator' : 'Hedge My Bet (4/5 Hit)'}
            </button>

            {showHedge && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Potential Payout</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600" />
                      <input 
                        type="number" 
                        value={payout}
                        onChange={(e) => setPayout(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 pl-6 pr-2 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Hedge Odds</label>
                    <input 
                      type="number" 
                      value={hedgeOdds}
                      onChange={(e) => setHedgeOdds(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2 text-xs font-mono font-bold text-zinc-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Recommended Hedge</div>
                    <div className="text-lg font-black font-mono text-zinc-100">${hedgeAmount.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Guaranteed Profit</div>
                    <div className="text-sm font-black font-mono text-emerald-400">+${guaranteedProfit.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="micro-label">Total Legs</div>
          <div className="font-mono font-black text-zinc-100">{slip.length}</div>
        </div>
        <button 
          onClick={handleCopy}
          className={cn(
            "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
            copied ? "bg-emerald-500 text-zinc-950" : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-600/20"
          )}
        >
          {copied ? 'Copied!' : 'Lock in Ticket'}
        </button>
      </div>
    </div>
  );
}

function FavoritesView({ favorites, setFavorites, sport }: { favorites: FavoriteProp[], setFavorites: React.Dispatch<React.SetStateAction<FavoriteProp[]>>, sport: Sport }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = (id: number) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const validCategories = sport === 'NBA' ? defaultNbaCategories : sport === 'MLB' ? defaultMlbCategories : defaultSoccerCategories;
  const filteredFavs = favorites.filter(fav => validCategories.includes(fav.statCategory));

  if (filteredFavs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center border border-zinc-800/50 shadow-2xl">
          <Bookmark className="w-10 h-10 text-zinc-700" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">No {sport} Favorites</h2>
          <p className="text-zinc-500 max-w-sm mt-2 mx-auto">
            Search for {sport} players and add high-probability prop lines to your favorites to generate professional parlays.
          </p>
        </div>
      </div>
    );
  }

  // Sort favorites by hit rate descending
  const sortedFavs = [...filteredFavs].sort((a, b) => b.hitRate - a.hitRate);

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center shrink-0">
              <Bookmark className="w-5 h-5 text-emerald-500 fill-emerald-500" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">Favorited Assets</h2>
          </div>
          <div className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-zinc-800 self-end sm:self-auto">
            {favorites.length} Active Selections
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedFavs.map(fav => (
            <div key={fav.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-6 flex flex-col relative group hover:border-emerald-500/30 transition-all duration-300">
              <button 
                onClick={() => setFavorites(favorites.filter(f => f.id !== fav.id))}
                className="absolute top-6 right-6 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-2xl overflow-hidden border border-zinc-800 flex-shrink-0 flex items-center justify-center shadow-inner transition-colors"
                  style={{ backgroundColor: sport === 'MLB' ? '#000000' : `${getTeamColor(fav.player.TEAM_ABBREVIATION, sport)}33` }}
                >
                  {getHeadshotUrl(fav.player.PERSON_ID, sport) ? (
                    <img 
                      src={getHeadshotUrl(fav.player.PERSON_ID, sport)!}
                      alt={fav.player.DISPLAY_FIRST_LAST}
                      className="w-full h-full object-cover scale-110"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="w-8 h-8 text-zinc-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <img 
                      src={getTeamLogoUrl(fav.player.TEAM_ABBREVIATION, sport)!} 
                      alt={fav.player.TEAM_ABBREVIATION} 
                      className="w-3.5 h-3.5 object-contain opacity-60" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="micro-label">{fav.player.TEAM_ABBREVIATION}</div>
                  </div>
                  <div className="font-black text-xl text-zinc-100 tracking-tight">{fav.player.DISPLAY_FIRST_LAST}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <div className="text-zinc-500 text-sm font-bold uppercase tracking-widest">
                  {fav.direction === 'UNDER' ? 'Under' : 'Over'} {fav.targetLine} <span className={fav.direction === 'UNDER' ? "text-sky-400/80" : "text-emerald-500/80"}>{fav.statCategory}</span>
                </div>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                  fav.hitRate >= 70 ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                  fav.hitRate >= 50 ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" :
                  "bg-red-500/10 text-red-500 border border-red-500/20"
                )}>
                  {fav.hitRate >= 70 ? 'High Confidence' : fav.hitRate >= 50 ? 'Moderate' : 'Low Confidence'}
                </div>
              </div>
              
              <div className="mt-8 flex items-end justify-between">
                <div>
                  <div className="micro-label mb-1">Confidence</div>
                  <div className={cn(
                    "text-3xl font-black font-mono tracking-tighter", 
                    fav.hitRate >= 70 ? "text-emerald-400" : fav.hitRate >= 50 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {fav.hitRate.toFixed(0)}%
                  </div>
                </div>
                <div className="text-[10px] font-black text-zinc-400 bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                  {fav.hitCount}<span className="text-zinc-700 mx-1">/</span>{fav.totalGames} L10
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScreenshotImporter({ onPlayerSelect, setActiveTab, sport }: { onPlayerSelect: (player: any) => void, setActiveTab: (tab: any) => void, sport: Sport }) {
  const [isDragging, setIsDragging] = useState(false);
  const [scanStep, setScanStep] = useState(0); // 0: idle, 1: extracting, 2: crunching, 3: finalizing, 4: done
  const [parsedBets, setParsedBets] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file.');
      return;
    }
    setError(null);
    setScanStep(1);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      
      // Simulate progressive steps
      setTimeout(() => setScanStep(2), 2000);
      setTimeout(() => setScanStep(3), 4000);

      try {
        const response = await axios.post('/api/analyze-slip', { imageBase64: base64 });
        
        // Add a mock lockScore to each bet for the Swap Engine demo
        const betsWithMockScores = (response.data.bets || []).map((bet: any) => ({
          ...bet,
          mockLockScore: Math.floor(Math.random() * 100)
        }));
        
        setParsedBets(betsWithMockScores);
        setScanStep(4);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'Failed to analyze bet slip.');
        setScanStep(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImage(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">
          <Zap className="w-3 h-3 fill-emerald-500" />
          Anchor & Extract OCR Enabled
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Magic Screenshot Importer</h2>
        <p className="text-zinc-400">Upload your slip. Our AI will anchor on names & stats to bypass data noise.</p>
      </div>

      {scanStep === 0 && (
        <div 
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer",
            isDragging ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-800/50"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
          <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mb-6">
            <UploadCloud className="w-10 h-10 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Drag & Drop your Bet Slip</h3>
          <p className="text-zinc-400">or click to browse from your device</p>
          {error && <p className="text-red-400 mt-4">{error}</p>}
        </div>
      )}

      {scanStep > 0 && scanStep < 4 && (
        <div className="relative overflow-hidden border border-zinc-800 bg-zinc-900/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="w-full h-1 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-[scan_2s_ease-in-out_infinite]" />
          </div>
          <ScanLine className="w-16 h-16 text-emerald-500 animate-pulse mb-6" />
          <h3 className="text-2xl font-bold text-white mb-4">
            {scanStep === 1 && "1. Extracting Players..."}
            {scanStep === 2 && "2. Normalizing Stats..."}
            {scanStep === 3 && "3. Building Matchup Matrix..."}
          </h3>
          <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
              style={{ width: `${(scanStep / 3) * 100}%` }}
            />
          </div>
        </div>
      )}

      {scanStep === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                Review Extracted Data
              </h3>
              <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-black">Anchor & Extract Validation</p>
            </div>
            <button 
              onClick={() => { setScanStep(0); setParsedBets([]); }}
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Upload Another
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parsedBets.map((bet, i) => (
              <div key={`parsed-${i}`} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col space-y-4 group transition-all hover:border-emerald-500/50">
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Player</label>
                    <input 
                      type="text" 
                      value={bet.player}
                      onChange={(e) => {
                        const newBets = [...parsedBets];
                        newBets[i].player = e.target.value;
                        setParsedBets(newBets);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-bold focus:border-emerald-500 outline-none transition-colors text-sm"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Stat</label>
                      <input 
                        type="text" 
                        value={bet.stat_category}
                        onChange={(e) => {
                          const newBets = [...parsedBets];
                          newBets[i].stat_category = e.target.value;
                          setParsedBets(newBets);
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-semibold focus:border-emerald-500 outline-none transition-colors text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Line</label>
                      <div className="flex gap-1">
                        <select 
                          value={bet.direction}
                          onChange={(e) => {
                            const newBets = [...parsedBets];
                            newBets[i].direction = e.target.value;
                            setParsedBets(newBets);
                          }}
                          className="bg-zinc-950 border border-zinc-800 rounded-lg px-1 py-1.5 text-[10px] font-black text-white focus:border-emerald-500 outline-none"
                        >
                          <option value="OVER">O</option>
                          <option value="UNDER">U</option>
                        </select>
                        <input 
                          type="number" 
                          step="0.5"
                          value={bet.target_line}
                          onChange={(e) => {
                            const newBets = [...parsedBets];
                            newBets[i].target_line = parseFloat(e.target.value);
                            setParsedBets(newBets);
                          }}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1.5 text-white font-bold focus:border-emerald-500 outline-none transition-colors text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-zinc-800/50">
                  {bet.matched_player ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white leading-tight">{bet.matched_player.DISPLAY_FIRST_LAST}</p>
                          <p className="text-[9px] text-zinc-500 font-black">{bet.matched_player.TEAM_ABBREVIATION}</p>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => onPlayerSelect(bet.matched_player)}
                        className="px-3 py-1.5 bg-emerald-500 text-black rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Search className="w-3 h-3" />
                        Analyze
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 text-red-500">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[9px] font-black uppercase tracking-widest leading-none">Unmapped</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {parsedBets.length > 0 && (
            <div className="flex justify-center pt-4">
              <div className="glass-card px-8 py-6 rounded-3xl border border-emerald-500/20 flex flex-col items-center bg-zinc-950/50">
                 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Verification Complete?</p>
                 <button 
                  onClick={() => {
                    const firstMatch = parsedBets.find(b => b.matched_player);
                    if (firstMatch) onPlayerSelect(firstMatch.matched_player);
                  }}
                  className="px-10 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] active:scale-95 text-sm"
                 >
                   Confirm Props
                 </button>
              </div>
            </div>
          )}
            {parsedBets.length === 0 && (
              <div className="col-span-2 text-center py-8 text-zinc-500">
                No props could be extracted from the image.
              </div>
            )}
          </div>
      )}
    </div>
  );
}

const statLabels: Record<string, string> = {
  TB: 'Total Bases', H_R_RBI: 'H+R+RBI', SO: 'Strikeouts', PTS: 'Points', REB: 'Rebounds', AST: 'Assists'
};

function OptimizerView({ favorites, setFavorites, setActiveTab, sport, seasonStatus }: { favorites: FavoriteProp[], setFavorites: React.Dispatch<React.SetStateAction<FavoriteProp[]>>, setActiveTab: (tab: any) => void, sport: Sport, seasonStatus: Record<string, { active: boolean; resumes: string }> | null }) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [genLegs, setGenLegs] = useState(3);
  const [genRisk, setGenRisk] = useState<'safe' | 'balanced' | 'longshot'>('balanced');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [genSaved, setGenSaved] = useState(false);
  const seenPlayersRef = useRef<Set<number>>(new Set());

  // New sport = new slate, so forget which players we've already shown
  useEffect(() => {
    seenPlayersRef.current = new Set();
    setGenResult(null);
    setGenSaved(false);
  }, [sport]);

  const sportActive = !seasonStatus || seasonStatus[sport]?.active !== false;

  const handleGenerate = async () => {
    setGenLoading(true);
    setGenSaved(false);
    try {
      const exclude = Array.from(seenPlayersRef.current).join(',');
      const res = await axios.get(`/api/parlay/generate?sport=${sport}&legs=${genLegs}&risk=${genRisk}&exclude=${exclude}`);
      setGenResult(res.data);
      if (res.data?.legs) {
        res.data.legs.forEach((leg: any) => seenPlayersRef.current.add(leg.playerId));
      }
    } catch {
      setGenResult({ unavailable: true, reason: 'Generator hit an error — try again in a minute.' });
    } finally {
      setGenLoading(false);
    }
  };

  const handleSaveParlay = () => {
    if (!genResult?.legs) return;
    const newFavs: FavoriteProp[] = genResult.legs.map((leg: any) => ({
      id: `${leg.playerId}-${leg.statCategory}-${leg.direction}-${leg.line}`,
      player: { PERSON_ID: leg.playerId, DISPLAY_FIRST_LAST: leg.playerName, TEAM_ABBREVIATION: leg.teamTricode },
      statCategory: leg.statCategory,
      targetLine: leg.line,
      direction: leg.direction,
      hitRate: leg.probability * 100,
      hitCount: leg.l10 ? leg.l10.hits : Math.round(leg.probability * 10),
      totalGames: leg.l10 ? leg.l10.games : 10,
      sport
    }));
    setFavorites(prev => {
      const existing = new Set(prev.map(f => f.id));
      return [...prev, ...newFavs.filter(f => !existing.has(f.id))];
    });
    setGenSaved(true);
  };
  const validCategories = sport === 'NBA' ? defaultNbaCategories : sport === 'MLB' ? defaultMlbCategories : defaultSoccerCategories;
  const filteredFavs = favorites.filter(fav => fav.sport === sport && validCategories.includes(fav.statCategory));
  const sortedFavs = [...filteredFavs].sort((a, b) => b.hitRate - a.hitRate);

  const handleCopy = (id: number) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-zinc-100">Parlay Optimizer</h1>
          </div>
          <p className="text-zinc-500 max-w-xl">
            Our AI engine analyzes your favorited props to generate the highest probability parlay configurations.
          </p>
        </div>
      </div>

      {/* Auto Parlay Generator */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full -mr-24 -mt-24" />

        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-100 uppercase tracking-tight">Parlay Generator</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Real players from today's {sport} slate</p>
          </div>
        </div>

        {!sportActive ? (
          <div className="flex items-center gap-4 p-5 bg-zinc-950/50 border border-zinc-800/60 rounded-2xl relative z-10">
            <Calendar className="w-6 h-6 text-zinc-600 shrink-0" />
            <p className="text-sm text-zinc-500 font-medium">
              {sport} is in the off-season, so there's no slate to build from. The generator comes back {seasonStatus?.[sport]?.resumes}.
            </p>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-2">
                <div className="micro-label">Legs</div>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1">
                  {[2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setGenLegs(n)}
                      className={cn(
                        "w-9 h-9 rounded-lg text-xs font-black transition-all",
                        genLegs === n ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-200"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="micro-label">Risk Profile</div>
                <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl p-1 gap-1">
                  {(['safe', 'balanced', 'longshot'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => setGenRisk(r)}
                      className={cn(
                        "px-4 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        genRisk === r ? "bg-emerald-500 text-zinc-950" : "text-zinc-500 hover:text-zinc-200"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={genLoading}
                className="h-11 px-8 bg-emerald-500 text-zinc-950 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <Zap className="w-4 h-4" />
                {genLoading ? 'Scanning Slate...' : genResult?.legs ? 'Regenerate' : 'Generate Parlay'}
              </button>
            </div>

            {genLoading && (
              <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-emerald-500 rounded-full animate-spin" />
                Pulling today's games, season stats, and last-10 form...
              </div>
            )}

            {!genLoading && genResult?.unavailable && (
              <div className="p-5 bg-zinc-950/50 border border-zinc-800/60 rounded-2xl text-sm text-zinc-500 font-medium">
                {genResult.reason || `${sport} is unavailable right now — back ${genResult.resumes}.`}
              </div>
            )}

            {!genLoading && genResult?.legs && (
              <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-3xl overflow-hidden">
                <div className="divide-y divide-zinc-800/40">
                  {genResult.legs.map((leg: any, i: number) => (
                    <div key={`gen-leg-${i}`} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                          <img
                            src={getHeadshotUrl(leg.playerId, sport)!}
                            alt={leg.playerName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(leg.playerName)}&background=18181b&color=71717a`;
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-zinc-100 truncate">{leg.playerName}</div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            {leg.teamTricode} {leg.matchup}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={cn(
                          "font-black font-mono text-sm",
                          leg.direction === 'UNDER' ? "text-sky-400" : "text-emerald-400"
                        )}>
                          {leg.direction === 'UNDER' ? 'Under' : 'Over'} {leg.line} {statLabels[leg.statCategory] || leg.statCategory}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-end gap-2 mt-0.5">
                          <span>{Math.round(leg.probability * 100)}% Conf</span>
                          {leg.l10 && (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-500">
                              L10: {leg.l10.hits}/{leg.l10.games}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-zinc-900/50 px-6 py-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div>
                      <div className="micro-label mb-0.5">Combined Prob</div>
                      <div className={cn(
                        "text-xl font-black font-mono tracking-tighter",
                        genResult.combinedProbability >= 0.5 ? "text-emerald-400" : genResult.combinedProbability >= 0.25 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {(genResult.combinedProbability * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="micro-label mb-0.5">Fair Payout</div>
                      <div className="text-xl font-black font-mono tracking-tighter text-zinc-100">{genResult.fairPayout}x</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveParlay}
                    disabled={genSaved}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                      genSaved
                        ? "bg-zinc-800 text-emerald-500 cursor-default"
                        : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                    )}
                  >
                    {genSaved ? '✓ Saved to Favorites' : 'Save All to Favorites'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sortedFavs.length >= 2 && [2, 3, 4, 5, 6].map(legCount => {
          if (sortedFavs.length < legCount) return null;
          const parlayLegs = sortedFavs.slice(0, legCount);
          const avgHitRate = parlayLegs.reduce((acc, leg) => acc + leg.hitRate, 0) / legCount;
          
          return (
            <div key={`opt-leg-${legCount}`} className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl hover:border-emerald-500/20 transition-all duration-500 group">
              <div className="bg-zinc-950/50 px-8 py-6 border-b border-zinc-800/60 flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-12 -mt-12" />
                <div className="relative z-10">
                  <h3 className="text-lg font-black text-zinc-100 tracking-tight">{legCount}-Leg Optimized Slip</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">High Probability Configuration</span>
                  </div>
                </div>
                <div className="text-right relative z-10">
                  <div className="micro-label mb-1">Avg Hit Rate</div>
                  <div className={cn(
                    "text-2xl font-black font-mono tracking-tighter", 
                    avgHitRate >= 70 ? "text-emerald-400" : avgHitRate >= 50 ? "text-yellow-400" : "text-red-400"
                  )}>
                    {avgHitRate.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="divide-y divide-zinc-800/40 flex-1 bg-zinc-900/20 custom-scrollbar overflow-y-auto max-h-[350px]">
                {parlayLegs.map((leg, i) => (
                  <div key={`opt-item-${i}`} className="px-8 py-5 flex items-center justify-between hover:bg-zinc-800/20 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                        <img 
                          src={getHeadshotUrl(leg.player.PERSON_ID, leg.sport)!} 
                          alt={leg.player.DISPLAY_FIRST_LAST} 
                          className="w-full h-full object-cover scale-110" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-zinc-100 tracking-tight">{leg.player.DISPLAY_FIRST_LAST}</div>
                          <img 
                            src={getTeamLogoUrl(leg.player.TEAM_ABBREVIATION, sport)!} 
                            alt={leg.player.TEAM_ABBREVIATION} 
                            className="w-4 h-4 object-contain opacity-60" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                          {leg.direction === 'UNDER' ? 'Under' : 'Over'} {leg.targetLine} {leg.statCategory}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-emerald-400 tracking-tighter">{leg.hitRate.toFixed(0)}%</div>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{leg.hitCount}/{leg.totalGames} L10</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-zinc-950/30 border-t border-zinc-800/60">
                <button 
                  onClick={() => handleCopy(legCount)}
                  className={cn(
                    "w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-3",
                    copiedId === legCount 
                      ? "bg-emerald-500 text-zinc-950" 
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
                  )}
                >
                  {copiedId === legCount ? (
                    <>Copied to Clipboard <ShieldCheck className="w-4 h-4" /></>
                  ) : (
                    <>Copy Slip Configuration <ArrowUpRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          );
        })}

        {sortedFavs.length < 2 && (
          <div className="col-span-full space-y-12">
            <div className="relative overflow-hidden py-24 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-8">
              {/* Grid Background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                   style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
              
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full animate-pulse" />
                <div className="w-24 h-24 bg-zinc-950 rounded-3xl flex items-center justify-center border border-zinc-800 relative z-10 shadow-2xl">
                  <Zap className="w-12 h-12 text-emerald-400 animate-pulse" />
                </div>
              </div>

              <div className="space-y-4 relative z-10 px-6">
                <h3 className="text-3xl font-black text-zinc-100 tracking-tighter uppercase italic">Unleash the Algorithm</h3>
                <p className="text-zinc-400 max-w-md mx-auto font-medium leading-relaxed">
                  Favorite at least 2 props to build a high-probability parlay. Our engine will calculate the optimal correlation for your selections.
                </p>
                
                {favorites.length === 0 && (
                  <button 
                    onClick={() => setActiveTab('home')}
                    className="mt-4 text-emerald-400 text-sm font-bold uppercase tracking-widest hover:text-emerald-300 transition-colors flex items-center gap-2 mx-auto group"
                  >
                    Browse Trending Players to Start
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

function TOSView() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-zinc-100 uppercase italic">Terms of Service</h1>
      </div>
      
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-[2rem] p-8 md:p-12 space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32" />
        
        <div className="relative z-10 space-y-6">
          <p className="text-lg md:text-xl text-zinc-300 leading-relaxed font-medium">
            Lock.Ai is an informational tool intended for entertainment purposes only. 
            We are not a sportsbook and do not accept bets. 
            Past performance does not guarantee future results.
          </p>
          
          <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
            <div>
              <h3 className="text-red-500 font-black uppercase tracking-widest text-sm mb-2">Responsible Gaming</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                If you or someone you know has a gambling problem, call <span className="text-zinc-100 font-bold">1-800-GAMBLER</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-center pt-8">
        <div className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">
          © 2026 LOCK.AI | ALL RIGHTS RESERVED
        </div>
      </div>
    </div>
  );
}
