// TornTracker: Full-Access-Bereich nur für eingeloggte Admins sichtbar.
(function(){
  const ADMIN_AUTH='tornTrackerAdminAuth';
  const ADVANCED_IDS=new Set(['crime','attacks','defends']);

  function isAdmin(){return sessionStorage.getItem(ADMIN_AUTH)==='1'}

  function cleanSelectedStats(){
    if(isAdmin())return;
    try{
      const saved=JSON.parse(localStorage.getItem('tornTrackerStats')||'[]');
      if(!Array.isArray(saved))return;
      const clean=saved.filter(s=>!ADVANCED_IDS.has(s?.id));
      if(clean.length!==saved.length)localStorage.setItem('tornTrackerStats',JSON.stringify(clean));
    }catch{}
  }

  function hideFullAccess(){
    if(isAdmin())return;
    cleanSelectedStats();
    document.querySelectorAll('.advanced-card').forEach(el=>el.remove());
    document.querySelectorAll('#adminSettingsSection').forEach(el=>el.remove());
    document.querySelectorAll('.settings-section').forEach(section=>{
      const text=section.textContent||'';
      if(text.includes('Optionaler Full-Access-Key'))section.remove();
    });
    document.querySelectorAll('.checks label').forEach(label=>{
      const input=label.querySelector('input');
      if(input&&ADVANCED_IDS.has(input.value))label.remove();
    });
  }

  function refresh(){
    if(isAdmin())return;
    hideFullAccess();
  }

  const observer=new MutationObserver(refresh);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('tornTrackerAdminChanged',refresh);
  cleanSelectedStats();
  refresh();
})();
