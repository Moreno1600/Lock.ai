import axios from 'axios';

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/players/2544/gamelog');
    console.log('Success:', res.data.length, 'games');
    console.log('First game:', res.data[0]);
  } catch (e) {
    console.error('Error:', e.message);
  }
}
test();
