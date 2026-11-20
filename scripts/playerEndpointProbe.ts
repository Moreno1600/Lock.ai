import axios from "axios";
import { parseESPNGamelog, buildFormMarkets } from "../playerProps.js";
const SITE="https://site.api.espn.com/apis/site/v2/sports";
const WEB="https://site.web.api.espn.com/apis/common/v3/sports";
const date="20261120";
const get=async(u:string,p:any={})=>(await axios.get(u,{params:p,timeout:14000})).data;
for(const sport of ["NBA","NFL"] as const) {
  const league=sport==="NBA"?"basketball/nba":"football/nfl";
  try {
    const board=await get(SITE+"/"+league+"/scoreboard",sport==="NBA"?{dates:date,limit:100}:{limit:100});
    const event=(board.events||[]).find((e:any)=>e.status?.type?.state==="pre");
    if(!event){console.log("PROPS_PROBE",sport,"no pregame event in feed");continue;}
    const summary=await get(SITE+"/"+league+"/summary",{event:event.id});
    const comp=summary?.header?.competitions?.[0];
    console.log("PROPS_SUMMARY",JSON.stringify({sport,eventId:event.id,eventDate:event.date,headerDate:comp?.date,startDate:comp?.startDate,competitors:comp?.competitors?.map((c:any)=>({id:c.id,teamId:c.team?.id,abbr:c.team?.abbreviation,name:c.team?.displayName,homeAway:c.homeAway})),headerKeys:Object.keys(summary.header||{})}));
    const t=comp?.competitors?.[0]?.team;
    const teamId=t?.id||comp?.competitors?.[0]?.id;
    const roster=await get(SITE+"/"+league+"/teams/"+teamId+"/roster");
    const players=(roster.athletes||[]).flatMap((x:any)=>x.items||[x]);
    const p=players.find((x:any)=>x.id && (sport==="NBA" || x.position?.abbreviation==="QB"));
    if(!p){console.log("PROPS_PROBE",sport,"no qualifying athlete");continue;}
    const log=await get(WEB+"/"+league+"/athletes/"+p.id+"/gamelog");
    const games=parseESPNGamelog(sport,log,event.date);
    const props=buildFormMarkets(sport,games);
    console.log("PROPS_PLAYER",JSON.stringify({sport,player:p.displayName||p.fullName,id:p.id,teamId,logTypes:log.seasonTypes?.map((x:any)=>x.displayName),games:games.length,firstStats:games[0]?.stats,markets:props.map(x=>({stat:x.stat,mean:x.average,line:x.referenceLine,hits:x.hits,n:x.sampleGames})).slice(0,8)}).slice(0,3200));
  }catch(e:any){console.log("PROPS_ERROR",JSON.stringify({sport,status:e.response?.status,message:e.message}));}
}
