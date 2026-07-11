import axios from 'axios';

async function test() {
  const url = 'https://stats.nba.com/stats/playergamelog?PlayerID=2544&Season=2025-26&SeasonType=Regular+Season';
  
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

  try {
    console.log('Testing:', proxy);
    const res = await axios.get(proxy, { timeout: 10000 });
    console.log('Success:', JSON.parse(res.data.contents).resultSets[0].rowSet.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
