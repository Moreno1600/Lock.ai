import axios from "axios";
const root="https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/2/roster";
const web="https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/";
try {
 const {data} = await axios.get(root,{timeout:12000});
 const groups=data.athletes||[];
 console.log("NFL_GROUPS",JSON.stringify(groups.map((g:any)=>({position:g.position?.abbreviation||g.position?.displayName,count:g.items?.length,example:g.items?.slice(0,2).map((p:any)=>({id:p.id,name:p.displayName||p.fullName,status:p.status?.name,position:p.position?.abbreviation}))}))).slice(0,4000));
 const qb=groups.flatMap((g:any)=>g.items||[]).find((p:any)=>p.position?.abbreviation==="QB");
 if(!qb){console.log("NO_QB");process.exit(0);}
 for(const extra of ["", "?season=2026"]) {
  const {data:x}=await axios.get(web+qb.id+"/gamelog"+extra,{timeout:12000});
  console.log("NFL_LOG",JSON.stringify({id:qb.id,extra,labels:x.labels,names:x.names,seasonTypes:x.seasonTypes?.map((y:any)=>({displayName:y.displayName,name:y.name,keys:Object.keys(y),categories:y.categories?.map((c:any)=>({name:c.name,displayName:c.displayName,labels:c.labels,events:c.events?.slice(0,1)}))})),eventsCount:Object.keys(x.events||{}).length}).slice(0,7000));
 }
}catch(e:any){console.log("ERROR",e.response?.status||e.message);}
