// Metadata only. MusicBrainz does not grant streaming rights.
const ARTISTS={
  "arabesk": [
    "Müslüm Gürses",
    "Orhan Gencebay",
    "İbrahim Tatlıses",
    "Ferdi Tayfur",
    "Bergen",
    "Hakkı Bulut",
    "Kibariye",
    "Ebru Gündeş",
    "Hakan Taşıyan",
    "Cengiz Kurtoğlu",
    "Ümit Besen",
    "Güllü"
  ],
  "turk_pop": [
    "Sezen Aksu",
    "Tarkan",
    "Ajda Pekkan",
    "Sertab Erener",
    "Kenan Doğulu",
    "Mustafa Sandal",
    "Nilüfer",
    "Yıldız Tilbe",
    "Hande Yener",
    "Gülşen",
    "Sıla",
    "Mabel Matiz",
    "Teoman",
    "Göksel"
  ],
  "nostalji": [
    "Barış Manço",
    "Cem Karaca",
    "Erkin Koray",
    "Zeki Müren",
    "Müzeyyen Senar",
    "Kayahan",
    "MFÖ",
    "İlhan İrem",
    "Edip Akbayram",
    "Fikret Kızılok",
    "Bülent Ortaçgil",
    "Selda Bağcan"
  ],
  "turkuler": [
    "Neşet Ertaş",
    "Aşık Veysel",
    "Arif Sağ",
    "Musa Eroğlu",
    "Sabahat Akkiraz",
    "Muharrem Ertaş",
    "Yavuz Top",
    "Belkıs Akkale",
    "Zara",
    "İzzet Altınmeşe",
    "Tolga Sağ",
    "Erdal Erzincan",
    "Güler Duman"
  ],
  "karadeniz": [
    "Kazım Koyuncu",
    "Volkan Konak",
    "Resul Dindar",
    "Selçuk Balcı",
    "İsmail Türüt",
    "Fuat Saka",
    "Ekin Uzunlar",
    "Şevval Sam",
    "Cimilli İbo",
    "Apolas Lermi",
    "Marsis"
  ],
  "turk_sanat": [
    "Zeki Müren",
    "Müzeyyen Senar",
    "Bülent Ersoy",
    "Emel Sayın",
    "Muazzez Ersoy",
    "Ahmet Özhan"
  ],
  "turk_rock": [
    "Duman",
    "mor ve ötesi",
    "maNga",
    "Şebnem Ferah",
    "Teoman",
    "Athena",
    "Gripin",
    "Pentagram",
    "Kurban",
    "Kargo"
  ],
  "ozgun": [
    "Ahmet Kaya",
    "Grup Yorum",
    "Ferhat Tunç",
    "Onur Akın",
    "Yeni Türkü",
    "Ezginin Günlüğü",
    "Zülfü Livaneli"
  ],
  "ilahi": [
    "Abdurrahman Önül",
    "Mustafa Demirci",
    "Sedat Uçan",
    "Eşref Ziya Terzi",
    "Ömer Karaoğlu"
  ],
  "ezgi": [
    "Eşref Ziya Terzi",
    "Ömer Karaoğlu",
    "Mustafa Demirci",
    "Grup Genç"
  ],
  "nesid": [
    "Maher Zain",
    "Sami Yusuf",
    "Mesut Kurtis",
    "Ahmed Bukhatir"
  ],
  "zikirli_ilahiler": [
    "Ahmet Özhan",
    "Mustafa Demirci",
    "Abdurrahman Önül"
  ],
  "tasavvuf": [
    "Ahmet Özhan",
    "Kudsi Erguner",
    "Ömer Faruk Tekbilek",
    "Necdet Yaşar"
  ],
  "azerice": [
    "Alim Qasimov",
    "Rashid Behbudov",
    "Brilliant Dadaşova",
    "Aygün Kazımova"
  ],
  "arapca": [
    "Fairuz",
    "Umm Kulthum",
    "Amr Diab",
    "Nancy Ajram"
  ],
  "lazca": [
    "Kazım Koyuncu",
    "Birol Topaloğlu",
    "Marsis",
    "Zuğaşi Berepe"
  ]
};
const clean=s=>String(s||"").trim().slice(0,100);
export async function onRequestGet({request}){
 const url=new URL(request.url),category=clean(url.searchParams.get("categoryId"));
 const names=ARTISTS[category]||[];
 if(!names.length)return Response.json({artists:[],albums:[],notice:"Bu kategori için doğrulanmış sanatçı seçkisi henüz hazırlanmadı."});
 const requested=clean(url.searchParams.get("artist"));
 if(!requested)return Response.json({artists:names,albums:[],metadataOnly:true});
 if(!names.includes(requested))return Response.json({error:"Sanatçı bu seçkide yok."},{status:400});
 const q='artist:"'+requested.replace(/["\\]/g,"")+'" AND primarytype:album';
 const endpoint=new URL("https://musicbrainz.org/ws/2/release-group/");
 endpoint.searchParams.set("query",q);endpoint.searchParams.set("fmt","json");endpoint.searchParams.set("limit","100");
 try{
 const res=await fetch(endpoint.toString(),{headers:{"User-Agent":"AutoMusicPro4/1.0 (https://automusicpro4.pages.dev/)","Accept":"application/json"},cf:{cacheTtl:3600,cacheEverything:true}});
 if(!res.ok)throw Error("MusicBrainz "+res.status);
 const data=await res.json();
 const norm=s=>String(s||"").toLocaleLowerCase("tr-TR").trim();
 const albums=(data["release-groups"]||[]).filter(x=>(x["artist-credit"]||[]).some(a=>norm(a.artist?.name||a.name)===norm(requested))&&x["primary-type"]==="Album").map(x=>({id:x.id,title:x.title,year:(x["first-release-date"]||"").slice(0,4),artist:requested,coverUrl:"https://coverartarchive.org/release-group/"+encodeURIComponent(x.id)+"/front-250",sourceUrl:"https://musicbrainz.org/release-group/"+encodeURIComponent(x.id)}));
 return Response.json({artists:names,albums,metadataOnly:true,notice:"Albüm bilgileri MusicBrainz kaynağındandır. Bu albümler uygulama içinde çalınamaz."},{headers:{"Cache-Control":"public, max-age=3600"}});
 }catch{return Response.json({artists:names,albums:[],metadataOnly:true,notice:"Albüm veritabanına şu anda ulaşılamıyor. Daha sonra yeniden deneyin."});}
}