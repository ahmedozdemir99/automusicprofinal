export async function onRequestGet({env}) {
  let databaseConnected=false;
  if(env.DB){
    try { await env.DB.prepare("SELECT COUNT(*) AS n FROM catalog_categories").first(); databaseConnected=true; }
    catch { databaseConnected=false; }
  }
  return Response.json({
    databaseConnected,
    quranApiConnected:true,
    internetArchiveConnected:true,
    jamendoConfigured:Boolean(env.JAMENDO_CLIENT_ID),
    localArchiveReady:true,
    openCatalogAvailable:true
  },{headers:{"Cache-Control":"no-store"}});
}
