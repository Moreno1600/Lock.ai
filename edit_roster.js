const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');
const searchStr = 'personId: 605232, name: "Wilyer Abreu"';
const insertStr = `{ 
                  personId: 673312, name: "Masataka Yoshida", position: "DH", jerseyNumber: "7", status: "Active", isStarred: false,
                  statistics: { hits: 0, rbi: 0, runs: 0, atBats: 0, seasonAverages: { avg: ".280", hr: "10", rbi: "56" }, rankings: { day7: 105, day30: 108, season: 106 } } 
                },
                { \n                  `;
if (content.includes(searchStr)) {
  const newContent = content.replace(searchStr, insertStr + searchStr);
  fs.writeFileSync('server.ts', newContent);
  console.log('Success');
} else {
  console.log('Not found');
}
