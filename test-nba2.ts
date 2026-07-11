import axios from 'axios';

async function test() {
  const dateStr = new Date().toISOString().split('T')[0];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Origin': 'https://www.nba.com',
    'Referer': 'https://www.nba.com/'
  };

  try {
    const res2 = await axios.get(`https://stats.nba.com/stats/scoreboardv2?GameDate=${dateStr}&LeagueID=00&DayOffset=0`, { headers, timeout: 5000 });
    console.log("v2 success", Object.keys(res2.data));
    console.log("v2 resultSets", res2.data.resultSets.map((rs: any) => rs.name));
  } catch (err: any) {
    console.error("v2 error", err.message);
  }
}

test();
