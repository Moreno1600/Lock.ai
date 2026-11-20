import axios from "axios";
import { completedHistory } from "../slateHistory.js";

const base = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const probes = [
  {label:"Atlanta schedule",url:base+"/teams/1/schedule",params:{season:2027,limit:120}},
  {label:"Nov 18 scoreboard",url:base+"/scoreboard",params:{dates:"20261118",limit:100}},
  {label:"Nov 1-18 range",url:base+"/scoreboard",params:{dates:"20261101-20261118",limit:500}}
];
for(const probe of probes){
  try{
    const result=await axios.get(probe.url,{params:probe.params,timeout:12000});
    const events=Array.isArray(result.data?.events)?result.data.events:[];
    const completed=completedHistory(events,{id:"1",name:"Atlanta Hawks",abbrev:"ATL"},new Date().toISOString());
    const sample=events[0];
    console.log(JSON.stringify({probe:probe.label,http:result.status,count:events.length,scoredAtlanta:completed.length,
      firstEventDate:sample?.date,firstStatus:sample?.status?.type?.state || sample?.competitions?.[0]?.status?.type?.state || null,
      firstScore:sample?.competitions?.[0]?.competitors?.map((c:any)=>({team:c.team?.abbreviation,id:c.team?.id,score:c.score})).slice(0,2)
    }));
  }catch(error:any){console.log(JSON.stringify({probe:probe.label,error:error.response?.status || error.message}));}
}
