const axios = require('axios');
axios.get('http://localhost:3000/api/mlb/scoreboard')
  .then(r => {
     let games = r.data || [];
     console.log('Testing MLB', games.length, 'games');
     return Promise.all(games.map(g => axios.get(`http://localhost:3000/api/games/${g.gameId}/summary?sport=MLB`).then(() => console.log('success', g.gameId)).catch(e => console.error('error', g.gameId, e.response?.data || e.message))));
  });
