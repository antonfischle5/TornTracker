const TORN_API = 'https://api.torn.com/v2';

function cleanKey(key){
  return typeof key === 'string' && /^[A-Za-z0-9]{16}$/.test(key) ? key : null;
}

async function torn(path, key){
  const response = await fetch(`${TORN_API}${path}`, {headers:{Authorization:`ApiKey ${key}`,Accept:'application/json','User-Agent':'TornTracker/1.0'}});
  const data = await response.json().catch(()=>null);
  if(!response.ok){
    const message=data?.error?.error || data?.error || `Torn API HTTP ${response.status}`;
    throw new Error(String(message));
  }
  if(data?.error) throw new Error(data.error.error || 'Torn API error');
  return data;
}

function json(res,status,payload){res.status(status).json(payload)}

module.exports = async (req,res)=>{
  if(req.method!=='POST') return json(res,405,{error:'Nur POST ist erlaubt.'});
  const key=cleanKey(req.body?.apiKey);
  if(!key) return json(res,400,{error:'Ungültiger Torn API-Key.'});
  try{
    const route=req.query.route;
    if(route==='user/basic'){
      const d=await torn('/user/basic',key);
      return json(res,200,d);
    }
    if(route==='user/dashboard'){
      const [basic,bars,money,networth]=await Promise.all([
        torn('/user/basic',key),
        torn('/user/bars',key),
        torn('/user/money',key),
        torn('/user/networth',key)
      ]);
      return json(res,200,{profile:basic.profile||basic,bars:bars.bars||bars,money:money.money||money,networth:networth.networth||networth});
    }
    if(route==='market'){
      const kind=req.query.kind==='bazaar'?'bazaar':'market';
      const item=String(req.query.item||'');
      if(!/^\d+$/.test(item)) return json(res,400,{error:'Bitte eine numerische Item-ID verwenden.'});
      const endpoint=kind==='market'?`/market/${item}/itemmarket`:`/market/${item}/bazaar`;
      const d=await torn(endpoint,key);
      const listings=d.itemmarket||d.bazaar||d.listings||[];
      return json(res,200,{listings:Array.isArray(listings)?listings:[]});
    }
    return json(res,404,{error:'Unbekannte API-Route.'});
  }catch(error){return json(res,502,{error:error.message||'Torn API request failed.'})}
};
