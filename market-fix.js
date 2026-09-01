// TornTracker: robuste Markt-/Item-Suche ohne numerische IDs.
(function(){
  const API='https://api.torn.com/v2';
  const key=()=>localStorage.getItem('tornApiKey');
  const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]));
  const money=n=>typeof n==='number'?'$'+n.toLocaleString('en-US'):String(n??'—');

  async function api(path){
    const r=await fetch(API+path,{headers:{Authorization:`ApiKey ${key()}`,Accept:'application/json'}});
    const d=await r.json().catch(()=>({}));
    if(!r.ok||d?.error)throw new Error(d?.error?.error||d?.error?.message||`Torn API Fehler (HTTP ${r.status})`);
    return d;
  }

  function normalizeItems(data){
    const raw=data?.items??data;
    if(Array.isArray(raw))return raw.map((x,i)=>({...x,id:x?.id??i})).filter(x=>x&&x.name);
    if(raw&&typeof raw==='object')return Object.entries(raw).map(([id,x])=>({...x,id:x?.id??id})).filter(x=>x&&x.name);
    return [];
  }

  async function getItems(){
    try{
      const cached=JSON.parse(localStorage.getItem('tornTrackerItemsV2')||'null');
      if(Array.isArray(cached)&&cached.length)return cached;
    }catch(_){ }
    const d=await api('/torn/items');
    const items=normalizeItems(d);
    if(!items.length)throw new Error('Die Torn-API hat keine Item-Liste geliefert.');
    try{localStorage.setItem('tornTrackerItemsV2',JSON.stringify(items))}catch(_){ }
    return items;
  }

  function findItem(items,name){
    const q=name.trim().toLowerCase();
    if(!q)return null;
    return items.find(x=>String(x.name).toLowerCase()===q)||items.find(x=>String(x.name).toLowerCase().includes(q))||null;
  }

  function listingArray(data){
    const candidates=[data?.itemmarket,data?.listings,data?.items,data?.market,data?.bazaar];
    for(const c of candidates){
      if(Array.isArray(c))return c;
      if(c&&typeof c==='object'){
        const nested=[c.listings,c.items,c.itemmarket,c.bazaar];
        for(const n of nested)if(Array.isArray(n))return n;
        const vals=Object.values(c).filter(v=>v&&typeof v==='object');
        if(vals.length&&vals.some(v=>('price' in v)||('cost' in v)||('seller' in v)||('quantity' in v)))return vals;
      }
    }
    return [];
  }

  function renderResults(type,item,data){
    const root=document.getElementById('marketResults');
    if(!root)return;
    if(type==='bazaar'){
      root.innerHTML=`<div class="market-empty"><strong>Bazaar-Angebote sind über die öffentliche Torn-API derzeit nicht verfügbar.</strong><p>Die Item-Market-Daten funktionieren weiterhin über die aktuelle API.</p></div>`;
      return;
    }
    const rows=listingArray(data);
    if(!rows.length){
      root.innerHTML=`<div class="market-empty"><strong>Keine Angebote gefunden</strong><p>Für <b>${esc(item.name)}</b> liefert die Torn-API aktuell keine Item-Market-Angebote.</p></div>`;
      return;
    }
    rows.sort((a,b)=>Number(a.price??a.cost??Infinity)-Number(b.price??b.cost??Infinity));
    root.innerHTML=`<div class="market-results-large"><div class="market-title"><span>${esc(item.name)}</span><small>${rows.length} Angebote</small></div>${rows.slice(0,100).map((x,i)=>{const price=x.price??x.cost??x.market_price??x.value;const qty=x.quantity??x.amount??x.qty??1;const seller=x.seller?.name??x.seller_name??x.seller??x.user?.name??x.owner_name??'Unbekannter Verkäufer';return `<div class="market-row"><span class="market-rank">#${i+1}</span><span class="market-seller">${esc(seller)}</span><span class="market-qty">${esc(qty)}</span><strong>${money(price)}</strong></div>`}).join('')}</div>`;
  }

  async function search(type){
    const input=document.getElementById('marketItemName');
    const root=document.getElementById('marketResults');
    if(!input||!root)return;
    const name=input.value.trim();
    if(!name){root.innerHTML='<div class="market-empty">Bitte einen Item-Namen eingeben.</div>';return;}
    root.innerHTML='<div class="market-loading">⏳ Suche Item und Angebote…</div>';
    try{
      const items=await getItems();
      const item=findItem(items,name);
      if(!item){root.innerHTML=`<div class="market-empty"><strong>Item nicht gefunden</strong><p>Prüfe die Schreibweise des Item-Namens.</p></div>`;return;}
      const d=await api(`/market/${encodeURIComponent(item.id)}/itemmarket`);
      renderResults(type,item,d);
    }catch(e){root.innerHTML=`<div class="market-empty"><strong>Markt konnte nicht geladen werden</strong><p>${esc(e.message)}</p></div>`}
  }

  window.marketPage=function(type){
    const title=type==='bazaar'?'Bazaar':'Item Market';
    app.innerHTML=`<div class="shell"><header class="topbar"><div class="brand">Torn<span>Tracker</span></div><button class="menu-btn" id="menu">☰</button></header><main class="content market-page"><div class="eyebrow">Markt</div><h1>${title}</h1><p class="muted">Suche direkt nach dem Namen eines Items.</p><div class="market-search-box"><label for="marketItemName">Item suchen</label><div class="search-line-large"><input id="marketItemName" class="market-search-input" type="text" autocomplete="off" placeholder="Item-Name eingeben…"><button class="primary market-search-button" id="marketSearch">Suchen</button></div><div class="market-help">Keine numerische ID nötig.</div></div><section id="marketResults" class="market-results-large"><div class="market-empty">Gib einen Item-Namen ein und starte die Suche.</div></section></main></div><div id="overlay" class="overlay hidden"></div><aside id="drawer" class="drawer hidden"><button class="menu-btn" id="close">×</button><h2>Menü</h2><div class="nav"><button data-page="dashboard">📊 Dashboard</button><button data-page="market">🏪 Item Market</button><button data-page="bazaar">🛒 Bazaar</button><button data-page="settings">⚙ Einstellungen</button><button id="logout">🔑 API-Key löschen</button></div></aside>`;
    wireMenu();
    document.getElementById('marketSearch').onclick=()=>search(type);
    document.getElementById('marketItemName').addEventListener('keydown',e=>{if(e.key==='Enter')search(type)});
  };
})();
