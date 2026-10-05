
const DEFAULTS = [
  "DTfiqzFCD9g",
  "DeCE4C7Itbc",
  "DZ8VwO0xNeg"
];

function unescapeJsonUrl(s){
  if(!s) return null;
  return s.replace(/\\u0026/g,"&").replace(/\\\//g,"/").replace(/&amp;/g,"&");
}

function findPinned(html){
  const items=[];
  const seen=new Set();

  // Instagram commonly serializes pinned markers next to media objects.
  // Search windows around is_pinned=true and extract shortcode / display image.
  const marker=/["']?is_pinned["']?\s*:\s*true/g;
  let m;
  while((m=marker.exec(html))){
    const start=Math.max(0,m.index-6000), end=Math.min(html.length,m.index+6000);
    const chunk=html.slice(start,end);

    const codes=[...chunk.matchAll(/["'](?:shortcode|code)["']\s*:\s*["']([A-Za-z0-9_-]{5,20})["']/g)]
      .map(x=>x[1]);
    const code=codes.length?codes[codes.length-1]:null;
    if(!code || seen.has(code)) continue;

    const imgMatch=chunk.match(/["'](?:display_url|thumbnail_src|image_url)["']\s*:\s*["']([^"']+)["']/);
    seen.add(code);
    items.push({
      code,
      permalink:`https://www.instagram.com/reel/${code}/`,
      thumbnail:imgMatch?unescapeJsonUrl(imgMatch[1]):null,
      type:"Reel"
    });
    if(items.length>=3) break;
  }

  // Fallback heuristic: first media shortcodes in profile HTML are usually pinned-first.
  if(items.length<3){
    const rx=/["'](?:shortcode|code)["']\s*:\s*["']([A-Za-z0-9_-]{5,20})["']/g;
    let x;
    while((x=rx.exec(html)) && items.length<3){
      const code=x[1];
      if(seen.has(code)) continue;
      const chunk=html.slice(Math.max(0,x.index-2500),Math.min(html.length,x.index+3500));
      const imgMatch=chunk.match(/["'](?:display_url|thumbnail_src|image_url)["']\s*:\s*["']([^"']+)["']/);
      seen.add(code);
      items.push({
        code,
        permalink:`https://www.instagram.com/reel/${code}/`,
        thumbnail:imgMatch?unescapeJsonUrl(imgMatch[1]):null,
        type:"Reel"
      });
    }
  }
  return items.slice(0,3);
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","s-maxage=21600, stale-while-revalidate=86400");
  res.setHeader("Content-Type","application/json; charset=utf-8");

  try{
    const r=await fetch("https://www.instagram.com/evamediaoy/",{
      headers:{
        "user-agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "accept-language":"fi-FI,fi;q=0.9,en;q=0.8"
      }
    });
    if(!r.ok) throw new Error("instagram "+r.status);
    const html=await r.text();
    const items=findPinned(html);
    if(items.length===3){
      return res.status(200).json({source:"instagram-profile",items});
    }
  }catch(e){}

  return res.status(200).json({
    source:"fallback",
    items:DEFAULTS.map(code=>({
      code,
      permalink:`https://www.instagram.com/reel/${code}/`,
      thumbnail:null,
      type:"Reel"
    }))
  });
}
