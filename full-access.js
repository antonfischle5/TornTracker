// TornTracker: Full-Access-Statistiken nur für eingeloggte Admins.
(function(){
  const API='https://api.torn.com/v2';
  const fullKey=()=>localStorage.getItem('tornTrackerFullKey');
  const isAdmin=()=>typeof window.tornTrackerIsAdmin==='function'&&window.tornTrackerIsAdmin();

  async function api(path){
    const key=fullKey();
    if(!isAdmin())throw new Error('🔒 Diese Statistik ist nur für Admins verfügbar.');
    if(!key)throw new Error('Kein Full-Access-Key hinterlegt. Öffne Einstellungen → Admin → API-Keys.');
    const r=await fetch(API+path,{headers:{Authorization:`ApiKey ${key}`,Accept:'application/json'}});
    const text=await r.text();
    let d;try{d=JSON.parse(text)}catch{throw new Error(`Torn API hat keine gültige JSON-Antwort geliefert (HTTP ${r.status}).`)}
    if(!r.ok||d?.error)throw new Error(d?.error?.error||d?.error?.message||`Torn API Fehler (HTTP ${r.status}).`);
    return d;
  }

  const unwrap=d=>d?.personalstats||d;
  const numberFrom=(obj,names)=>{
    const wanted=names.map(x=>x.toLowerCase());
    const walk=(o)=>{
      if(!o||typeof o!=='object'||Array.isArray(o))return undefined;
      for(const [k,v] of Object.entries(o)){
        const normalized=k.toLowerCase().replace(/[^a-z0-9]/g,'');
        if(typeof v==='number'&&wanted.some(n=>normalized===n||normalized.includes(n)))return v;
        if(v&&typeof v==='object'){const hit=walk(v);if(hit!==undefined)return hit}
      }
      return undefined;
    };
    return walk(obj);
  };

  async function load(type){
    const status=document.getElementById('advancedStatus');
    if(!status)return;
    if(!isAdmin()){
      status.innerHTML='🔒 <strong>Nur für Admins.</strong> Melde dich zuerst über Einstellungen → Admin an.';
      return;
    }
    status.textContent='Lade '+({money:'Geld',rank:'Rank',crimes:'Crimes',attacks:'Attacks Won',defends:'Defends Won'}[type]||type)+'…';
    try{
      let value;
      if(type==='money'){
        const d=await api('/user/networth');
        value=numberFrom(d,['total','networth']);
      }else if(type==='rank'){
        const d=await api('/user/basic');
        value=d?.profile?.rank||d?.rank;
      }else if(type==='attacks'||type==='defends'){
        const stat=type==='attacks'?'attackswon':'defendswon';
        const d=await api('/user/personalstats?stat='+stat);
        value=numberFrom(unwrap(d),[stat]);
      }else if(type==='crimes'){
        const d=await api('/user/personalstats?cat=criminaloffenses');
        const data=unwrap(d);
        value=numberFrom(data,['crimes','criminaloffenses','criminaloffences']);
        if(value===undefined){
          const nums=[];
          const walk=o=>{if(!o||typeof o!=='object'||Array.isArray(o))return;Object.values(o).forEach(v=>{if(typeof v==='number')nums.push(v);else if(v&&typeof v==='object')walk(v)})};
          walk(data);
          value=nums.reduce((a,b)=>a+b,0);
        }
      }
      if(value===undefined||value===null)throw new Error('Torn hat für diese Statistik keinen passenden Wert zurückgegeben.');
      const label={money:'Geld / Net Worth',rank:'Rank',crimes:'Crimes',attacks:'Attacks Won',defends:'Defends Won'}[type]||type;
      status.innerHTML=`<strong>${label}:</strong> ${typeof value==='number'?value.toLocaleString('de-DE'):String(value)}`;
    }catch(e){status.innerHTML=`❌ ${String(e.message||e)}`}
  }

  function patch(){
    if(typeof window.loadAdvanced!=='function')return false;
    if(window.__tornTrackerFullAccessPatched)return true;
    window.loadAdvanced=load;
    window.__tornTrackerFullAccessPatched=true;
    return true;
  }

  function refreshVisibility(){
    const advanced=document.querySelector('.advanced-card');
    if(!advanced)return;
    advanced.style.display=isAdmin()?'':'none';
  }

  function patchCustomizer(){
    if(typeof window.openCustomizer!=='function')return false;
    if(window.__tornTrackerCustomizerPatched)return true;
    const original=window.openCustomizer;
    window.openCustomizer=function(){
      original();
      const modal=document.getElementById('customModal');
      if(!modal)return;
      if(!isAdmin()){
        modal.querySelectorAll('.checks label').forEach(label=>{
          const input=label.querySelector('input');
          if(input&&['crime','attacks','defends'].includes(input.value))label.remove();
        });
      }
    };
    window.__tornTrackerCustomizerPatched=true;
    return true;
  }

  function install(){return patch()&&patchCustomizer()}
  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},50);
    setTimeout(()=>clearInterval(timer),10000);
  }
  window.addEventListener('tornTrackerAdminChanged',()=>{refreshVisibility();if(typeof window.loadDashboard==='function')window.loadDashboard()});
  setInterval(refreshVisibility,500);
})();
