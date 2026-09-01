// TornTracker: nur Statistik-Werte aktualisieren – niemals die komplette Seite neu rendern.
(function(){
  const INTERVAL=10000;
  const API='https://api.torn.com/v2';
  const money=n=>typeof n==='number'?'$'+n.toLocaleString('en-US'):String(n??'—');
  const getPath=(o,p)=>p.split('.').reduce((v,k)=>v==null?undefined:v[k],o);
  let busy=false;

  async function torn(path,key){
    const r=await fetch(API+path,{headers:{Authorization:`ApiKey ${key}`,Accept:'application/json'}});
    const d=await r.json();
    if(!r.ok||d?.error)throw new Error(d?.error?.error||d?.error?.message||`Torn API Fehler (HTTP ${r.status}).`);
    return d;
  }

  function saveHistory(values){
    try{
      const history=JSON.parse(localStorage.getItem('tornTrackerHistory')||'[]');
      history.push({time:Date.now(),...values});
      while(history.length>100)history.shift();
      localStorage.setItem('tornTrackerHistory',JSON.stringify(history));
    }catch(_){ }
  }

  async function refreshStats(){
    if(busy)return;
    const key=localStorage.getItem('tornApiKey');
    if(!key)return;
    const cards=document.querySelectorAll('.stat-card');
    if(!cards.length)return;
    busy=true;
    try{
      const [basic,bars,moneyData,networth]=await Promise.all([
        torn('/user/basic',key),
        torn('/user/bars',key),
        torn('/user/money',key),
        torn('/user/networth',key)
      ]);
      const data={...basic,bars:bars.bars||bars,money:moneyData.money||moneyData,networth:networth.networth||networth};
      const paths={
        level:['profile.level','number'],money:['money.cash','money'],energy:['bars.energy.current','number'],
        nerve:['bars.nerve.current','number'],happy:['bars.happy.current','number'],life:['bars.life.current','number'],
        rank:['profile.rank','text'],networth:['networth.total','money']
      };
      const historyValues={};
      cards.forEach(card=>{
        const id=card.dataset.stat,info=paths[id];
        if(!info)return;
        const raw=getPath(data,info[0]);
        if(raw===undefined||raw===null)return;
        const value=card.querySelector('.value');
        if(value)value.textContent=info[1]==='money'?money(raw):String(raw);
        if(typeof raw==='number')historyValues[id]=raw;
      });
      if(Object.keys(historyValues).length)saveHistory(historyValues);

      // Wenn ein Chart geöffnet ist, nur dessen Daten neu zeichnen und den ausgewählten Zeitraum behalten.
      const modal=document.getElementById('chartModal');
      if(modal&&typeof window.__tornTrackerApplyChartRange==='function'){
        window.__tornTrackerApplyChartRange(localStorage.getItem('tornTrackerChartRange')||'all');
      }
    }catch(e){console.warn('TornTracker Statistik-Refresh:',e)}
    finally{busy=false}
  }

  setInterval(refreshStats,INTERVAL);
})();
