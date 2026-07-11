import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('https://cdn.nba.com/static/json/liveData/players/players_00.json', { timeout: 5000 });
    console.log('Success:', res.data.length);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
