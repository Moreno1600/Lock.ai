import axios from 'axios';

async function test() {
  const playerName = 'Luka Doncic';
  
  try {
    const searchUrl = `https://site.api.espn.com/apis/search/v2?region=us&lang=en&query=${encodeURIComponent(playerName)}&limit=5&page=1&supported=true&types=player`;
    const searchRes = await axios.get(searchUrl);
    
    const player = searchRes.data.results[0].contents.find(p => p.sport === 'basketball' && p.description === 'NBA');
    if (player) {
      console.log('Found:', player.displayName);
    } else {
      console.log('Not found');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
