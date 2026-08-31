const app = document.getElementById('app');
const savedKey = sessionStorage.getItem('tornApiKey');

const stats = [
  ['Level','level'], ['Cash','money'], ['Energy','energy'], ['Nerve','nerve'],
  ['Happy','happy'], ['Life','life'], ['Rank','rank'], ['Net Worth','networth']
];

function login(){
  app.innerHTML = `<main class="login"><div class="eyebrow">Torn dashboard</div><h1>Willkommen bei TornTracker</h1><p class="muted">Gib deinen Torn API-Key ein, um dein persönliches Dashboard zu laden.</p><input id="apiKey" class="field" type="password" autocomplete="off" placeholder="Torn API-Key"><button class="primary" id="connect">Verbinden</button><p class="muted">Der Key wird nur für diese Sitzung im Browser gespeichert.</p><div id="error" class="error"></div></main>`;
  document.getElementById('connect').onclick = () => {
    const key = document.getElementById('apiKey').value.trim();
    if(!key){document.getElementById('error').textContent='Bitte einen API-Key eingeben.';return;}
    sessionStorage.setItem('tornApiKey', key); location.reload();
  };
}

function dashboard(data={}){
  app.innerHTML = `<div class="shell"><header class="topbar"><div class="brand">Torn<span>Tracker</span></div><button class="menu-btn" id="menu">☰</button></header><main class="content"><section class="welcome"><div class="eyebrow">Dashboard</div><h1>Deine Torn-Statistiken</h1><p class="muted">Wähle später selbst aus, welche Werte du sehen möchtest.</p></section><section class="grid" id="stats"></section><section class="section"><h2>Markt & Bazaar</h2><p class="muted">Die Marktansicht ist vorbereitet. Für echte Torn-Marktdaten wird ein Backend empfohlen, damit API-Zugriffe und Caching sicher verwaltet werden.</p></section></main></div><div id="overlay" class="overlay hidden"></div><aside id="drawer" class="drawer hidden"><button class="menu-btn" id="close">×</button><h2>Menü</h2><div class="nav"><button data-page="dashboard">📊 Dashboard</button><button data-page="market">🏪 Item Market</button><button data-page="bazaar">🛒 Bazaar</button><button data-page="settings">⚙ Einstellungen</button><button id="logout">🔑 API-Key entfernen</button></div></aside>`;
  const container=document.getElementById('stats');
  stats.forEach(([label,key])=>{const value=data[key] ?? '—';container.innerHTML += `<article class="card"><div class="label">${label}</div><div class="value">${escapeHtml(String(value))}</div></article>`});
  document.getElementById('menu').onclick=()=>toggle(true); document.getElementById('close').onclick=()=>toggle(false); document.getElementById('overlay').onclick=()=>toggle(false);
  document.getElementById('logout').onclick=()=>{sessionStorage.removeItem('tornApiKey');location.reload()};
  document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
}
function toggle(open){document.getElementById('drawer').classList.toggle('hidden',!open);document.getElementById('overlay').classList.toggle('hidden',!open)}
function page(name){
  toggle(false);
  if(name==='market'||name==='bazaar') alert('Diese Ansicht benötigt noch den Torn-API-Proxy. Der nächste Schritt ist ein Backend mit sicherem API-Key-Handling.');
  if(name==='settings') alert('Dashboard-Anpassungen können hier als nächstes ergänzt werden.');
}
function escapeHtml(s){return s.replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]))}

if(savedKey) dashboard(); else login();
