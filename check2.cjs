const axios = require('axios');
axios.get('http://localhost:3000/api/scoreboard')
  .then(r => {
     let games = r.data || [];
     console.log('Testing', games.length, 'games');
     return Promise.all(games.map(g => axios.get(`http://localhost:3000/api/games/${g.gameId}/summary`).then(() => console.log('success', g.gameId)).catch(e => console.error('error', g.gameId, e.response?.data || e.message))));
  });
