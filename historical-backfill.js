// TornTracker: Fehlende historische Personal-Statistikpunkte beim Öffnen nachladen.
// Der API-Key wird ausschließlich aus localStorage gelesen und niemals an TornTracker/GitHub gesendet.
(function(){
  const API='https://api.torn.com/v2';
  const HISTORY_KEY='tornTrackerHistory';
  const MAX_POINTS=5000;
  const statMap={
    networth:'networth',
    crime:'crimes',
    crimes:'crimes',
    attacks:'attackswon',
    defends:'defendswon'
  };

  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function read(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return[]}}
  function write(history){
    history.sort((a,b)=>Number(a.time)-Number(b.time));
    const unique=[];
    const seen=new Set();
    history.forEach(x=>{
      const key=String(x.time);
      if(seen.has(key)){
        const i=unique.findIndex(y=>String(y.time)===key);
        unique[i]={...unique[i],...x};
      }else{seen.add(key);unique.push(x)}
    });
    while(unique.length>MAX_POINTS)unique.shift();
    localStorage.setItem(HISTORY_KEY,JSON.stringify(unique));
  }

  async function fetchHistorical(key,stats,timestamp){
    const url=new URL(API+'/user/personalstats');
    url.searchParams.set('stat',stats.join(','));
    url.searchParams.set('timestamp',String(Math.floor(timestamp/1000)));
    const r=await fetch(url,{headers:{Authorization:`ApiKey ${key}`,Accept:'application/json'}});
    const text=await r.text();
    let d;try{d=JSON.parse(text)}catch{return null}
    if(!r.ok||d?.error)throw new Error(d?.error?.error||d?.error?.message||`Torn API Fehler (HTTP ${r.status}).`);
    return d;
  }

  function normalize(data,requested){
    const out={};
    const ps=data?.personalstats??data;
    function walk(value){
      if(value==null)return;
      if(Array.isArray(value)){
        value.forEach(item=>{
          if(item&&typeof item==='object'){
            const name=String(item.name||item.stat||'').toLowerCase().replace(/[^a-z0-9]/g,'');
            if(name&&typeof item.value==='number')out[name]=item.value;
            walk(item.value);
          }
        });
        return;
      }
      if(typeof value!=='object')return;
      Object.entries(value).forEach(([k,v])=>{
        const name=k.toLowerCase().replace(/[^a-z0-9]/g,'');
        if(typeof v==='number')out[name]=v;
        else walk(v);
      });
    }
    walk(ps);
    const result={};
    requested.forEach(s=>{if(typeof out[s]==='number')result[s]=out[s]});
    return result;
  }

  function buildTimestamps(last,now){
    const gap=now-last;
    if(gap<15*60*1000)return [];
    let step;
    if(gap<=2*60*60*1000)step=15*60*1000;
    else if(gap<=24*60*60*1000)step=60*60*1000;
    else if(gap<=7*86400000)step=6*60*60*1000;
    else if(gap<=31*86400000)step=86400000;
    else step=7*86400000;
    const points=[];
    for(let t=last+step;t<now;t+=step)points.push(t);
    if(points.length>60){
      const every=Math.ceil(points.length/60);
      return points.filter((_,i)=>i%every===0);
    }
    return points;
  }

  async function run(){
    const key=localStorage.getItem('tornApiKey');
    if(!key)return;
    const selected=(()=>{try{return JSON.parse(localStorage.getItem('tornTrackerStats')||'[]')}catch{return[]}})();
    const requested=[...new Set(selected.map(s=>statMap[s.id]).filter(Boolean))];
    // Networth/Crimes/Attacks/Defends sind historische Personalstats der Torn-API.
    if(!requested.length)return;

    const history=read();
    const now=Date.now();
    const last=history.reduce((m,x)=>Math.max(m,Number(x.time)||0),0);
    // Beim ersten Start wird maximal ein Jahr rückwirkend aufgebaut.
    const start=last||now-365*86400000;
    const timestamps=buildTimestamps(start,now);
    if(!timestamps.length)return;

    // Torn erlaubt bei historischen personalstats maximal 10 Werte pro Anfrage.
    for(let i=0;i<timestamps.length;i+=4){
      const batch=timestamps.slice(i,i+4);
      const results=await Promise.all(batch.map(async ts=>{
        try{return {ts,data:normalize(await fetchHistorical(key,requested,ts),requested)}}catch(e){console.warn('TornTracker Historical Backfill:',e);return null}
      }));
      results.forEach(r=>{if(!r||!Object.keys(r.data).length)return;history.push({time:r.ts,...Object.fromEntries(Object.entries(r.data).map(([apiStat,value])=>{
        const id=Object.keys(statMap).find(k=>statMap[k]===apiStat)||apiStat;
        return [id,value];
      }))})});
      write(history);
      await sleep(150);
    }

    // Nach dem Nachladen das aktuell gewählte Diagramm erneut mit dem Filter zeichnen.
    if(typeof window.__tornTrackerApplyChartRange==='function'){
      window.__tornTrackerApplyChartRange(localStorage.getItem('tornTrackerChartRange')||'all');
    }
  }

  // Erst nach dem normalen Dashboard-Ladevorgang starten.
  setTimeout(run,1500);
})();
