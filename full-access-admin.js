// TornTracker: Full-Access-Statistiken sind ausschließlich für den Admin sichtbar.
(function(){
  const AUTH_KEY='tornTrackerAdminAuth';
  const isAdmin=()=>sessionStorage.getItem(AUTH_KEY)==='1';
  const FULL_IDS=new Set(['crime','attacks','defends']);
  const STYLE_ID='tornTrackerFullAccessGuestStyle';

  function setGuestStyle(){
    let style=document.getElementById(STYLE_ID);
    if(!style){
      style=document.createElement('style');
      style.id=STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent=isAdmin()?'':`#app .advanced-card{display:none!important}#app .settings-section:has(#fullKeyInput){display:none!important}#app #adminSettingsSection{display:none!important}`;
  }

  function hideForGuests(){
    setGuestStyle();
    if(isAdmin())return;
    document.querySelectorAll('.advanced-card,#adminSettingsSection').forEach(el=>el.remove());
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

  function patch(name,guard){
    if(typeof window[name]!=='function'||window['__fullAccess'+name+'Patched'])return false;
    const original=window[name];
    window[name]=function(){
      if(name==='loadAdvanced'&&!isAdmin())return;
      const result=original.apply(this,arguments);
      if(!isAdmin())hideForGuests();
      return result;
    };
    window['__fullAccess'+name+'Patched']=true;
    return true;
  }

  function install(){
    return [patch('dashboard'),patch('openCustomizer'),patch('settingsPage'),patch('loadAdvanced')].some(Boolean);
  }

  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},250);
    setTimeout(()=>clearInterval(timer),5000);
  }
  window.addEventListener('tornTrackerAdminChanged',hideForGuests);
  window.addEventListener('storage',hideForGuests);
  hideForGuests();
})();
