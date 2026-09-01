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
  const labels={
    '1h':'1 Stunde',
    '1d':'1 Tag',
    '1w':'1 Woche',
    '1m':'1 Monat',
    '1y':'1 Jahr',
    'all':'Alles'
  };
  if(window.__tornTrackerChartRangeInstalled)return;
  window.__tornTrackerChartRangeInstalled=true;
  const originalOpen=window.openChart;
  if(typeof originalOpen!=='function')return;

  window.openChart=function(statId){
    originalOpen(statId);
    const modal=document.getElementById('chartModal');
    if(!modal)return;
    const chart=modal.querySelector('.chart-modal');
    const canvas=modal.querySelector('#statChart');
    const meta=chart?.querySelector('.chart-meta');
    const statLabel=chart?.querySelector('h2')?.textContent?.trim();
    if(!chart||!canvas||!statLabel)return;

    let stats=[];
    try{stats=JSON.parse(localStorage.getItem('tornTrackerStats')||'[]')}catch{}
    const stat=stats.find(s=>s.id===statId)||null;

    const buttons=document.createElement('div');
    buttons.className='chart-range-buttons';
    buttons.setAttribute('aria-label','Zeitraum auswählen');
    buttons.innerHTML=Object.entries(labels).map(([key,label])=>
      `<button type="button" class="secondary chart-range-btn" data-range="${key}">${label}</button>`
    ).join('');

    if(meta)meta.after(buttons);else chart.insertBefore(buttons,canvas);

    let current=localStorage.getItem('tornTrackerChartRange')||'all';
    if(!labels[current])current='all';

    function apply(key){
      current=key;
      localStorage.setItem('tornTrackerChartRange',key);
      buttons.querySelectorAll('.chart-range-btn').forEach(b=>b.classList.toggle('active',b.dataset.range===key));
      let all=[];
      try{all=JSON.parse(localStorage.getItem('tornTrackerHistory')||'[]')}catch{}
      const now=Date.now();
      const cut=ranges[key]===Infinity?0:now-ranges[key];
      const history=all.filter(x=>x&&typeof x[statId]==='number'&&Number(x.time)>=cut);
      const s=stat||{id:statId,label:statLabel,type:'number'};
      if(typeof window.drawChart==='function')window.drawChart(canvas,history,s);
      if(meta){
        meta.textContent=history.length<2
          ?`Noch nicht genug Verlaufspunkte für ${labels[key]}.`
          :`${history.length} gespeicherte Messpunkte · Zeitraum: ${labels[key]}`;
      }
    }

    buttons.querySelectorAll('.chart-range-btn').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.range)));
    apply(current);
  };
})();
