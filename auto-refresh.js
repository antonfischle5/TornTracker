// TornTracker: automatische Aktualisierung alle 10 Sekunden.
(function(){
  const INTERVAL=10000;
  let busy=false;
  setInterval(async()=>{
    if(busy||!localStorage.getItem('tornApiKey')||typeof loadDashboard!=='function')return;
    busy=true;
    try{
      const chart=document.getElementById('chartModal');
      const chartLabel=chart?.querySelector('.chart-modal h2')?.textContent?.trim()||null;
      await loadDashboard();
      if(chartLabel){
        const card=[...document.querySelectorAll('.stat-card')].find(c=>c.querySelector('.label')?.textContent?.trim()===chartLabel);
        if(card)card.click();
      }
    }catch(_){ }
    finally{busy=false;}
  },INTERVAL);
})();
