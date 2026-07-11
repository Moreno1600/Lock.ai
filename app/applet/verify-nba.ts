import axios from "axios";
async function check() {
  const response = await axios.get("https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json");
  const games = response.data.scoreboard.games;
  console.log("Total games:", games.length);
  games.forEach(g => {
    console.log(`Game: ${g.homeTeam.teamTricode} vs ${g.awayTeam.teamTricode}, Status: ${g.gameStatus}, StatusText: ${g.gameStatusText}`);
  });
}
check();
