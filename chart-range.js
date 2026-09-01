// TornTracker: Zeitraum-Auswahl für Statistik-Charts.
(function(){
  const ranges={
    '1h':3600000,
    '1d':86400000,
    '1w':604800000,
    '1m':2592000000,
    '1y':31536000000,
    'all':Infinity
  };
  const labels={ '1h':'1 Stunde','1d':'1 Tag','1w':'1 Woche','1m':'1 Monat','1y':'1 Jahr','all':'Alles' };
  const originalOpen=window.openChart;
  if(typeof originalOpen!=='function')return;
  window.openChart=function(statId){
    originalOpen(statId);
    const modal=document.getElementById('chartModal');
    if(!modal)return;
    const chart=modal.querySelector('.chart-modal');
    const canvas=modal.querySelector('#statChart');
    const statLabel=chart?.querySelector('h2')?.textContent?.trim();
    if(!chart||!canvas||!statLabel)return;
    const stat=(window.selectedStats||[]).find(s=>s.label===statLabel)||null;
    const buttons=document.createElement('div');
    buttons.className='chart-range-buttons';
    buttons.innerHTML=Object.entries(labels).map(([key,label])=>`<button class="secondary chart-range-btn" data-range="${key}">${label}</button>`).join('');
    const meta=chart.querySelector('.chart-meta');
    if(meta)meta.before(buttons);else chart.insertBefore(buttons,canvas);
    let current=localStorage.getItem('tornTrackerChartRange')||'all';
    function apply(key){
      current=key;localStorage.setItem('tornTrackerChartRange',key);
      buttons.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.range===key));
      const all=JSON.parse(localStorage.getItem('tornTrackerHistory')||'[]');
      const now=Date.now(),cut=ranges[key]===Infinity?0:now-ranges[key];
      const history=all.filter(x=>typeof x[statId]==='number'&&x.time>=cut);
      const s=stat||{id:statId,label:statLabel,type:'number'};
      if(typeof window.drawChart==='function')window.drawChart(canvas,history,s);
      if(meta)meta.textContent=history.length<2?'Noch nicht genug Verlaufspunkte.':`${history.length} gespeicherte Messpunkte · Zeitraum: ${labels[key]}`;
    }
    buttons.querySelectorAll('button').forEach(b=>b.onclick=()=>apply(b.dataset.range));
    apply(current);
  };
})();
