const https = require('https');

https.get('https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log("Total games:", parsed.scoreboard.games.length);
      parsed.scoreboard.games.forEach(g => {
        console.log(`Game: ${g.homeTeam.teamTricode} vs ${g.awayTeam.teamTricode}, Status: ${g.gameStatus}, StatusText: ${g.gameStatusText}`);
      });
    } catch (e) {
      console.error(e);
      console.log(data.substring(0, 500));
    }
  });
}).on('error', err => {
  console.log(err.message);
});
