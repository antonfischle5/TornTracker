// TornTracker: Full-Access-Statistiken sind ausschließlich für den Admin sichtbar.
(function(){
  const AUTH_KEY='tornTrackerAdminAuth';
  const isAdmin=()=>sessionStorage.getItem(AUTH_KEY)==='1';

  function adminRequiredMessage(){
    const old=document.getElementById('fullAccessAdminModal');
    if(old)old.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="modal-wrap" id="fullAccessAdminModal"><div class="modal"><h2>🔒 Admin erforderlich</h2><p class="muted">Die Full-Access-Statistiken sind nur für den Admin verfügbar.</p><div class="modal-actions"><button class="primary small-btn" id="fullAccessAdminLogin">🔐 Admin Login</button><button class="secondary" id="fullAccessAdminClose">Schließen</button></div></div></div>`);
    document.getElementById('fullAccessAdminClose').onclick=()=>document.getElementById('fullAccessAdminModal')?.remove();
    document.getElementById('fullAccessAdminLogin').onclick=()=>{
      document.getElementById('fullAccessAdminModal')?.remove();
      document.querySelector('#adminLoginButton')?.click();
    };
  }

  function lockAdvancedPanel(){
    const panel=document.getElementById('advancedPanel');
    if(!panel)return;
    if(isAdmin())return;
    panel.innerHTML='<div class="advanced-status">🔒 <strong>Nur für Admins.</strong><br>Full-Access-Statistiken können nur nach dem Admin-Login verwendet werden.<br><button class="secondary" id="advancedAdminLogin">🔐 Admin Login</button></div>';
    panel.classList.remove('hidden');
    document.getElementById('advancedAdminLogin').onclick=()=>document.querySelector('#adminLoginButton')?.click() || adminRequiredMessage();
  }

  function patchDashboard(){
    if(typeof window.dashboard!=='function'||window.__fullAccessDashboardPatched)return false;
    const original=window.dashboard;
    window.dashboard=function(){
      original();
      if(!isAdmin()){
        const toggle=document.getElementById('advancedToggle');
        if(toggle)toggle.onclick=()=>{lockAdvancedPanel();document.getElementById('advancedPanel')?.classList.remove('hidden')};
        lockAdvancedPanel();
      }
    };
    window.__fullAccessDashboardPatched=true;
    return true;
  }

  function patchCustomizer(){
    if(typeof window.openCustomizer!=='function'||window.__fullAccessCustomizerPatched)return false;
    const original=window.openCustomizer;
    window.openCustomizer=function(){
      if(isAdmin()){original();return;}
      original();
      const modal=document.getElementById('customModal');
      if(!modal)return;
      modal.querySelectorAll('.checks label').forEach(label=>{
        const input=label.querySelector('input');
        if(input&&['crime','attacks','defends'].includes(input.value))label.remove();
      });
      const note=document.createElement('p');
      note.className='muted';
      note.innerHTML='🔒 Full-Access-Statistiken sind nur für den Admin verfügbar.';
      modal.querySelector('.checks')?.prepend(note);
    };
    window.__fullAccessCustomizerPatched=true;
    return true;
  }

  function patchSettings(){
    if(typeof window.settingsPage!=='function'||window.__fullAccessSettingsPatched)return false;
    const original=window.settingsPage;
    window.settingsPage=function(){
      original();
      const apiSection=[...document.querySelectorAll('.settings-section')].find(s=>s.textContent.includes('API-Keys'));
      if(apiSection&&!isAdmin()){
        const body=apiSection.querySelector('.settings-body');
        if(body){
          const fullInput=document.getElementById('fullKeyInput');
          const fullText=[...body.querySelectorAll('p')].find(p=>p.textContent.includes('Optionaler Full-Access-Key'));
          if(fullText)fullText.style.display='none';
          if(fullInput)fullInput.parentElement?.remove();
          const fullButtons=[...body.querySelectorAll('button')].filter(b=>b.id==='removeFull'||b.id==='saveFull');
          fullButtons.forEach(b=>b.remove());
          const notice=document.createElement('div');
          notice.className='advanced-status';
          notice.innerHTML='🔒 <strong>Full-Access-Key nur für Admins.</strong><br><button class="secondary" id="settingsFullAdminLogin">🔐 Admin Login</button>';
          body.appendChild(notice);
          notice.querySelector('button').onclick=()=>document.querySelector('#adminLoginButton')?.click() || adminRequiredMessage();
        }
      }
    };
    window.__fullAccessSettingsPatched=true;
    return true;
  }

  function patchAdvancedLoader(){
    if(typeof window.loadAdvanced!=='function'||window.__fullAccessLoaderPatched)return false;
    const original=window.loadAdvanced;
    window.loadAdvanced=function(type){
      if(!isAdmin()){
        lockAdvancedPanel();
        return;
      }
      return original(type);
    };
    window.__fullAccessLoaderPatched=true;
    return true;
  }

  function install(){
    const ok=[patchDashboard(),patchCustomizer(),patchSettings(),patchAdvancedLoader()];
    return ok.some(Boolean)||(
      window.__fullAccessDashboardPatched&&window.__fullAccessCustomizerPatched&&window.__fullAccessSettingsPatched&&window.__fullAccessLoaderPatched
    );
  }

  if(!install()){
    const timer=setInterval(()=>{if(install())clearInterval(timer)},50);
    setTimeout(()=>clearInterval(timer),10000);
  }

  document.addEventListener('click',e=>{
    const btn=e.target.closest('.advanced-stat');
    if(btn&&!isAdmin()){
      e.preventDefault();
      e.stopImmediatePropagation();
      lockAdvancedPanel();
      return false;
    }
  },true);
})();
