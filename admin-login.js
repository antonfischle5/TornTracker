// TornTracker: einfacher Admin-Bereich mit maximal 3 Passwortversuchen.
(function(){
  const ADMIN_PASSWORD='11092012';
  const ATTEMPTS_KEY='tornTrackerAdminAttempts';
  const AUTH_KEY='tornTrackerAdminAuth';
  const MAX_ATTEMPTS=3;

  function isAdmin(){return sessionStorage.getItem(AUTH_KEY)==='1'}
  function attempts(){return Number(sessionStorage.getItem(ATTEMPTS_KEY)||'0')}

  function showAdminLogin(){
    if(isAdmin()){return showAdminPanel()}
    const old=document.getElementById('adminLoginModal');
    if(old)old.remove();
    const used=attempts();
    if(used>=MAX_ATTEMPTS){
      alert('Admin-Login gesperrt: 3 falsche Versuche wurden erreicht.');
      return;
    }
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-wrap" id="adminLoginModal"><div class="modal"><h2>🔐 Admin Login</h2><p class="muted">Gib das Admin-Passwort ein.</p><input id="adminPassword" class="field" type="password" autocomplete="off" placeholder="Admin-Passwort"><div id="adminLoginError" class="error"></div><div class="modal-actions"><button class="secondary" id="adminCancel">Abbrechen</button><button class="primary small-btn" id="adminSubmit">Einloggen</button></div></div></div>`);
    const input=document.getElementById('adminPassword');
    const error=document.getElementById('adminLoginError');
    const close=()=>document.getElementById('adminLoginModal')?.remove();
    document.getElementById('adminCancel').onclick=close;
    const submit=()=>{
      if(input.value===ADMIN_PASSWORD){
        sessionStorage.setItem(AUTH_KEY,'1');
        sessionStorage.removeItem(ATTEMPTS_KEY);
        close();
        showAdminPanel();
        return;
      }
      const next=attempts()+1;
      sessionStorage.setItem(ATTEMPTS_KEY,String(next));
      const left=MAX_ATTEMPTS-next;
      if(left<=0){close();alert('Falsches Passwort. Admin-Login wurde nach 3 Versuchen gesperrt.');}
      else error.textContent=`Falsches Passwort. Noch ${left} Versuch${left===1?'':'e'}.`;
      input.value='';input.focus();
    };
    document.getElementById('adminSubmit').onclick=submit;
    input.addEventListener('keydown',e=>{if(e.key==='Enter')submit()});
    setTimeout(()=>input.focus(),50);
  }

  function showAdminPanel(){
    const old=document.getElementById('adminPanelModal');
    if(old)old.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-wrap" id="adminPanelModal"><div class="modal"><h2>🛠️ Admin-Bereich</h2><p class="muted">Du bist als Admin angemeldet.</p><div class="settings-body"><p>Hier können später Admin-Funktionen hinzugefügt werden.</p></div><div class="modal-actions"><button class="secondary" id="adminLogout">Admin ausloggen</button><button class="primary small-btn" id="adminClose">Schließen</button></div></div></div>`);
    document.getElementById('adminClose').onclick=()=>document.getElementById('adminPanelModal')?.remove();
    document.getElementById('adminLogout').onclick=()=>{sessionStorage.removeItem(AUTH_KEY);sessionStorage.removeItem(ATTEMPTS_KEY);document.getElementById('adminPanelModal')?.remove()};
  }

  function patchSettings(){
    if(typeof window.settingsPage!=='function')return false;
    if(window.__tornTrackerAdminPatched)return true;
    const original=window.settingsPage;
    window.settingsPage=function(){
      original();
      const list=document.querySelector('.settings-list');
      if(!list||document.getElementById('adminSettingsSection'))return;
      const section=document.createElement('section');
      section.className='settings-section';
      section.id='adminSettingsSection';
      section.innerHTML='<button class="settings-trigger"><span>🛠️ Admin</span><span>⌄</span></button><div class="settings-body"><p>Admin-Funktionen sind durch ein Passwort geschützt.</p><button class="secondary" id="adminLoginButton">🔐 Admin Login</button></div>';
      list.appendChild(section);
      section.querySelector('.settings-trigger').onclick=()=>section.classList.toggle('open');
      section.querySelector('#adminLoginButton').onclick=showAdminLogin;
    };
    window.__tornTrackerAdminPatched=true;
    return true;
  }

  if(!patchSettings()){
    const timer=setInterval(()=>{if(patchSettings())clearInterval(timer)},50);
    setTimeout(()=>clearInterval(timer),10000);
  }
})();
