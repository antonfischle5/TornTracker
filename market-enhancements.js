// TornTracker: Verbesserungen für Market/Bazaar – Sortierung und Preisübersicht.
(function(){
  const money=n=>'$'+Number(n).toLocaleString('en-US');
  const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]));
  let lastResults=null;

  function enhance(){
    const out=document.getElementById('marketResults');
    if(!out||!out.querySelector('.market-list')||out.dataset.enhanced==='1')return;
    const rows=[...out.querySelectorAll('.market-row')];
    const data=rows.map(row=>({row,price:Number(row.querySelector('strong')?.textContent.replace(/[^0-9.-]/g,''))||Infinity,quantity:Number(row.querySelector('.muted')?.textContent)||0}));
    if(!data.length)return;
    out.dataset.enhanced='1';
    lastResults=data;
    const prices=data.map(x=>x.price).filter(Number.isFinite);
    const cheapest=Math.min(...prices),highest=Math.max(...prices),avg=prices.reduce((a,b)=>a+b,0)/prices.length;
    const controls=document.createElement('div');
    controls.className='market-tools';
    controls.innerHTML=`<div class="market-summary"><div><small>Günstigster</small><strong>${money(cheapest)}</strong></div><div><small>Durchschnitt</small><strong>${money(Math.round(avg))}</strong></div><div><small>Höchster</small><strong>${money(highest)}</strong></div></div><div class="market-sort"><label for="marketSort">Sortieren</label><select id="marketSort" class="field"><option value="priceAsc">Preis: günstig → teuer</option><option value="priceDesc">Preis: teuer → günstig</option><option value="quantityDesc">Menge: hoch → niedrig</option></select></div>`;
    const list=out.querySelector('.market-list');
    list.before(controls);
    const sort=controls.querySelector('#marketSort');
    sort.onchange=()=>{
      const sorted=[...data].sort((a,b)=>sort.value==='priceDesc'?b.price-a.price:sort.value==='quantityDesc'?b.quantity-a.quantity:a.price-b.price);
      sorted.forEach(x=>list.appendChild(x.row));
    };
  }

  const observer=new MutationObserver(()=>enhance());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  enhance();
})();
