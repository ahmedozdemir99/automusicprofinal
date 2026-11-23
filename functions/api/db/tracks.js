export async function onRequestGet({env}){
 if(!env.DB)return Response.json({error:"D1 DB binding missing"},{status:503});
 try{
  const r=await env.DB.prepare("SELECT payload FROM catalog_tracks ORDER BY updated_at DESC LIMIT 2000").all();
  return Response.json({tracks:(r.results||[]).map(x=>{try{return JSON.parse(x.payload)}catch{return null}}).filter(Boolean)},{headers:{"Cache-Control":"no-store"}});
 }catch{return Response.json({error:"D1 schema not initialized"},{status:503})}
}
