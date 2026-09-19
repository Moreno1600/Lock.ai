export interface NflRosterPlayer {
  personId: number;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  jerseyNumber: string;
  status: 'Active' | 'Injury';
  starter: boolean;
  rarity?: 'Legendary' | 'Rare' | 'Standard';
  streak?: 'Hot' | 'Cold' | 'Normal';
  statistics: {
    passYds: number;
    rushYds: number;
    recYds: number;
    touchdowns: number;
    minutes: string;
    seasonAverages: {
      passYds?: string;
      passTd?: string;
      rushYds?: string;
      recYds?: string;
      rec?: string;
      td?: string;
      ppg?: string;
      cmp?: string;
    };
    rankings: {
      day7: string;
      day30: string;
      season: string;
    };
  };
}

export const NFL_TEAM_ROSTERS: Record<string, NflRosterPlayer[]> = {
  KC: [
    {
      personId: 3139477, name: "Patrick Mahomes", position: "QB", jerseyNumber: "15", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 285, rushYds: 22, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "278.4", passTd: "2.2", rushYds: "22.4", cmp: "24.5", td: "2.4" }, rankings: { day7: "1", day30: "2", season: "1" } }
    },
    {
      personId: 4429000, name: "Isiah Pacheco", position: "RB", jerseyNumber: "10", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 78, recYds: 22, touchdowns: 1, minutes: "45", seasonAverages: { rushYds: "74.6", td: "0.8", recYds: "21.4", rec: "2.8" }, rankings: { day7: "8", day30: "7", season: "8" } }
    },
    {
      personId: 3051889, name: "Kareem Hunt", position: "RB", jerseyNumber: "29", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 42, recYds: 12, touchdowns: 0, minutes: "25", seasonAverages: { rushYds: "48.2", td: "0.5", recYds: "14.0", rec: "1.8" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 4432708, name: "Rashee Rice", position: "WR", jerseyNumber: "4", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 86, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "82.4", rec: "6.8", td: "0.7" }, rankings: { day7: "6", day30: "5", season: "6" } }
    },
    {
      personId: 4685382, name: "Xavier Worthy", position: "WR", jerseyNumber: "1", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 14, recYds: 64, touchdowns: 1, minutes: "48", seasonAverages: { recYds: "58.2", rec: "4.2", td: "0.6", rushYds: "12.0" }, rankings: { day7: "16", day30: "18", season: "16" } }
    },
    {
      personId: 3121422, name: "JuJu Smith-Schuster", position: "WR", jerseyNumber: "9", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 38, touchdowns: 0, minutes: "32", seasonAverages: { recYds: "36.0", rec: "3.2", td: "0.3" }, rankings: { day7: "54", day30: "58", season: "55" } }
    },
    {
      personId: 15847, name: "Travis Kelce", position: "TE", jerseyNumber: "87", status: "Active", starter: true, rarity: "Legendary", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 78, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "74.2", rec: "6.8", td: "0.7" }, rankings: { day7: "8", day30: "10", season: "12" } }
    },
    {
      personId: 4426510, name: "Noah Gray", position: "TE", jerseyNumber: "83", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 24, touchdowns: 0, minutes: "28", seasonAverages: { recYds: "26.5", rec: "2.4", td: "0.2" }, rankings: { day7: "72", day30: "75", season: "74" } }
    },
    {
      personId: 3055899, name: "Harrison Butker", position: "K", jerseyNumber: "7", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.5", td: "0.0" }, rankings: { day7: "2", day30: "3", season: "2" } }
    }
  ],

  SF: [
    {
      personId: 4361741, name: "Brock Purdy", position: "QB", jerseyNumber: "13", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 265, rushYds: 12, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "265.8", passTd: "2.0", rushYds: "12.3", cmp: "21.8", td: "2.2" }, rankings: { day7: "6", day30: "7", season: "5" } }
    },
    {
      personId: 3117251, name: "Christian McCaffrey", position: "RB", jerseyNumber: "23", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 88, recYds: 44, touchdowns: 1, minutes: "55", seasonAverages: { rushYds: "84.2", recYds: "42.5", rec: "4.8", td: "1.2" }, rankings: { day7: "2", day30: "3", season: "2" } }
    },
    {
      personId: 4430737, name: "Jordan Mason", position: "RB", jerseyNumber: "24", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 46, recYds: 8, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "52.0", recYds: "9.5", rec: "1.2", td: "0.4" }, rankings: { day7: "22", day30: "24", season: "23" } }
    },
    {
      personId: 4047646, name: "Deebo Samuel", position: "WR", jerseyNumber: "1", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 24, recYds: 72, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "68.4", rushYds: "18.5", rec: "5.2", td: "0.8" }, rankings: { day7: "11", day30: "12", season: "10" } }
    },
    {
      personId: 4241389, name: "Brandon Aiyuk", position: "WR", jerseyNumber: "11", status: "Active", starter: true, rarity: "Rare", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 76, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "78.2", rec: "5.6", td: "0.6" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 3915416, name: "Jauan Jennings", position: "WR", jerseyNumber: "15", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 54, touchdowns: 0, minutes: "36", seasonAverages: { recYds: "51.0", rec: "4.1", td: "0.4" }, rankings: { day7: "32", day30: "35", season: "33" } }
    },
    {
      personId: 4683062, name: "Ricky Pearsall", position: "WR", jerseyNumber: "14", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 34, touchdowns: 0, minutes: "28", seasonAverages: { recYds: "38.5", rec: "3.0", td: "0.3" }, rankings: { day7: "62", day30: "66", season: "64" } }
    },
    {
      personId: 3040151, name: "George Kittle", position: "TE", jerseyNumber: "85", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 82, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "76.4", rec: "5.8", td: "0.8" }, rankings: { day7: "4", day30: "4", season: "4" } }
    },
    {
      personId: 4431520, name: "Jake Moody", position: "K", jerseyNumber: "4", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.2", td: "0.0" }, rankings: { day7: "6", day30: "7", season: "6" } }
    }
  ],

  BAL: [
    {
      personId: 3916387, name: "Lamar Jackson", position: "QB", jerseyNumber: "8", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 248, rushYds: 68, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "242.0", passTd: "2.0", rushYds: "58.5", cmp: "19.8", td: "2.8" }, rankings: { day7: "3", day30: "1", season: "3" } }
    },
    {
      personId: 3043078, name: "Derrick Henry", position: "RB", jerseyNumber: "22", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 112, recYds: 8, touchdowns: 1, minutes: "45", seasonAverages: { rushYds: "95.4", td: "1.1", recYds: "9.2", rec: "1.1" }, rankings: { day7: "5", day30: "4", season: "6" } }
    },
    {
      personId: 4242335, name: "Justice Hill", position: "RB", jerseyNumber: "43", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 22, recYds: 28, touchdowns: 0, minutes: "26", seasonAverages: { rushYds: "24.0", recYds: "26.5", rec: "3.1", td: "0.2" }, rankings: { day7: "38", day30: "40", season: "39" } }
    },
    {
      personId: 4429018, name: "Zay Flowers", position: "WR", jerseyNumber: "4", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 8, recYds: 84, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "79.8", rec: "6.2", td: "0.6", rushYds: "6.5" }, rankings: { day7: "9", day30: "8", season: "9" } }
    },
    {
      personId: 4361579, name: "Rashod Bateman", position: "WR", jerseyNumber: "7", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 52, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "48.6", rec: "3.8", td: "0.4" }, rankings: { day7: "34", day30: "36", season: "35" } }
    },
    {
      personId: 3116365, name: "Mark Andrews", position: "TE", jerseyNumber: "89", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 58, touchdowns: 1, minutes: "46", seasonAverages: { recYds: "56.4", rec: "4.6", td: "0.7" }, rankings: { day7: "12", day30: "14", season: "12" } }
    },
    {
      personId: 4429988, name: "Isaiah Likely", position: "TE", jerseyNumber: "80", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 46, touchdowns: 0, minutes: "34", seasonAverages: { recYds: "42.0", rec: "3.4", td: "0.5" }, rankings: { day7: "20", day30: "22", season: "20" } }
    },
    {
      personId: 15683, name: "Justin Tucker", position: "K", jerseyNumber: "9", status: "Active", starter: true, rarity: "Legendary", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.8", td: "0.0" }, rankings: { day7: "1", day30: "1", season: "1" } }
    }
  ],

  PHI: [
    {
      personId: 4040715, name: "Jalen Hurts", position: "QB", jerseyNumber: "1", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 235, rushYds: 44, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "235.4", passTd: "1.8", rushYds: "41.2", cmp: "20.4", td: "2.7" }, rankings: { day7: "7", day30: "8", season: "7" } }
    },
    {
      personId: 3929630, name: "Saquon Barkley", position: "RB", jerseyNumber: "26", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 124, recYds: 32, touchdowns: 1, minutes: "50", seasonAverages: { rushYds: "98.6", recYds: "26.4", rec: "3.2", td: "1.0" }, rankings: { day7: "4", day30: "5", season: "4" } }
    },
    {
      personId: 4241473, name: "Kenneth Gainwell", position: "RB", jerseyNumber: "14", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 26, recYds: 14, touchdowns: 0, minutes: "20", seasonAverages: { rushYds: "28.0", recYds: "16.2", rec: "2.1", td: "0.2" }, rankings: { day7: "44", day30: "46", season: "45" } }
    },
    {
      personId: 4047646, name: "A.J. Brown", position: "WR", jerseyNumber: "11", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 94, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "89.5", rec: "6.4", td: "0.8" }, rankings: { day7: "3", day30: "3", season: "3" } }
    },
    {
      personId: 4241478, name: "DeVonta Smith", position: "WR", jerseyNumber: "6", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 74, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "72.4", rec: "5.5", td: "0.6" }, rankings: { day7: "15", day30: "14", season: "15" } }
    },
    {
      personId: 4361421, name: "Jahan Dotson", position: "WR", jerseyNumber: "3", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 32, touchdowns: 0, minutes: "34", seasonAverages: { recYds: "34.0", rec: "2.8", td: "0.3" }, rankings: { day7: "58", day30: "60", season: "59" } }
    },
    {
      personId: 3121422, name: "Dallas Goedert", position: "TE", jerseyNumber: "88", status: "Active", starter: true, rarity: "Rare", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 54, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "58.2", rec: "4.8", td: "0.5" }, rankings: { day7: "10", day30: "11", season: "10" } }
    },
    {
      personId: 3917865, name: "Jake Elliott", position: "K", jerseyNumber: "4", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.4", td: "0.0" }, rankings: { day7: "5", day30: "5", season: "5" } }
    }
  ],

  BUF: [
    {
      personId: 3918298, name: "Josh Allen", position: "QB", jerseyNumber: "17", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 276, rushYds: 48, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "260.2", passTd: "2.1", rushYds: "42.0", cmp: "21.6", td: "3.0" }, rankings: { day7: "2", day30: "3", season: "2" } }
    },
    {
      personId: 4426515, name: "James Cook", position: "RB", jerseyNumber: "4", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 78, recYds: 34, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "74.8", recYds: "32.0", rec: "3.5", td: "0.9" }, rankings: { day7: "7", day30: "6", season: "7" } }
    },
    {
      personId: 4684999, name: "Ray Davis", position: "RB", jerseyNumber: "22", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 38, recYds: 12, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "36.4", recYds: "11.2", rec: "1.2", td: "0.4" }, rankings: { day7: "35", day30: "38", season: "36" } }
    },
    {
      personId: 4430755, name: "Khalil Shakir", position: "WR", jerseyNumber: "10", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 6, recYds: 76, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "71.5", rec: "5.8", td: "0.6" }, rankings: { day7: "18", day30: "16", season: "18" } }
    },
    {
      personId: 4685002, name: "Keon Coleman", position: "WR", jerseyNumber: "0", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 1, minutes: "45", seasonAverages: { recYds: "58.0", rec: "4.2", td: "0.5" }, rankings: { day7: "25", day30: "28", season: "26" } }
    },
    {
      personId: 3121434, name: "Curtis Samuel", position: "WR", jerseyNumber: "1", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 10, recYds: 34, touchdowns: 0, minutes: "32", seasonAverages: { recYds: "36.0", rec: "3.1", td: "0.3" }, rankings: { day7: "60", day30: "64", season: "62" } }
    },
    {
      personId: 4429990, name: "Dalton Kincaid", position: "TE", jerseyNumber: "86", status: "Active", starter: true, rarity: "Rare", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 58, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "54.2", rec: "5.1", td: "0.5" }, rankings: { day7: "11", day30: "12", season: "11" } }
    },
    {
      personId: 4241470, name: "Dawson Knox", position: "TE", jerseyNumber: "88", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 28, touchdowns: 0, minutes: "30", seasonAverages: { recYds: "24.5", rec: "2.2", td: "0.3" }, rankings: { day7: "68", day30: "72", season: "70" } }
    },
    {
      personId: 4242330, name: "Tyler Bass", position: "K", jerseyNumber: "2", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.1", td: "0.0" }, rankings: { day7: "8", day30: "9", season: "8" } }
    }
  ],

  HOU: [
    {
      personId: 4432577, name: "C.J. Stroud", position: "QB", jerseyNumber: "7", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 264, rushYds: 15, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "264.0", passTd: "2.0", rushYds: "15.0", cmp: "23.0", td: "2.2" }, rankings: { day7: "7", day30: "6", season: "7" } }
    },
    {
      personId: 3116385, name: "Joe Mixon", position: "RB", jerseyNumber: "28", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 84, recYds: 26, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "82.0", recYds: "24.5", rec: "3.0", td: "0.9" }, rankings: { day7: "9", day30: "10", season: "9" } }
    },
    {
      personId: 4429025, name: "Dameon Pierce", position: "RB", jerseyNumber: "31", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 34, recYds: 6, touchdowns: 0, minutes: "18", seasonAverages: { rushYds: "35.0", recYds: "8.0", rec: "1.0", td: "0.3" }, rankings: { day7: "42", day30: "45", season: "43" } }
    },
    {
      personId: 4361300, name: "Nico Collins", position: "WR", jerseyNumber: "12", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 98, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "94.6", rec: "6.8", td: "0.8" }, rankings: { day7: "2", day30: "2", season: "2" } }
    },
    {
      personId: 2976212, name: "Stefon Diggs", position: "WR", jerseyNumber: "1", status: "Active", starter: true, rarity: "Rare", streak: "Normal",
      statistics: { passYds: 0, rushYds: 4, recYds: 72, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "68.2", rec: "5.9", td: "0.6" }, rankings: { day7: "16", day30: "17", season: "16" } }
    },
    {
      personId: 4429995, name: "Tank Dell", position: "WR", jerseyNumber: "3", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 12, recYds: 66, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "64.0", rec: "4.8", td: "0.5", rushYds: "8.2" }, rankings: { day7: "22", day30: "20", season: "22" } }
    },
    {
      personId: 3915430, name: "Dalton Schultz", position: "TE", jerseyNumber: "86", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 48, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "46.5", rec: "4.2", td: "0.4" }, rankings: { day7: "18", day30: "20", season: "19" } }
    },
    {
      personId: 2977620, name: "Ka'imi Fairbairn", position: "K", jerseyNumber: "15", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.6", td: "0.0" }, rankings: { day7: "4", day30: "4", season: "4" } }
    }
  ],

  DET: [
    {
      personId: 3046779, name: "Jared Goff", position: "QB", jerseyNumber: "16", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 272, rushYds: 2, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "268.0", passTd: "2.1", rushYds: "2.4", cmp: "23.4", td: "2.3" }, rankings: { day7: "8", day30: "8", season: "8" } }
    },
    {
      personId: 4429015, name: "Jahmyr Gibbs", position: "RB", jerseyNumber: "26", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 86, recYds: 38, touchdowns: 1, minutes: "44", seasonAverages: { rushYds: "82.0", recYds: "36.4", rec: "4.2", td: "1.1" }, rankings: { day7: "3", day30: "3", season: "3" } }
    },
    {
      personId: 4038942, name: "David Montgomery", position: "RB", jerseyNumber: "5", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 72, recYds: 14, touchdowns: 1, minutes: "40", seasonAverages: { rushYds: "71.0", recYds: "15.0", rec: "1.8", td: "0.9" }, rankings: { day7: "12", day30: "11", season: "12" } }
    },
    {
      personId: 4374302, name: "Amon-Ra St. Brown", position: "WR", jerseyNumber: "14", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 88, touchdowns: 1, minutes: "56", seasonAverages: { recYds: "86.8", rec: "7.5", td: "0.7" }, rankings: { day7: "5", day30: "4", season: "4" } }
    },
    {
      personId: 4430005, name: "Jameson Williams", position: "WR", jerseyNumber: "9", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 8, recYds: 74, touchdowns: 1, minutes: "46", seasonAverages: { recYds: "68.4", rec: "4.1", td: "0.6", rushYds: "9.0" }, rankings: { day7: "17", day30: "19", season: "17" } }
    },
    {
      personId: 3040150, name: "Kalif Raymond", position: "WR", jerseyNumber: "11", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 4, recYds: 28, touchdowns: 0, minutes: "28", seasonAverages: { recYds: "26.0", rec: "2.2", td: "0.2" }, rankings: { day7: "75", day30: "78", season: "76" } }
    },
    {
      personId: 4429998, name: "Sam LaPorta", position: "TE", jerseyNumber: "87", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 64, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "62.5", rec: "5.2", td: "0.7" }, rankings: { day7: "5", day30: "6", season: "5" } }
    },
    {
      personId: 4361590, name: "Brock Wright", position: "TE", jerseyNumber: "89", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 18, touchdowns: 0, minutes: "24", seasonAverages: { recYds: "16.0", rec: "1.4", td: "0.2" }, rankings: { day7: "88", day30: "92", season: "90" } }
    },
    {
      personId: 4685020, name: "Jake Bates", position: "K", jerseyNumber: "39", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.5", td: "0.0" }, rankings: { day7: "5", day30: "6", season: "5" } }
    }
  ],

  GB: [
    {
      personId: 4038941, name: "Jordan Love", position: "QB", jerseyNumber: "10", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 258, rushYds: 14, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "258.4", passTd: "2.1", rushYds: "14.2", cmp: "22.4", td: "2.4" }, rankings: { day7: "8", day30: "9", season: "8" } }
    },
    {
      personId: 4047649, name: "Josh Jacobs", position: "RB", jerseyNumber: "8", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 92, recYds: 22, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "88.0", recYds: "20.5", rec: "2.8", td: "0.9" }, rankings: { day7: "6", day30: "6", season: "6" } }
    },
    {
      personId: 4361595, name: "Emanuel Wilson", position: "RB", jerseyNumber: "31", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 32, recYds: 8, touchdowns: 0, minutes: "20", seasonAverages: { rushYds: "34.0", recYds: "9.0", rec: "1.1", td: "0.3" }, rankings: { day7: "45", day30: "48", season: "46" } }
    },
    {
      personId: 4430010, name: "Jayden Reed", position: "WR", jerseyNumber: "11", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 18, recYds: 72, touchdowns: 1, minutes: "48", seasonAverages: { recYds: "68.5", rushYds: "16.0", rec: "5.1", td: "0.7" }, rankings: { day7: "13", day30: "12", season: "13" } }
    },
    {
      personId: 4361310, name: "Christian Watson", position: "WR", jerseyNumber: "9", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 64, touchdowns: 1, minutes: "44", seasonAverages: { recYds: "58.2", rec: "3.8", td: "0.6" }, rankings: { day7: "24", day30: "26", season: "25" } }
    },
    {
      personId: 4361315, name: "Romeo Doubs", position: "WR", jerseyNumber: "87", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 54, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "52.0", rec: "4.2", td: "0.4" }, rankings: { day7: "30", day30: "32", season: "31" } }
    },
    {
      personId: 4430015, name: "Dontayvion Wicks", position: "WR", jerseyNumber: "13", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 42, touchdowns: 0, minutes: "32", seasonAverages: { recYds: "41.5", rec: "3.2", td: "0.4" }, rankings: { day7: "48", day30: "50", season: "49" } }
    },
    {
      personId: 4430020, name: "Tucker Kraft", position: "TE", jerseyNumber: "85", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 56, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "52.4", rec: "4.4", td: "0.6" }, rankings: { day7: "9", day30: "10", season: "9" } }
    },
    {
      personId: 4430025, name: "Luke Musgrave", position: "TE", jerseyNumber: "88", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 26, touchdowns: 0, minutes: "28", seasonAverages: { recYds: "28.0", rec: "2.6", td: "0.2" }, rankings: { day7: "65", day30: "68", season: "66" } }
    },
    {
      personId: 3040160, name: "Brandon McManus", position: "K", jerseyNumber: "17", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.0", td: "0.0" }, rankings: { day7: "10", day30: "11", season: "10" } }
    }
  ],

  MIN: [
    {
      personId: 3912547, name: "Sam Darnold", position: "QB", jerseyNumber: "14", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 254, rushYds: 12, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "252.0", passTd: "2.0", rushYds: "12.0", cmp: "20.8", td: "2.2" }, rankings: { day7: "11", day30: "12", season: "11" } }
    },
    {
      personId: 3051890, name: "Aaron Jones", position: "RB", jerseyNumber: "33", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 82, recYds: 32, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "78.4", recYds: "30.0", rec: "3.6", td: "0.8" }, rankings: { day7: "10", day30: "9", season: "10" } }
    },
    {
      personId: 4361600, name: "Ty Chandler", position: "RB", jerseyNumber: "27", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 34, recYds: 10, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "35.0", recYds: "11.0", rec: "1.3", td: "0.3" }, rankings: { day7: "40", day30: "42", season: "41" } }
    },
    {
      personId: 4262921, name: "Justin Jefferson", position: "WR", jerseyNumber: "18", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 2, recYds: 112, touchdowns: 1, minutes: "58", seasonAverages: { recYds: "98.4", rec: "7.2", td: "0.7", rushYds: "2.1" }, rankings: { day7: "1", day30: "1", season: "1" } }
    },
    {
      personId: 4429030, name: "Jordan Addison", position: "WR", jerseyNumber: "3", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 68, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "64.0", rec: "4.5", td: "0.6" }, rankings: { day7: "20", day30: "21", season: "20" } }
    },
    {
      personId: 4361605, name: "Jalen Nailor", position: "WR", jerseyNumber: "83", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 38, touchdowns: 0, minutes: "32", seasonAverages: { recYds: "36.2", rec: "2.8", td: "0.4" }, rankings: { day7: "55", day30: "58", season: "56" } }
    },
    {
      personId: 4038945, name: "T.J. Hockenson", position: "TE", jerseyNumber: "87", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "64.5", rec: "5.8", td: "0.5" }, rankings: { day7: "6", day30: "7", season: "6" } }
    },
    {
      personId: 4685030, name: "Will Reichard", position: "K", jerseyNumber: "16", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.3", td: "0.0" }, rankings: { day7: "7", day30: "8", season: "7" } }
    }
  ],

  DAL: [
    {
      personId: 3122840, name: "Dak Prescott", position: "QB", jerseyNumber: "4", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 275, rushYds: 10, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "272.0", passTd: "2.2", rushYds: "10.5", cmp: "24.0", td: "2.4" }, rankings: { day7: "5", day30: "5", season: "5" } }
    },
    {
      personId: 4361610, name: "Rico Dowdle", position: "RB", jerseyNumber: "23", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 68, recYds: 24, touchdowns: 1, minutes: "44", seasonAverages: { rushYds: "65.0", recYds: "22.0", rec: "2.9", td: "0.6" }, rankings: { day7: "18", day30: "20", season: "18" } }
    },
    {
      personId: 3051895, name: "Ezekiel Elliott", position: "RB", jerseyNumber: "15", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 32, recYds: 8, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "34.0", recYds: "10.0", rec: "1.4", td: "0.4" }, rankings: { day7: "48", day30: "52", season: "50" } }
    },
    {
      personId: 4241389, name: "CeeDee Lamb", position: "WR", jerseyNumber: "88", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 8, recYds: 98, touchdowns: 1, minutes: "58", seasonAverages: { recYds: "92.6", rec: "7.8", td: "0.8", rushYds: "5.4" }, rankings: { day7: "3", day30: "2", season: "3" } }
    },
    {
      personId: 3116390, name: "Brandin Cooks", position: "WR", jerseyNumber: "3", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 54, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "50.5", rec: "3.8", td: "0.5" }, rankings: { day7: "35", day30: "38", season: "36" } }
    },
    {
      personId: 4241480, name: "Jalen Tolbert", position: "WR", jerseyNumber: "1", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 46, touchdowns: 1, minutes: "38", seasonAverages: { recYds: "44.0", rec: "3.4", td: "0.4" }, rankings: { day7: "42", day30: "45", season: "43" } }
    },
    {
      personId: 4361615, name: "Jake Ferguson", position: "TE", jerseyNumber: "87", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 0, minutes: "50", seasonAverages: { recYds: "58.4", rec: "5.4", td: "0.5" }, rankings: { day7: "8", day30: "9", season: "8" } }
    },
    {
      personId: 4685040, name: "Brandon Aubrey", position: "K", jerseyNumber: "17", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "9.2", td: "0.0" }, rankings: { day7: "1", day30: "1", season: "1" } }
    }
  ],

  CIN: [
    {
      personId: 3915511, name: "Joe Burrow", position: "QB", jerseyNumber: "9", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 282, rushYds: 8, recYds: 0, touchdowns: 3, minutes: "60", seasonAverages: { passYds: "274.5", passTd: "2.3", rushYds: "11.2", cmp: "25.1", td: "2.5" }, rankings: { day7: "4", day30: "4", season: "4" } }
    },
    {
      personId: 4430030, name: "Chase Brown", position: "RB", jerseyNumber: "30", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 76, recYds: 32, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "72.0", recYds: "28.5", rec: "3.4", td: "0.8" }, rankings: { day7: "11", day30: "12", season: "11" } }
    },
    {
      personId: 4241485, name: "Zack Moss", position: "RB", jerseyNumber: "31", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 38, recYds: 14, touchdowns: 0, minutes: "24", seasonAverages: { rushYds: "40.0", recYds: "15.0", rec: "1.8", td: "0.4" }, rankings: { day7: "36", day30: "39", season: "37" } }
    },
    {
      personId: 4361320, name: "Ja'Marr Chase", position: "WR", jerseyNumber: "1", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 104, touchdowns: 1, minutes: "56", seasonAverages: { recYds: "96.4", rec: "7.1", td: "0.9" }, rankings: { day7: "1", day30: "1", season: "1" } }
    },
    {
      personId: 4241395, name: "Tee Higgins", position: "WR", jerseyNumber: "5", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 78, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "72.0", rec: "5.2", td: "0.7" }, rankings: { day7: "12", day30: "13", season: "12" } }
    },
    {
      personId: 4430035, name: "Andrei Iosivas", position: "WR", jerseyNumber: "80", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 42, touchdowns: 0, minutes: "34", seasonAverages: { recYds: "38.5", rec: "3.1", td: "0.4" }, rankings: { day7: "50", day30: "54", season: "52" } }
    },
    {
      personId: 3121440, name: "Mike Gesicki", position: "TE", jerseyNumber: "88", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 52, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "48.0", rec: "4.5", td: "0.4" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 4426520, name: "Evan McPherson", position: "K", jerseyNumber: "2", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.2", td: "0.0" }, rankings: { day7: "6", day30: "7", season: "6" } }
    }
  ],

  TB: [
    {
      personId: 3052587, name: "Baker Mayfield", position: "QB", jerseyNumber: "6", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 252, rushYds: 12, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "252.0", passTd: "1.9", rushYds: "12.0", cmp: "22.8", td: "2.1" }, rankings: { day7: "10", day30: "11", season: "10" } }
    },
    {
      personId: 4430040, name: "Bucky Irving", position: "RB", jerseyNumber: "7", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 74, recYds: 28, touchdowns: 1, minutes: "44", seasonAverages: { rushYds: "70.5", recYds: "26.0", rec: "3.2", td: "0.7" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 4430045, name: "Rachaad White", position: "RB", jerseyNumber: "1", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 42, recYds: 34, touchdowns: 0, minutes: "36", seasonAverages: { rushYds: "44.0", recYds: "32.0", rec: "4.0", td: "0.5" }, rankings: { day7: "24", day30: "25", season: "24" } }
    },
    {
      personId: 3116395, name: "Mike Evans", position: "WR", jerseyNumber: "13", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 84, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "78.4", rec: "5.4", td: "0.8" }, rankings: { day7: "8", day30: "7", season: "8" } }
    },
    {
      personId: 3116400, name: "Chris Godwin", position: "WR", jerseyNumber: "14", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 76, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "74.0", rec: "6.2", td: "0.6" }, rankings: { day7: "10", day30: "11", season: "10" } }
    },
    {
      personId: 4685050, name: "Jalen McMillan", position: "WR", jerseyNumber: "19", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 36, touchdowns: 0, minutes: "32", seasonAverages: { recYds: "38.0", rec: "2.9", td: "0.3" }, rankings: { day7: "56", day30: "60", season: "58" } }
    },
    {
      personId: 4430050, name: "Cade Otton", position: "TE", jerseyNumber: "88", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 54, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "48.2", rec: "4.8", td: "0.4" }, rankings: { day7: "12", day30: "13", season: "12" } }
    },
    {
      personId: 4241490, name: "Chase McLaughlin", position: "K", jerseyNumber: "4", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.9", td: "0.0" }, rankings: { day7: "11", day30: "12", season: "11" } }
    }
  ],

  NE: [
    {
      personId: 4431452, name: "Drake Maye", position: "QB", jerseyNumber: "10", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 232, rushYds: 28, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "235.0", passTd: "1.6", rushYds: "25.0", cmp: "20.2", td: "1.9" }, rankings: { day7: "15", day30: "16", season: "15" } }
    },
    {
      personId: 4241400, name: "Rhamondre Stevenson", position: "RB", jerseyNumber: "38", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 76, recYds: 22, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "72.4", recYds: "21.0", rec: "2.8", td: "0.7" }, rankings: { day7: "16", day30: "17", season: "16" } }
    },
    {
      personId: 4241405, name: "Antonio Gibson", position: "RB", jerseyNumber: "4", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 34, recYds: 18, touchdowns: 0, minutes: "24", seasonAverages: { rushYds: "32.0", recYds: "18.5", rec: "2.2", td: "0.3" }, rankings: { day7: "42", day30: "44", season: "43" } }
    },
    {
      personId: 4685060, name: "Ja'Lynn Polk", position: "WR", jerseyNumber: "1", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 48, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "46.0", rec: "3.5", td: "0.4" }, rankings: { day7: "40", day30: "44", season: "42" } }
    },
    {
      personId: 4430055, name: "DeMario Douglas", position: "WR", jerseyNumber: "3", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 6, recYds: 58, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "54.2", rec: "4.8", td: "0.3" }, rankings: { day7: "32", day30: "34", season: "33" } }
    },
    {
      personId: 3040170, name: "Kendrick Bourne", position: "WR", jerseyNumber: "84", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 32, touchdowns: 0, minutes: "30", seasonAverages: { recYds: "34.0", rec: "2.8", td: "0.2" }, rankings: { day7: "64", day30: "68", season: "66" } }
    },
    {
      personId: 3121445, name: "Hunter Henry", position: "TE", jerseyNumber: "85", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 52, touchdowns: 1, minutes: "48", seasonAverages: { recYds: "48.6", rec: "4.2", td: "0.5" }, rankings: { day7: "13", day30: "14", season: "13" } }
    },
    {
      personId: 4038950, name: "Joey Slye", position: "K", jerseyNumber: "9", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.4", td: "0.0" }, rankings: { day7: "18", day30: "20", season: "19" } }
    }
  ],

  SEA: [
    {
      personId: 15864, name: "Geno Smith", position: "QB", jerseyNumber: "7", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 245, rushYds: 12, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "248.0", passTd: "1.8", rushYds: "10.0", cmp: "21.6", td: "2.0" }, rankings: { day7: "12", day30: "14", season: "12" } }
    },
    {
      personId: 4429035, name: "Kenneth Walker III", position: "RB", jerseyNumber: "9", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 84, recYds: 24, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "79.0", recYds: "22.5", rec: "2.8", td: "0.8" }, rankings: { day7: "8", day30: "9", season: "8" } }
    },
    {
      personId: 4430060, name: "Zach Charbonnet", position: "RB", jerseyNumber: "26", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 38, recYds: 16, touchdowns: 0, minutes: "24", seasonAverages: { rushYds: "38.0", recYds: "16.0", rec: "2.0", td: "0.4" }, rankings: { day7: "34", day30: "36", season: "35" } }
    },
    {
      personId: 4685300, name: "Jadarian Price", position: "RB", jerseyNumber: "24", status: "Active", starter: false, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 48, recYds: 18, touchdowns: 1, minutes: "26", seasonAverages: { rushYds: "46.0", recYds: "16.0", rec: "1.8", td: "0.5" }, rankings: { day7: "28", day30: "30", season: "28" } }
    },
    {
      personId: 4047650, name: "DK Metcalf", position: "WR", jerseyNumber: "14", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 86, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "82.4", rec: "5.6", td: "0.7" }, rankings: { day7: "7", day30: "7", season: "7" } }
    },
    {
      personId: 4430065, name: "Jaxon Smith-Njigba", position: "WR", jerseyNumber: "11", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 74, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "72.0", rec: "5.8", td: "0.6" }, rankings: { day7: "15", day30: "16", season: "15" } }
    },
    {
      personId: 3040175, name: "Tyler Lockett", position: "WR", jerseyNumber: "16", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 48, touchdowns: 0, minutes: "42", seasonAverages: { recYds: "46.0", rec: "3.9", td: "0.4" }, rankings: { day7: "38", day30: "40", season: "39" } }
    },
    {
      personId: 4038955, name: "Noah Fant", position: "TE", jerseyNumber: "87", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 42, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "42.0", rec: "3.6", td: "0.3" }, rankings: { day7: "22", day30: "24", season: "23" } }
    },
    {
      personId: 3040180, name: "Jason Myers", position: "K", jerseyNumber: "5", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.8", td: "0.0" }, rankings: { day7: "12", day30: "13", season: "12" } }
    }
  ],

  LAR: [
    {
      personId: 12483, name: "Matthew Stafford", position: "QB", jerseyNumber: "9", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 254, rushYds: 4, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "258.0", passTd: "1.9", rushYds: "2.0", cmp: "22.2", td: "2.1" }, rankings: { day7: "11", day30: "12", season: "11" } }
    },
    {
      personId: 4430070, name: "Kyren Williams", position: "RB", jerseyNumber: "23", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 94, recYds: 28, touchdowns: 1, minutes: "50", seasonAverages: { rushYds: "88.4", recYds: "24.0", rec: "3.0", td: "1.1" }, rankings: { day7: "4", day30: "4", season: "4" } }
    },
    {
      personId: 4685070, name: "Blake Corum", position: "RB", jerseyNumber: "22", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 32, recYds: 8, touchdowns: 0, minutes: "18", seasonAverages: { rushYds: "30.0", recYds: "7.5", rec: "1.0", td: "0.3" }, rankings: { day7: "46", day30: "49", season: "47" } }
    },
    {
      personId: 4430075, name: "Puka Nacua", position: "WR", jerseyNumber: "17", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 6, recYds: 96, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "92.0", rec: "7.4", td: "0.7" }, rankings: { day7: "4", day30: "3", season: "4" } }
    },
    {
      personId: 3116405, name: "Cooper Kupp", position: "WR", jerseyNumber: "10", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 88, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "84.5", rec: "7.0", td: "0.7" }, rankings: { day7: "6", day30: "5", season: "6" } }
    },
    {
      personId: 3040185, name: "Demarcus Robinson", position: "WR", jerseyNumber: "15", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 42, touchdowns: 0, minutes: "36", seasonAverages: { recYds: "38.0", rec: "3.0", td: "0.4" }, rankings: { day7: "52", day30: "56", season: "54" } }
    },
    {
      personId: 4430080, name: "Colby Parkinson", position: "TE", jerseyNumber: "86", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 38, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "36.0", rec: "3.2", td: "0.3" }, rankings: { day7: "26", day30: "28", season: "27" } }
    },
    {
      personId: 4685080, name: "Joshua Karty", position: "K", jerseyNumber: "16", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.8", td: "0.0" }, rankings: { day7: "13", day30: "14", season: "13" } }
    }
  ],

  CHI: [
    {
      personId: 4431611, name: "Caleb Williams", position: "QB", jerseyNumber: "18", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 238, rushYds: 24, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "238.5", passTd: "1.7", rushYds: "24.0", cmp: "21.0", td: "2.0" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 4047655, name: "D'Andre Swift", position: "RB", jerseyNumber: "4", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 74, recYds: 32, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "72.0", recYds: "30.0", rec: "3.8", td: "0.7" }, rankings: { day7: "15", day30: "16", season: "15" } }
    },
    {
      personId: 4430085, name: "Roschon Johnson", position: "RB", jerseyNumber: "20", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 36, recYds: 12, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "34.0", recYds: "12.0", rec: "1.4", td: "0.4" }, rankings: { day7: "44", day30: "46", season: "45" } }
    },
    {
      personId: 3915440, name: "DJ Moore", position: "WR", jerseyNumber: "2", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 6, recYds: 82, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "78.0", rec: "6.0", td: "0.6" }, rankings: { day7: "12", day30: "11", season: "12" } }
    },
    {
      personId: 15795, name: "Keenan Allen", position: "WR", jerseyNumber: "13", status: "Active", starter: true, rarity: "Rare", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 68, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "64.0", rec: "5.8", td: "0.5" }, rankings: { day7: "22", day30: "24", season: "23" } }
    },
    {
      personId: 4685090, name: "Rome Odunze", position: "WR", jerseyNumber: "15", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 1, minutes: "46", seasonAverages: { recYds: "58.4", rec: "4.2", td: "0.5" }, rankings: { day7: "26", day30: "28", season: "27" } }
    },
    {
      personId: 4241410, name: "Cole Kmet", position: "TE", jerseyNumber: "85", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 52, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "48.0", rec: "4.4", td: "0.5" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 3040190, name: "Cairo Santos", position: "K", jerseyNumber: "8", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.7", td: "0.0" }, rankings: { day7: "14", day30: "15", season: "14" } }
    }
  ],

  WSH: [
    {
      personId: 4426515, name: "Jayden Daniels", position: "QB", jerseyNumber: "5", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 228, rushYds: 52, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "228.0", passTd: "1.6", rushYds: "52.4", cmp: "19.5", td: "2.4" }, rankings: { day7: "5", day30: "4", season: "5" } }
    },
    {
      personId: 4430090, name: "Brian Robinson Jr.", position: "RB", jerseyNumber: "8", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 78, recYds: 18, touchdowns: 1, minutes: "44", seasonAverages: { rushYds: "74.0", recYds: "16.5", rec: "2.2", td: "0.8" }, rankings: { day7: "13", day30: "14", season: "13" } }
    },
    {
      personId: 3051900, name: "Austin Ekeler", position: "RB", jerseyNumber: "30", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 38, recYds: 36, touchdowns: 0, minutes: "30", seasonAverages: { rushYds: "36.0", recYds: "34.0", rec: "3.9", td: "0.4" }, rankings: { day7: "25", day30: "26", season: "25" } }
    },
    {
      personId: 4047660, name: "Terry McLaurin", position: "WR", jerseyNumber: "17", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 86, touchdowns: 1, minutes: "56", seasonAverages: { recYds: "82.0", rec: "5.8", td: "0.7" }, rankings: { day7: "8", day30: "7", season: "8" } }
    },
    {
      personId: 4685100, name: "Luke McCaffrey", position: "WR", jerseyNumber: "12", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 4, recYds: 44, touchdowns: 0, minutes: "40", seasonAverages: { recYds: "42.0", rec: "3.5", td: "0.3" }, rankings: { day7: "48", day30: "52", season: "50" } }
    },
    {
      personId: 3121450, name: "Noah Brown", position: "WR", jerseyNumber: "85", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 38, touchdowns: 0, minutes: "32", seasonAverages: { recYds: "36.0", rec: "2.8", td: "0.3" }, rankings: { day7: "62", day30: "66", season: "64" } }
    },
    {
      personId: 15850, name: "Zach Ertz", position: "TE", jerseyNumber: "86", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 48, touchdowns: 1, minutes: "46", seasonAverages: { recYds: "46.0", rec: "4.5", td: "0.4" }, rankings: { day7: "16", day30: "18", season: "17" } }
    },
    {
      personId: 4241495, name: "Austin Seibert", position: "K", jerseyNumber: "3", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.5", td: "0.0" }, rankings: { day7: "4", day30: "5", season: "4" } }
    }
  ],

  DEN: [
    {
      personId: 4429013, name: "Bo Nix", position: "QB", jerseyNumber: "10", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 220, rushYds: 24, recYds: 0, touchdowns: 1, minutes: "60", seasonAverages: { passYds: "225.0", passTd: "1.4", rushYds: "22.0", cmp: "19.8", td: "1.7" }, rankings: { day7: "18", day30: "19", season: "18" } }
    },
    {
      personId: 4361620, name: "Javonte Williams", position: "RB", jerseyNumber: "33", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 64, recYds: 22, touchdowns: 1, minutes: "42", seasonAverages: { rushYds: "62.0", recYds: "20.5", rec: "2.9", td: "0.6" }, rankings: { day7: "20", day30: "22", season: "21" } }
    },
    {
      personId: 4430095, name: "Jaleel McLaughlin", position: "RB", jerseyNumber: "38", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 36, recYds: 16, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "34.0", recYds: "15.0", rec: "2.1", td: "0.3" }, rankings: { day7: "42", day30: "45", season: "44" } }
    },
    {
      personId: 3915445, name: "Courtland Sutton", position: "WR", jerseyNumber: "14", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 74, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "70.0", rec: "5.4", td: "0.6" }, rankings: { day7: "16", day30: "17", season: "16" } }
    },
    {
      personId: 4430100, name: "Marvin Mims Jr.", position: "WR", jerseyNumber: "19", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 12, recYds: 48, touchdowns: 0, minutes: "40", seasonAverages: { recYds: "44.0", rec: "3.2", td: "0.4", rushYds: "8.0" }, rankings: { day7: "36", day30: "38", season: "37" } }
    },
    {
      personId: 4685110, name: "Devaughn Vele", position: "WR", jerseyNumber: "81", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 38, touchdowns: 0, minutes: "30", seasonAverages: { recYds: "36.0", rec: "3.0", td: "0.2" }, rankings: { day7: "58", day30: "62", season: "60" } }
    },
    {
      personId: 4361625, name: "Greg Dulcich", position: "TE", jerseyNumber: "80", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 34, touchdowns: 0, minutes: "42", seasonAverages: { recYds: "35.0", rec: "3.4", td: "0.3" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 3040195, name: "Wil Lutz", position: "K", jerseyNumber: "3", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.6", td: "0.0" }, rankings: { day7: "15", day30: "16", season: "15" } }
    }
  ],

  NYG: [
    {
      personId: 4040720, name: "Daniel Jones", position: "QB", jerseyNumber: "8", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 215, rushYds: 32, recYds: 0, touchdowns: 1, minutes: "60", seasonAverages: { passYds: "218.0", passTd: "1.3", rushYds: "30.0", cmp: "19.0", td: "1.6" }, rankings: { day7: "20", day30: "22", season: "21" } }
    },
    {
      personId: 4047665, name: "Devin Singletary", position: "RB", jerseyNumber: "26", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 58, recYds: 18, touchdowns: 0, minutes: "40", seasonAverages: { rushYds: "56.0", recYds: "18.0", rec: "2.4", td: "0.5" }, rankings: { day7: "26", day30: "28", season: "27" } }
    },
    {
      personId: 4685120, name: "Tyrone Tracy Jr.", position: "RB", jerseyNumber: "29", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 46, recYds: 22, touchdowns: 1, minutes: "28", seasonAverages: { rushYds: "44.0", recYds: "20.0", rec: "2.8", td: "0.5" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 4685130, name: "Malik Nabers", position: "WR", jerseyNumber: "1", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 94, touchdowns: 1, minutes: "56", seasonAverages: { recYds: "88.4", rec: "7.2", td: "0.7" }, rankings: { day7: "5", day30: "6", season: "5" } }
    },
    {
      personId: 4430105, name: "Wan'Dale Robinson", position: "WR", jerseyNumber: "17", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 54, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "50.0", rec: "5.4", td: "0.3" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 4047670, name: "Darius Slayton", position: "WR", jerseyNumber: "86", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 44, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "45.0", rec: "3.2", td: "0.3" }, rankings: { day7: "46", day30: "48", season: "47" } }
    },
    {
      personId: 4685140, name: "Theo Johnson", position: "TE", jerseyNumber: "87", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 34, touchdowns: 0, minutes: "42", seasonAverages: { recYds: "32.0", rec: "3.0", td: "0.2" }, rankings: { day7: "30", day30: "32", season: "31" } }
    },
    {
      personId: 12490, name: "Graham Gano", position: "K", jerseyNumber: "9", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.3", td: "0.0" }, rankings: { day7: "20", day30: "22", season: "21" } }
    }
  ],

  MIA: [
    {
      personId: 4241479, name: "Tua Tagovailoa", position: "QB", jerseyNumber: "1", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 268, rushYds: 6, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "265.0", passTd: "1.9", rushYds: "5.0", cmp: "23.5", td: "2.0" }, rankings: { day7: "7", day30: "8", season: "7" } }
    },
    {
      personId: 4430110, name: "De'Von Achane", position: "RB", jerseyNumber: "28", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 72, recYds: 46, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "68.0", recYds: "42.0", rec: "5.0", td: "0.9" }, rankings: { day7: "5", day30: "5", season: "5" } }
    },
    {
      personId: 3051905, name: "Raheem Mostert", position: "RB", jerseyNumber: "31", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 44, recYds: 12, touchdowns: 0, minutes: "24", seasonAverages: { rushYds: "42.0", recYds: "11.0", rec: "1.4", td: "0.5" }, rankings: { day7: "34", day30: "36", season: "35" } }
    },
    {
      personId: 3116406, name: "Tyreek Hill", position: "WR", jerseyNumber: "10", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 98, touchdowns: 1, minutes: "56", seasonAverages: { recYds: "96.0", rec: "6.9", td: "0.8", rushYds: "3.5" }, rankings: { day7: "2", day30: "2", season: "2" } }
    },
    {
      personId: 4361325, name: "Jaylen Waddle", position: "WR", jerseyNumber: "17", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 76, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "74.0", rec: "5.5", td: "0.6" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 3915450, name: "Jonnu Smith", position: "TE", jerseyNumber: "9", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 48, touchdowns: 0, minutes: "44", seasonAverages: { recYds: "46.0", rec: "4.2", td: "0.4" }, rankings: { day7: "15", day30: "17", season: "16" } }
    },
    {
      personId: 3040200, name: "Jason Sanders", position: "K", jerseyNumber: "7", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.1", td: "0.0" }, rankings: { day7: "8", day30: "9", season: "8" } }
    }
  ],

  ATL: [
    {
      personId: 14880, name: "Kirk Cousins", position: "QB", jerseyNumber: "18", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 256, rushYds: 2, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "254.0", passTd: "1.8", rushYds: "1.5", cmp: "22.6", td: "1.9" }, rankings: { day7: "10", day30: "12", season: "11" } }
    },
    {
      personId: 4429040, name: "Bijan Robinson", position: "RB", jerseyNumber: "7", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 86, recYds: 38, touchdowns: 1, minutes: "50", seasonAverages: { rushYds: "84.0", recYds: "36.0", rec: "4.4", td: "1.0" }, rankings: { day7: "3", day30: "3", season: "3" } }
    },
    {
      personId: 4361630, name: "Tyler Allgeier", position: "RB", jerseyNumber: "25", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 44, recYds: 8, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "42.0", recYds: "8.0", rec: "1.0", td: "0.4" }, rankings: { day7: "35", day30: "38", season: "36" } }
    },
    {
      personId: 4361330, name: "Drake London", position: "WR", jerseyNumber: "5", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 88, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "82.5", rec: "6.8", td: "0.7" }, rankings: { day7: "6", day30: "6", season: "6" } }
    },
    {
      personId: 4241415, name: "Darnell Mooney", position: "WR", jerseyNumber: "1", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 68, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "64.0", rec: "4.8", td: "0.5" }, rankings: { day7: "20", day30: "22", season: "21" } }
    },
    {
      personId: 4361335, name: "Kyle Pitts", position: "TE", jerseyNumber: "8", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 56, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "52.0", rec: "4.5", td: "0.4" }, rankings: { day7: "10", day30: "11", season: "10" } }
    },
    {
      personId: 3040205, name: "Younghoe Koo", position: "K", jerseyNumber: "6", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.2", td: "0.0" }, rankings: { day7: "6", day30: "7", season: "6" } }
    }
  ],

  PIT: [
    {
      personId: 14881, name: "Russell Wilson", position: "QB", jerseyNumber: "3", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 242, rushYds: 16, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "240.0", passTd: "1.7", rushYds: "15.0", cmp: "20.4", td: "1.9" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 4361340, name: "Justin Fields", position: "QB", jerseyNumber: "2", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 60, rushYds: 35, recYds: 0, touchdowns: 1, minutes: "15", seasonAverages: { passYds: "80.0", passTd: "0.6", rushYds: "40.0", cmp: "7.0", td: "0.9" }, rankings: { day7: "22", day30: "20", season: "21" } }
    },
    {
      personId: 4241420, name: "Najee Harris", position: "RB", jerseyNumber: "22", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 78, recYds: 18, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "74.0", recYds: "18.0", rec: "2.5", td: "0.7" }, rankings: { day7: "14", day30: "15", season: "14" } }
    },
    {
      personId: 4430115, name: "Jaylen Warren", position: "RB", jerseyNumber: "30", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 42, recYds: 24, touchdowns: 0, minutes: "28", seasonAverages: { rushYds: "40.0", recYds: "22.0", rec: "3.2", td: "0.4" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 4361345, name: "George Pickens", position: "WR", jerseyNumber: "14", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 86, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "82.0", rec: "5.6", td: "0.6" }, rankings: { day7: "8", day30: "8", season: "8" } }
    },
    {
      personId: 4241425, name: "Pat Freiermuth", position: "TE", jerseyNumber: "88", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 46, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "44.0", rec: "4.2", td: "0.4" }, rankings: { day7: "14", day30: "16", season: "15" } }
    },
    {
      personId: 3040210, name: "Chris Boswell", position: "K", jerseyNumber: "9", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "9.0", td: "0.0" }, rankings: { day7: "2", day30: "2", season: "2" } }
    }
  ],

  NYJ: [
    {
      personId: 8439, name: "Aaron Rodgers", position: "QB", jerseyNumber: "8", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 260, rushYds: 4, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "255.0", passTd: "1.9", rushYds: "3.0", cmp: "23.0", td: "2.1" }, rankings: { day7: "9", day30: "10", season: "9" } }
    },
    {
      personId: 4361350, name: "Breece Hall", position: "RB", jerseyNumber: "20", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 82, recYds: 38, touchdowns: 1, minutes: "50", seasonAverages: { rushYds: "78.0", recYds: "36.0", rec: "4.5", td: "0.9" }, rankings: { day7: "4", day30: "4", season: "4" } }
    },
    {
      personId: 4685150, name: "Braelon Allen", position: "RB", jerseyNumber: "0", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 36, recYds: 10, touchdowns: 0, minutes: "20", seasonAverages: { rushYds: "35.0", recYds: "10.0", rec: "1.2", td: "0.3" }, rankings: { day7: "40", day30: "42", season: "41" } }
    },
    {
      personId: 16800, name: "Davante Adams", position: "WR", jerseyNumber: "17", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 86, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "84.0", rec: "6.8", td: "0.7" }, rankings: { day7: "5", day30: "5", season: "5" } }
    },
    {
      personId: 4361355, name: "Garrett Wilson", position: "WR", jerseyNumber: "5", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 82, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "80.0", rec: "6.5", td: "0.6" }, rankings: { day7: "7", day30: "7", season: "7" } }
    },
    {
      personId: 3040215, name: "Tyler Conklin", position: "TE", jerseyNumber: "83", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 44, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "42.0", rec: "3.8", td: "0.3" }, rankings: { day7: "18", day30: "20", season: "19" } }
    },
    {
      personId: 3040220, name: "Greg Zuerlein", position: "K", jerseyNumber: "9", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.7", td: "0.0" }, rankings: { day7: "15", day30: "16", season: "15" } }
    }
  ],

  IND: [
    {
      personId: 4429045, name: "Anthony Richardson", position: "QB", jerseyNumber: "5", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 225, rushYds: 48, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "220.0", passTd: "1.4", rushYds: "48.0", cmp: "18.0", td: "2.1" }, rankings: { day7: "12", day30: "10", season: "11" } }
    },
    {
      personId: 4241430, name: "Jonathan Taylor", position: "RB", jerseyNumber: "28", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 96, recYds: 20, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "90.0", recYds: "20.0", rec: "2.5", td: "1.0" }, rankings: { day7: "3", day30: "3", season: "3" } }
    },
    {
      personId: 4241435, name: "Michael Pittman Jr.", position: "WR", jerseyNumber: "11", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 74, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "72.0", rec: "6.2", td: "0.5" }, rankings: { day7: "16", day30: "15", season: "16" } }
    },
    {
      personId: 4430120, name: "Josh Downs", position: "WR", jerseyNumber: "1", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 66, touchdowns: 0, minutes: "46", seasonAverages: { recYds: "62.0", rec: "5.4", td: "0.4" }, rankings: { day7: "24", day30: "26", season: "25" } }
    },
    {
      personId: 4361360, name: "Alec Pierce", position: "WR", jerseyNumber: "14", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 52, touchdowns: 1, minutes: "44", seasonAverages: { recYds: "48.0", rec: "3.2", td: "0.4" }, rankings: { day7: "36", day30: "40", season: "38" } }
    },
    {
      personId: 3040225, name: "Matt Gay", position: "K", jerseyNumber: "7", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.0", td: "0.0" }, rankings: { day7: "9", day30: "10", season: "9" } }
    }
  ],

  LAC: [
    {
      personId: 4241440, name: "Justin Herbert", position: "QB", jerseyNumber: "10", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 258, rushYds: 14, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "255.0", passTd: "1.9", rushYds: "12.0", cmp: "22.5", td: "2.1" }, rankings: { day7: "8", day30: "9", season: "8" } }
    },
    {
      personId: 4241445, name: "J.K. Dobbins", position: "RB", jerseyNumber: "27", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 84, recYds: 16, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "80.0", recYds: "16.0", rec: "2.0", td: "0.8" }, rankings: { day7: "10", day30: "11", season: "10" } }
    },
    {
      personId: 4685160, name: "Ladd McConkey", position: "WR", jerseyNumber: "15", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 78, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "74.0", rec: "5.8", td: "0.6" }, rankings: { day7: "15", day30: "16", season: "15" } }
    },
    {
      personId: 4430125, name: "Quentin Johnston", position: "WR", jerseyNumber: "1", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 58, touchdowns: 1, minutes: "44", seasonAverages: { recYds: "54.0", rec: "4.0", td: "0.5" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 3040230, name: "Cameron Dicker", position: "K", jerseyNumber: "11", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.4", td: "0.0" }, rankings: { day7: "4", day30: "4", season: "4" } }
    }
  ],

  ARI: [
    {
      personId: 3915455, name: "Kyler Murray", position: "QB", jerseyNumber: "1", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 248, rushYds: 42, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "244.0", passTd: "1.7", rushYds: "40.0", cmp: "21.5", td: "2.3" }, rankings: { day7: "6", day30: "7", season: "6" } }
    },
    {
      personId: 3051910, name: "James Conner", position: "RB", jerseyNumber: "6", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 86, recYds: 22, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "82.0", recYds: "20.0", rec: "2.8", td: "0.9" }, rankings: { day7: "8", day30: "8", season: "8" } }
    },
    {
      personId: 4685170, name: "Marvin Harrison Jr.", position: "WR", jerseyNumber: "18", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 88, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "84.0", rec: "6.0", td: "0.8" }, rankings: { day7: "6", day30: "6", season: "6" } }
    },
    {
      personId: 4430130, name: "Trey McBride", position: "TE", jerseyNumber: "85", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 74, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "70.0", rec: "6.4", td: "0.6" }, rankings: { day7: "4", day30: "4", season: "4" } }
    },
    {
      personId: 3040235, name: "Chad Ryland", position: "K", jerseyNumber: "38", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.8", td: "0.0" }, rankings: { day7: "12", day30: "13", season: "12" } }
    }
  ],

  JAX: [
    {
      personId: 4361365, name: "Trevor Lawrence", position: "QB", jerseyNumber: "16", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 255, rushYds: 18, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "250.0", passTd: "1.8", rushYds: "16.0", cmp: "22.0", td: "2.1" }, rankings: { day7: "11", day30: "12", season: "11" } }
    },
    {
      personId: 4361370, name: "Travis Etienne Jr.", position: "RB", jerseyNumber: "1", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 76, recYds: 26, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "72.0", recYds: "24.0", rec: "3.2", td: "0.8" }, rankings: { day7: "12", day30: "13", season: "12" } }
    },
    {
      personId: 4430135, name: "Tank Bigsby", position: "RB", jerseyNumber: "4", status: "Active", starter: false, streak: "Hot",
      statistics: { passYds: 0, rushYds: 52, recYds: 6, touchdowns: 1, minutes: "24", seasonAverages: { rushYds: "50.0", recYds: "6.0", rec: "0.8", td: "0.5" }, rankings: { day7: "24", day30: "25", season: "24" } }
    },
    {
      personId: 4685180, name: "Brian Thomas Jr.", position: "WR", jerseyNumber: "7", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 6, recYds: 84, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "80.0", rec: "5.5", td: "0.7" }, rankings: { day7: "7", day30: "8", season: "7" } }
    },
    {
      personId: 3040240, name: "Evan Engram", position: "TE", jerseyNumber: "17", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 0, minutes: "48", seasonAverages: { recYds: "58.0", rec: "5.8", td: "0.4" }, rankings: { day7: "8", day30: "9", season: "8" } }
    },
    {
      personId: 4685190, name: "Cam Little", position: "K", jerseyNumber: "39", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.9", td: "0.0" }, rankings: { day7: "11", day30: "12", season: "11" } }
    }
  ],

  NO: [
    {
      personId: 16757, name: "Derek Carr", position: "QB", jerseyNumber: "4", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 242, rushYds: 4, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "240.0", passTd: "1.7", rushYds: "3.0", cmp: "21.0", td: "1.9" }, rankings: { day7: "15", day30: "16", season: "15" } }
    },
    {
      personId: 3051915, name: "Alvin Kamara", position: "RB", jerseyNumber: "41", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 80, recYds: 44, touchdowns: 1, minutes: "50", seasonAverages: { rushYds: "76.0", recYds: "40.0", rec: "5.2", td: "0.9" }, rankings: { day7: "5", day30: "5", season: "5" } }
    },
    {
      personId: 4361375, name: "Chris Olave", position: "WR", jerseyNumber: "12", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 78, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "74.0", rec: "5.8", td: "0.6" }, rankings: { day7: "14", day30: "14", season: "14" } }
    },
    {
      personId: 3040245, name: "Taysom Hill", position: "TE", jerseyNumber: "7", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 15, rushYds: 32, recYds: 24, touchdowns: 1, minutes: "35", seasonAverages: { rushYds: "30.0", recYds: "22.0", rec: "2.4", td: "0.6" }, rankings: { day7: "16", day30: "15", season: "16" } }
    },
    {
      personId: 3040250, name: "Blake Grupe", position: "K", jerseyNumber: "19", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.8", td: "0.0" }, rankings: { day7: "13", day30: "14", season: "13" } }
    }
  ],

  LV: [
    {
      personId: 4040725, name: "Gardner Minshew", position: "QB", jerseyNumber: "15", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 232, rushYds: 8, recYds: 0, touchdowns: 1, minutes: "60", seasonAverages: { passYds: "230.0", passTd: "1.4", rushYds: "7.0", cmp: "21.0", td: "1.6" }, rankings: { day7: "19", day30: "20", season: "19" } }
    },
    {
      personId: 4241450, name: "Alexander Mattison", position: "RB", jerseyNumber: "22", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 54, recYds: 22, touchdowns: 1, minutes: "42", seasonAverages: { rushYds: "52.0", recYds: "20.0", rec: "2.6", td: "0.5" }, rankings: { day7: "28", day30: "30", season: "29" } }
    },
    {
      personId: 4685200, name: "Brock Bowers", position: "TE", jerseyNumber: "89", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 2, recYds: 86, touchdowns: 1, minutes: "54", seasonAverages: { recYds: "82.0", rec: "7.0", td: "0.7" }, rankings: { day7: "1", day30: "1", season: "1" } }
    },
    {
      personId: 4047675, name: "Jakobi Meyers", position: "WR", jerseyNumber: "16", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 72, touchdowns: 0, minutes: "50", seasonAverages: { recYds: "68.0", rec: "5.5", td: "0.5" }, rankings: { day7: "20", day30: "21", season: "20" } }
    },
    {
      personId: 3040255, name: "Daniel Carlson", position: "K", jerseyNumber: "2", status: "Active", starter: true, rarity: "Rare", streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "8.0", td: "0.0" }, rankings: { day7: "9", day30: "10", season: "9" } }
    }
  ],

  TEN: [
    {
      personId: 4430140, name: "Will Levis", position: "QB", jerseyNumber: "8", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 225, rushYds: 16, recYds: 0, touchdowns: 1, minutes: "60", seasonAverages: { passYds: "220.0", passTd: "1.4", rushYds: "15.0", cmp: "18.5", td: "1.7" }, rankings: { day7: "21", day30: "23", season: "22" } }
    },
    {
      personId: 4047680, name: "Tony Pollard", position: "RB", jerseyNumber: "20", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 80, recYds: 24, touchdowns: 1, minutes: "46", seasonAverages: { rushYds: "76.0", recYds: "22.0", rec: "3.0", td: "0.7" }, rankings: { day7: "11", day30: "12", season: "11" } }
    },
    {
      personId: 4430145, name: "Tyjae Spears", position: "RB", jerseyNumber: "2", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 38, recYds: 18, touchdowns: 0, minutes: "26", seasonAverages: { rushYds: "36.0", recYds: "16.0", rec: "2.2", td: "0.3" }, rankings: { day7: "36", day30: "38", season: "37" } }
    },
    {
      personId: 3915460, name: "Calvin Ridley", position: "WR", jerseyNumber: "0", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 4, recYds: 76, touchdowns: 1, minutes: "52", seasonAverages: { recYds: "72.0", rec: "5.2", td: "0.6" }, rankings: { day7: "16", day30: "17", season: "16" } }
    },
    {
      personId: 3040260, name: "Nick Folk", position: "K", jerseyNumber: "6", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.7", td: "0.0" }, rankings: { day7: "14", day30: "15", season: "14" } }
    }
  ],

  CAR: [
    {
      personId: 4429050, name: "Bryce Young", position: "QB", jerseyNumber: "9", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 228, rushYds: 14, recYds: 0, touchdowns: 2, minutes: "60", seasonAverages: { passYds: "225.0", passTd: "1.5", rushYds: "12.0", cmp: "20.0", td: "1.8" }, rankings: { day7: "17", day30: "19", season: "18" } }
    },
    {
      personId: 4241455, name: "Chuba Hubbard", position: "RB", jerseyNumber: "30", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 84, recYds: 22, touchdowns: 1, minutes: "48", seasonAverages: { rushYds: "80.0", recYds: "20.0", rec: "2.8", td: "0.8" }, rankings: { day7: "9", day30: "10", season: "9" } }
    },
    {
      personId: 4685210, name: "Jonathon Brooks", position: "RB", jerseyNumber: "24", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 38, recYds: 12, touchdowns: 0, minutes: "22", seasonAverages: { rushYds: "36.0", recYds: "11.0", rec: "1.4", td: "0.3" }, rankings: { day7: "38", day30: "40", season: "39" } }
    },
    {
      personId: 4685220, name: "Xavier Legette", position: "WR", jerseyNumber: "17", status: "Active", starter: true, streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 1, minutes: "48", seasonAverages: { recYds: "58.0", rec: "4.5", td: "0.5" }, rankings: { day7: "26", day30: "28", season: "27" } }
    },
    {
      personId: 3040265, name: "Eddy Pineiro", position: "K", jerseyNumber: "4", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.6", td: "0.0" }, rankings: { day7: "16", day30: "17", season: "16" } }
    }
  ],

  CLE: [
    {
      personId: 3116410, name: "Deshaun Watson", position: "QB", jerseyNumber: "4", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 235, rushYds: 20, recYds: 0, touchdowns: 1, minutes: "60", seasonAverages: { passYds: "232.0", passTd: "1.5", rushYds: "18.0", cmp: "20.5", td: "1.8" }, rankings: { day7: "16", day30: "18", season: "17" } }
    },
    {
      personId: 3116415, name: "Nick Chubb", position: "RB", jerseyNumber: "24", status: "Active", starter: true, rarity: "Legendary", streak: "Hot",
      statistics: { passYds: 0, rushYds: 82, recYds: 12, touchdowns: 1, minutes: "44", seasonAverages: { rushYds: "78.0", recYds: "12.0", rec: "1.8", td: "0.8" }, rankings: { day7: "10", day30: "9", season: "10" } }
    },
    {
      personId: 4241460, name: "Jerome Ford", position: "RB", jerseyNumber: "34", status: "Active", starter: false, streak: "Normal",
      statistics: { passYds: 0, rushYds: 40, recYds: 22, touchdowns: 0, minutes: "28", seasonAverages: { rushYds: "38.0", recYds: "20.0", rec: "2.6", td: "0.4" }, rankings: { day7: "32", day30: "34", season: "33" } }
    },
    {
      personId: 4241465, name: "Jerry Jeudy", position: "WR", jerseyNumber: "3", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 74, touchdowns: 1, minutes: "50", seasonAverages: { recYds: "70.0", rec: "5.4", td: "0.5" }, rankings: { day7: "18", day30: "19", season: "18" } }
    },
    {
      personId: 3116420, name: "David Njoku", position: "TE", jerseyNumber: "85", status: "Active", starter: true, rarity: "Rare", streak: "Hot",
      statistics: { passYds: 0, rushYds: 0, recYds: 62, touchdowns: 1, minutes: "48", seasonAverages: { recYds: "58.0", rec: "5.2", td: "0.5" }, rankings: { day7: "9", day30: "10", season: "9" } }
    },
    {
      personId: 3040270, name: "Dustin Hopkins", position: "K", jerseyNumber: "7", status: "Active", starter: true, streak: "Normal",
      statistics: { passYds: 0, rushYds: 0, recYds: 0, touchdowns: 0, minutes: "60", seasonAverages: { ppg: "7.9", td: "0.0" }, rankings: { day7: "11", day30: "12", season: "11" } }
    }
  ]
};

// Fallback helper to retrieve or synthesize a complete roster for any NFL team code
export function getNflRosterForTeam(tricode: string): NflRosterPlayer[] {
  const norm = tricode?.toUpperCase() || 'KC';
  if (NFL_TEAM_ROSTERS[norm]) {
    return NFL_TEAM_ROSTERS[norm];
  }
  return NFL_TEAM_ROSTERS['KC'];
}
