// TornTracker: Full-Access-Statistiken sind ausschließlich für den Admin sichtbar.
(function(){
  const AUTH_KEY='tornTrackerAdminAuth';
  const isAdmin=()=>sessionStorage.getItem(AUTH_KEY)==='1';
  const FULL_IDS=new Set(['crime','attacks','defends']);

  function hideForGuests(){
    if(isAdmin())return;
    document.querySelectorAll('.advanced-card').forEach(el=>el.remove());
    document.querySelectorAll('#adminSettingsSection').forEach(el=>el.remove());
    document.querySelectorAll('.checks label').forEach(label=>{
      const input=label.querySelector('input');
      if(input&&FULL_IDS.has(input.value))label.remove();
    });
    document.querySelectorAll('.settings-section').forEach(section=>{
      if(section.textContent.includes('Optionaler Full-Access-Key'))section.remove();
    });
    try{
      const saved=JSON.parse(localStorage.getItem('tornTrackerStats')||'[]');
      if(Array.isArray(saved)){
        const clean=saved.filter(s=>!FULL_IDS.has(s?.id));
        if(clean.length!==saved.length)localStorage.setItem('tornTrackerStats',JSON.stringify(clean));
      }
    }catch{}
  }

  function patchDashboard(){
    if(typeof window.dashboard!=='function'||window.__fullAccessDashboardPatched)return false;
    const original=window.dashboard;
    window.dashboard=function(){
      original();
      hideForGuests();
    };
    window.__fullAccessDashboardPatched=true;
    return true;
  }

  function patchCustomizer(){
    if(typeof window.openCustomizer!=='function'||window.__fullAccessCustomizerPatched)return false;
    const original=window.openCustomizer;
    window.openCustomizer=function(){
      original();
      if(isAdmin())return;
      hideForGuests();
    };
    window.__fullAccessCustomizerPatched=true;
    return true;
  }

  function patchSettings(){
    if(typeof window.settingsPage!=='function'||window.__fullAccessSettingsPatched)return false;
    const original=window.settingsPage;
    window.settingsPage=function(){
      original();
      hideForGuests();
    };
    window.__fullAccessSettingsPatched=true;
    return true;
  }

  function patchAdvancedLoader(){
    if(typeof window.loadAdvanced!=='function'||window.__fullAccessLoaderPatched)return false;
    const original=window.loadAdvanced;
    window.loadAdvanced=function(type){
      if(!isAdmin())return;
      return original(type);
    };
    window.__fullAccessLoaderPatched=true;
    return true;
  }

  function install(){
    const results=[patchDashboard(),patchCustomizer(),patchSettings(),patchAdvancedLoader()];
    return results.some(Boolean);
  }

  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},50);
    setTimeout(()=>clearInterval(timer),10000);
  }

  // app.js rendert Seiten dynamisch; deshalb werden Full-Access-Elemente auch danach entfernt.
  const observer=new MutationObserver(()=>hideForGuests());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  hideForGuests();
})();
