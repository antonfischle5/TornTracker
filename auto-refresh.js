// TornTracker automatic dashboard refresh.
// Refreshes every 10 seconds and keeps an open statistic chart visible.
(function(){
  const INTERVAL = 10000;
  function refresh(){
    const refreshButton=document.getElementById('refresh');
    if(!refreshButton) return;
    const chart=document.getElementById('chartModal');
    const chartLabel=chart?.querySelector('.chart-modal h2')?.textContent?.trim()||null;
    refreshButton.click();
    if(chartLabel){
      setTimeout(()=>{
        const cards=[...document.querySelectorAll('.stat-card')];
        const card=cards.find(c=>c.querySelector('.label')?.textContent?.trim()===chartLabel);
        if(card) card.click();
      },150);
    }
  }
  const observer=new MutationObserver(()=>{
    const button=document.getElementById('refresh');
    if(button) button.remove();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(refresh,INTERVAL);
})();
