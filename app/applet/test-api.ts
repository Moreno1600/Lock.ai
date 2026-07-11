import axios from "axios";
async function run() {
  try {
     const res = await axios.get("https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json");
     console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
     console.error(e.message);
  }
}
run();
