// TornTracker: Startschutz – zeigt einen verständlichen Fehler, falls ein Script den App-Start verhindert.
(function(){
  let started=false;
  window.addEventListener('tornTrackerStarted',()=>{started=true});
  window.addEventListener('error',function(e){
    const app=document.getElementById('app');
    if(!app)return;
    if(app.children.length===0){
      app.innerHTML='<main style="max-width:760px;margin:80px auto;padding:28px;color:#eef3ff;font-family:system-ui;background:#111a2d;border:1px solid #263252;border-radius:16px"><h1>TornTracker konnte nicht gestartet werden</h1><p>Ein JavaScript-Fehler verhindert den Start.</p><p style="opacity:.75">Fehler: '+String(e.message||'Unbekannter Fehler').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</p><p style="opacity:.75">Datei: '+String(e.filename||'unbekannt')+'</p><p style="opacity:.75">Zeile: '+String(e.lineno||'?')+'</p></main>';
    }
  },true);
  setTimeout(function(){
    const app=document.getElementById('app');
    if(app&&app.children.length===0&&!started){
      app.innerHTML='<main style="max-width:760px;margin:80px auto;padding:28px;color:#eef3ff;font-family:system-ui;background:#111a2d;border:1px solid #263252;border-radius:16px"><h1>TornTracker startet nicht</h1><p>Die JavaScript-Datei wurde wahrscheinlich nicht korrekt geladen.</p><p style="opacity:.75">Bitte Seite mit Strg + F5 neu laden.</p></main>';
    }
  },2500);
})();
