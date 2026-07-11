const axios = require('axios');
axios.get('http://localhost:3000/api/games/0022300061/summary?sport=NBA')
  .then(r => console.log('NBA Success:', r.data))
  .catch(e => console.error('NBA Error:', e.response?.data || e.message));

axios.get('http://localhost:3000/api/games/746401/summary?sport=MLB')
  .then(r => console.log('MLB Success:', r.data))
  .catch(e => console.error('MLB Error:', e.response?.data || e.message));
