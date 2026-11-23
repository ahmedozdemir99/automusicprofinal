const json=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":status===200?"public, max-age=1800":"no-store"}});
async function getJson(url){
 const response=await fetch(url,{headers:{"Accept":"application/json"},signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error("HTTP "+response.status);
 const data=await response.json();
 if(data.code!==200||!data.data)throw Error("Invalid Quran response");
 return data.data;
}
export async function onRequestGet({params}){
 const number=Number(params.number);
 if(!Number.isInteger(number)||number<1||number>114)return json({error:"Geçersiz sure numarası"},400);
 try{
  // Fetch editions independently: the multi-edition endpoint is not always available.
  const arabic=await getJson("https://api.alquran.cloud/v1/surah/"+number+"/quran-uthmani");
  let translation=null,edition="";
  for(const id of ["tr.diyanet","tr.ates","tr.golpinarli"]){
   try{
    const candidate=await getJson("https://api.alquran.cloud/v1/surah/"+number+"/"+id);
    if(candidate.ayahs?.length===arabic.ayahs?.length){translation=candidate;edition=id;break}
   }catch{}
  }
  if(!arabic.ayahs?.length)throw Error("Missing Arabic verses");
  const ayahs=arabic.ayahs.map((a,i)=>({numberInSurah:a.numberInSurah,globalNumber:a.number,arabicText:a.text||"",turkishMeal:translation?.ayahs?.[i]?.text||""}));
  return json({surahNumber:number,arabicName:arabic.name,ayahCount:ayahs.length,source:translation?"AlQuran Cloud ("+edition+")":"AlQuran Cloud (Arapça metin; Türkçe meal geçici olarak alınamadı)",ayahs});
 }catch(e){
  return json({error:"Kur'an metni alınamadı. Lütfen yeniden deneyin.",details:"Quran upstream unavailable"},503);
 }
}
