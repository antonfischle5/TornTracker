// TornTracker: Full-Access-Statistiken sind ausschließlich für eingeloggte Admins sichtbar.
(function(){
  const AUTH_KEY='tornTrackerAdminAuth';
  const FULL_IDS=new Set(['crime','attacks','defends']);
  const isAdmin=()=>sessionStorage.getItem(AUTH_KEY)==='1';

  function updateVisibility(){
    const admin=isAdmin();
    document.querySelectorAll('.advanced-card').forEach(el=>el.style.display=admin?'':'none');
    document.querySelectorAll('#adminSettingsSection').forEach(el=>el.style.display=admin?'':'none');
    document.querySelectorAll('.settings-section').forEach(section=>{
      if(section.textContent.includes('Optionaler Full-Access-Key'))section.style.display=admin?'':'none';
    });
    document.querySelectorAll('.checks label').forEach(label=>{
      const input=label.querySelector('input');
      if(input&&FULL_IDS.has(input.value))label.style.display=admin?'':'none';
    });
    if(!admin){
      try{
        const saved=JSON.parse(localStorage.getItem('tornTrackerStats')||'[]');
        if(Array.isArray(saved)){
          const clean=saved.filter(s=>!FULL_IDS.has(s?.id));
          if(clean.length!==saved.length)localStorage.setItem('tornTrackerStats',JSON.stringify(clean));
        }
      }catch{}
    }
  }

  function patch(name,guard){
    if(typeof window[name]!=='function'||window['__fullAccess_'+name])return false;
    const original=window[name];
    window[name]=function(){
      if(guard&&!isAdmin())return;
      const result=original.apply(this,arguments);
      setTimeout(updateVisibility,0);
      return result;
    };
    window['__fullAccess_'+name]=true;
    return true;
  }

  function install(){
    const changed=[patch('dashboard',false),patch('openCustomizer',false),patch('settingsPage',false),patch('loadAdvanced',true)].some(Boolean);
    updateVisibility();
    return changed;
  }

  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},250);
    setTimeout(()=>clearInterval(timer),5000);
  }
  window.addEventListener('tornTrackerAdminChanged',updateVisibility);
  setTimeout(updateVisibility,0);
})();
