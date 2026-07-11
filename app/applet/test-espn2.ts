import axios from 'axios';

async function testEspn() {
  try {
    console.log("Searching for LeBron...");
    const searchRes = await axios.get('https://site.web.api.espn.com/apis/search/v2?query=lebron&limit=5&supportedSports=basketball&types=player');
    const player = searchRes.data.results[0].contents[0];
    console.log("Found:", player.displayName, "UID:", player.uid);

    const id = player.uid.split('~a:')[1];
    console.log("Extracted ID:", id);

    console.log("Fetching game log...");
    const logRes = await axios.get(`https://site.web.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/${id}/gamelog`);
    const events = logRes.data.seasonTypes[0].categories[0].events;
    console.log("Games found:", events.length);
    if (events.length > 0) {
      console.log("Sample game stats:", events[0].stats);
      console.log("Stat labels:", logRes.data.seasonTypes[0].categories[0].labels);
    }
  } catch (e: any) {
    console.error("Error:", e.message);
  }
}

testEspn();
