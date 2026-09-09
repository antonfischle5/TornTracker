// TornTracker: Admin-Bereich sichtbar halten und Full-Access nach Login aktualisieren.
(function(){
  const AUTH_KEY='tornTrackerAdminAuth';
  let last=null;
  function isAdmin(){return sessionStorage.getItem(AUTH_KEY)==='1'}
  function sync(){
    const admin=isAdmin();
    const section=document.getElementById('adminSettingsSection');
    if(section)section.style.display='';
    document.querySelectorAll('.advanced-card').forEach(el=>el.style.display=admin?'':'none');
    document.querySelectorAll('.settings-section').forEach(el=>{
      if(el.textContent.includes('Optionaler Full-Access-Key'))el.style.display=admin?'':'none';
    });
    document.querySelectorAll('.checks label').forEach(label=>{
      const input=label.querySelector('input');
      if(input&&['crime','attacks','defends'].includes(input.value))label.style.display=admin?'':'none';
    });
    if(admin!==last){last=admin;window.dispatchEvent(new Event('tornTrackerAdminChanged'))}
  }
  sync();
  setInterval(sync,1000);
})();
