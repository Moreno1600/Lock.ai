import axios from "axios";
const probe = async (label: string, url: string, params: any = {}) => {
  try {
    const {data} = await axios.get(url,{params,timeout:12000});
    const shape = (obj:any) => obj && typeof obj==="object" ? Object.keys(obj).slice(0,30):[];
    const x:any={label,keys:shape(data)};
    if(label.includes("roster")){
      x.count=data.athletes?.length;
      x.sample=data.athletes?.slice(0,3).map((p:any)=>({keys:shape(p),name:p.fullName||p.displayName||p.athlete?.displayName,id:p.id||p.athlete?.id,position:p.position?.abbreviation,team:p.team?.abbreviation}));
    } else if(label.includes("gamelog")){
      x.season=data.season;
      x.labels=data.labels;
      x.categories=data.categories?.map((p:any)=>({keys:shape(p),name:p.name,labels:p.labels,events:p.events?.slice(0,2),statistics:p.statistics?.slice(0,1)})).slice(0,4);
      x.events=Array.isArray(data.events)?data.events.slice(0,2):Object.entries(data.events||{}).slice(0,2);
      x.eventsCount=Array.isArray(data.events)?data.events.length:Object.keys(data.events||{}).length;
      x.seasonTypes=data.seasonTypes;
      x.names=data.names;
    } else if(label.includes("leaders")){
      x.groups=data.leaders?.slice(0,2)||data.categories?.slice(0,2);
    }
    console.log(JSON.stringify(x).slice(0,6500));
    return data;
  } catch(e:any){console.log(JSON.stringify({label,error:e.response?.status||e.message}));return null;}
};
const nbaRoot="https://site.api.espn.com/apis/site/v2/sports/basketball/nba";
const nflRoot="https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const webRoot="https://site.web.api.espn.com/apis/common/v3/sports";
const nba=await probe("nba roster",nbaRoot+"/teams/19/roster");
const nflat=await probe("nfl roster",nflRoot+"/teams/2/roster");
const nbap=Array.isArray(nba?.athletes)?nba.athletes.find((p:any)=>p?.id):null;
const nflp=Array.isArray(nflat?.athletes)?nflat.athletes.find((p:any)=>p?.id):null;
if(nbap)await probe("nba gamelog",webRoot+"/basketball/nba/athletes/"+nbap.id+"/gamelog");
if(nflp)await probe("nfl gamelog",webRoot+"/football/nfl/athletes/"+nflp.id+"/gamelog");
await probe("nba leaders",nbaRoot+"/teams/19/leaders");
