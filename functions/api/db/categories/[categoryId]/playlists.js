import {defaultCategories} from "../../categories.js";
export async function onRequestGet({env,params,request}){
 if(!env.DB)return Response.json({error:"D1 DB binding missing"},{status:503});
 const categoryId=String(params.categoryId||"");
 if(!/^[a-zA-Z0-9_-]{1,80}$/.test(categoryId))return Response.json({error:"Invalid category"},{status:400});
 try{
  const r=await env.DB.prepare("SELECT payload FROM catalog_tracks WHERE category_id=? ORDER BY updated_at DESC LIMIT 250").bind(categoryId).all();
  const cached=(r.results||[]).map(x=>{try{return JSON.parse(x.payload)}catch{return null}}).filter(Boolean);
  if(cached.length && new URL(request.url).searchParams.get("refresh")!=="1")
   return Response.json({playlists:[],tracks:cached,notice:"D1 veritabanında önbelleğe alınmış lisanslı kayıtlar."});
  const category=defaultCategories.find(c=>c.id===categoryId);
  if(!category || category.isQuran)return Response.json({playlists:[],tracks:cached});
  const url=new URL("/api/catalog/open-music",request.url);
  for(const [key,value] of Object.entries({categoryId,language:category.language,genre:category.genre,motif:category.motif}))url.searchParams.set(key,value);
  const upstream=await env.ASSETS?.fetch ? await env.ASSETS.fetch(new Request(url.toString())) : await fetch(url.toString());
  if(!upstream.ok)throw Error("catalog unavailable");
  const data=await upstream.json();
  const tracks=(data.tracks||[]).filter(t=>t.categoryId===categoryId&&t.contentId&&t.streamUrl);
  if(tracks.length){
   const statements=tracks.map(t=>env.DB.prepare("INSERT INTO catalog_tracks(content_id,category_id,payload,updated_at) VALUES (?,?,?,unixepoch()) ON CONFLICT(content_id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at").bind(t.contentId,categoryId,JSON.stringify(t)));
   for(let i=0;i<statements.length;i+=40)await env.DB.batch(statements.slice(i,i+40));
  }
  return Response.json({playlists:[],tracks:tracks.length?tracks:cached,notice:data.notice||"Açık lisanslı katalog; doğrulanmış Spotify kayıtları değildir."});
 }catch{return Response.json({playlists:[],tracks:[],notice:"D1 sorgusu veya açık müzik sağlayıcısı başarısız oldu. Listeyi yenileyin."},{status:503})}
}
