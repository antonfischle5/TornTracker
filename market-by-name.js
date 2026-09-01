// TornTracker: Market/Bazaar-Suche nach Item-Namen statt nach IDs.
(function(){
  const API='https://api.torn.com/v2';
  const ITEMS_KEY='tornTrackerItemsCache';
  const DAY=86400000;

  async function api(path,key){
    const r=await fetch(API+path,{headers:{Authorization:`ApiKey ${key}`,Accept:'application/json'}});
    const text=await r.text();
    let d; try{d=JSON.parse(text)}catch{throw new Error(`Torn API hat keine gültige JSON-Antwort geliefert (HTTP ${r.status}).`)}
    if(!r.ok||d?.error)throw new Error(d?.error?.error||d?.error?.message||`Torn API Fehler (HTTP ${r.status}).`);
    return d;
  }

  function normalizeItems(data){
    const raw=data?.items||data;
    const out=[];
    if(Array.isArray(raw)){
      raw.forEach(x=>{if(x?.id&&x?.name)out.push({id:Number(x.id),name:String(x.name)})});
    }else if(raw&&typeof raw==='object'){
      Object.entries(raw).forEach(([id,x])=>{if(x?.name)out.push({id:Number(id),name:String(x.name)})});
    }
    return out.filter(x=>Number.isFinite(x.id)&&x.name).sort((a,b)=>a.name.localeCompare(b.name,'de'));
  }

  async function getItems(key){
    try{
      const cached=JSON.parse(localStorage.getItem(ITEMS_KEY)||'null');
      if(cached?.time&&Array.isArray(cached.items)&&(Date.now()-cached.time)<DAY)return cached.items;
    }catch{}
    const data=await api('/torn/items',key);
    const items=normalizeItems(data);
    if(!items.length)throw new Error('Die Torn-API hat keine Item-Liste geliefert.');
    localStorage.setItem(ITEMS_KEY,JSON.stringify({time:Date.now(),items}));
    return items;
  }

  function esc(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))}
  function money(n){return typeof n==='number'?'$'+n.toLocaleString('en-US'):String(n??'—')}

  function render(type){
    const title=type==='market'?'Item Market':'Bazaar';
    const app=document.getElementById('app');
    app.innerHTML=`<div class="shell"><header class="topbar"><div class="brand">Torn<span>Tracker</span></div><button class="menu-btn" id="nameMarketMenu">☰</button></header><main class="content"><section class="welcome"><div class="eyebrow">${title}</div><h1>Aktuelle Preise</h1><p class="muted">Gib den Namen des Items ein – die Item-ID wird automatisch gefunden.</p><div class="search-line"><input id="itemSearchByName" class="field search" autocomplete="off" placeholder="z. B. Xanax, Donator Pack, FHC …"><button class="primary search-btn" id="nameMarketSearch">Suchen</button></div><div id="itemSuggestions" class="item-suggestions"></div><div id="marketError" class="error"></div></section><section class="card" id="marketResults"><div class="muted">Noch keine Suche.</div></section></main></div><div id="overlay" class="overlay hidden"></div><aside id="drawer" class="drawer hidden"><button class="menu-btn" id="nameMarketClose">×</button><h2>Menü</h2><div class="nav"><button id="goDashboard">📊 Dashboard</button><button id="goMarket">🏪 Item Market</button><button id="goBazaar">🛒 Bazaar</button><button id="goSettings">⚙ Einstellungen</button><button id="nameMarketLogout">🔑 API-Key löschen</button></div></aside>`;
    const input=document.getElementById('itemSearchByName');
    const suggestions=document.getElementById('itemSuggestions');
    let items=[];
    const key=localStorage.getItem('tornApiKey');
    if(!key){window.loadDashboard?.();return}

    const closeMenu=()=>{document.getElementById('drawer').classList.add('hidden');document.getElementById('overlay').classList.add('hidden')};
    const openMenu=()=>{document.getElementById('drawer').classList.remove('hidden');document.getElementById('overlay').classList.remove('hidden')};
    document.getElementById('nameMarketMenu').onclick=openMenu;
    document.getElementById('nameMarketClose').onclick=closeMenu;
    document.getElementById('overlay').onclick=closeMenu;
    document.getElementById('goDashboard').onclick=()=>{closeMenu();window.loadDashboard?.()};
    document.getElementById('goMarket').onclick=()=>{closeMenu();render('market')};
    document.getElementById('goBazaar').onclick=()=>{closeMenu();render('bazaar')};
    document.getElementById('goSettings').onclick=()=>{closeMenu();window.settingsPage?.()};
    document.getElementById('nameMarketLogout').onclick=()=>{localStorage.removeItem('tornApiKey');location.reload()};

    getItems(key).then(list=>{items=list;input.disabled=false;input.placeholder='Item-Name eingeben…'}).catch(e=>{document.getElementById('marketError').textContent=e.message});

    input.addEventListener('input',()=>{
      const q=input.value.trim().toLowerCase();
      if(q.length<2){suggestions.innerHTML='';return}
      const hits=items.filter(x=>x.name.toLowerCase().includes(q)).slice(0,8);
      suggestions.innerHTML=hits.map(x=>`<button type="button" class="secondary item-suggestion" data-id="${x.id}">${esc(x.name)}</button>`).join('');
      suggestions.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{input.value=b.textContent.trim();suggestions.innerHTML='';search(type)});
    });
    input.addEventListener('keydown',e=>{if(e.key==='Enter')search(type)});
    document.getElementById('nameMarketSearch').onclick=()=>search(type);

    async function search(which){
      const q=input.value.trim().toLowerCase(),out=document.getElementById('marketResults'),err=document.getElementById('marketError');
      suggestions.innerHTML='';
      if(!q){err.textContent='Bitte einen Item-Namen eingeben.';return}
      let exact=items.find(x=>x.name.toLowerCase()===q);
      let matches=items.filter(x=>x.name.toLowerCase().includes(q));
      if(!exact&&matches.length===1)exact=matches[0];
      if(!exact){
        err.textContent=matches.length?`Mehrere Items gefunden: ${matches.slice(0,5).map(x=>x.name).join(', ')}. Bitte genauer suchen.`:'Kein Item mit diesem Namen gefunden.';
        return;
      }
      err.textContent='';out.innerHTML=`<div class="muted">Lade ${esc(exact.name)}…</div>`;
      try{
        const endpoint=which==='market'?'itemmarket':'bazaar';
        const d=await api(`/market/${exact.id}/${endpoint}`,key);
        const listings=d.itemmarket||d.bazaar||d.listings||[];
        const list=Array.isArray(listings)?listings:[];
        if(!list.length){out.innerHTML=`<h3>${esc(exact.name)}</h3><p class="muted">Keine Angebote gefunden.</p>`;return}
        const prices=list.map(x=>Number(x.price)).filter(Number.isFinite);
        const cheapest=prices.length?Math.min(...prices):null;
        out.innerHTML=`<div class="market-result-head"><div><div class="eyebrow">${which==='market'?'Item Market':'Bazaar'}</div><h2>${esc(exact.name)}</h2><p class="muted">Item-ID automatisch erkannt: ${exact.id} · ${list.length} Angebot${list.length===1?'':'e'}</p></div><div class="market-price"><small>Günstigster Preis</small><strong>${cheapest===null?'—':money(cheapest)}</strong></div></div><div class="market-list">${list.slice(0,50).map(x=>`<div class="market-row"><span>${esc(x.player_name||x.seller_name||x.seller||'Angebot')}</span><strong>${Number.isFinite(Number(x.price))?money(Number(x.price)):'—'}</strong><span class="muted">${x.quantity??x.amount??''}</span></div>`).join('')}</div>`;
      }catch(e){out.innerHTML='';err.textContent=e.message}
    }
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-page]');
    if(!btn)return;
    const page=btn.dataset.page;
    if(page!=='market'&&page!=='bazaar')return;
    e.preventDefault();e.stopImmediatePropagation();
    render(page);
  },true);
})();
