
const DEFAULTS = [
  "DTfiqzFCD9g",
  "DeCE4C7Itbc",
  "DZ8VwO0xNeg"
];

function decodeHtml(s){
  if(!s) return null;
  return s
    .replace(/\\u0026/g,"&")
    .replace(/\\\//g,"/")
    .replace(/&amp;/g,"&")
    .replace(/&quot;/g,'"');
}

async function fetchText(url){
  const r=await fetch(url,{
    headers:{
      "user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      "accept-language":"fi-FI,fi;q=0.9,en;q=0.8"
    },
    redirect:"follow"
  });
  if(!r.ok) throw new Error(`${r.status} ${url}`);
  return await r.text();
}

function extractPinnedCodes(html){
  const found=[];
  const seen=new Set();

  // Search around explicit pinned markers in Instagram serialized profile data.
  const marker=/["']?is_pinned["']?\s*:\s*true/g;
  let m;
  while((m=marker.exec(html))){
    const chunk=html.slice(Math.max(0,m.index-8000),Math.min(html.length,m.index+8000));
    const codes=[...chunk.matchAll(/["'](?:shortcode|code)["']\s*:\s*["']([A-Za-z0-9_-]{5,24})["']/g)].map(x=>x[1]);
    for(let i=codes.length-1;i>=0;i--){
      const c=codes[i];
      if(!seen.has(c)){
        seen.add(c); found.push(c); break;
      }
    }
    if(found.length>=3) break;
  }

  // If Instagram changed its markup, first visible media entries are usually pinned-first.
  if(found.length<3){
    const rx=/["'](?:shortcode|code)["']\s*:\s*["']([A-Za-z0-9_-]{5,24})["']/g;
    let x;
    while((x=rx.exec(html)) && found.length<3){
      const c=x[1];
      if(seen.has(c)) continue;
      seen.add(c);
      found.push(c);
    }
  }
  return found.slice(0,3);
}

async function getPreview(code){
  const candidates=[
    `https://www.instagram.com/reel/${code}/`,
    `https://www.instagram.com/p/${code}/`
  ];
  for(const url of candidates){
    try{
      const html=await fetchText(url);
      const og=html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      const type=html.match(/<meta[^>]+property=["']og:type["'][^>]+content=["']([^"']+)["']/i);
      if(og){
        return {
          permalink:url,
          thumbnail:decodeHtml(og[1]),
          type:(type && /video/i.test(type[1])) ? "Reel" : "Post"
        };
      }
    }catch(e){}
  }
  return {
    permalink:`https://www.instagram.com/reel/${code}/`,
    thumbnail:null,
    type:"Reel"
  };
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=10800, stale-while-revalidate=86400");
  res.setHeader("Content-Type","application/json; charset=utf-8");

  let codes=DEFAULTS;
  let source="fallback";

  try{
    const profile=await fetchText("https://www.instagram.com/evamediaoy/");
    const detected=extractPinnedCodes(profile);
    if(detected.length===3){
      codes=detected;
      source="instagram-profile";
    }
  }catch(e){}

  const items=await Promise.all(codes.slice(0,3).map(async code=>{
    const preview=await getPreview(code);
    return {code,...preview};
  }));

  return res.status(200).json({source,items});
}
