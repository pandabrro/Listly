import express from "express";
import OpenAI from "openai";

const app = express();
app.use(express.json({ limit: "12mb" }));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Listly — AI Listing Generator</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#0b0d10;color:#f5f7fa}
.wrap{max-width:720px;margin:auto;padding:24px 18px 60px}.brand{font-size:32px;font-weight:800}.brand span{color:#8b5cf6}
.sub{color:#aab2bf;margin:6px 0 24px}.card{background:#151922;border:1px solid #252b37;border-radius:22px;padding:18px;margin:14px 0}
label{display:block;font-weight:700;margin:12px 0 7px}input,select,textarea{width:100%;border:1px solid #343b49;background:#0f1218;color:white;border-radius:13px;padding:13px;font-size:16px}
textarea{min-height:105px;resize:vertical}.upload{border:2px dashed #3c4657;padding:22px;text-align:center;border-radius:16px}.upload input{border:0;padding:8px}
button{width:100%;padding:15px;border:0;border-radius:14px;background:#8b5cf6;color:white;font-size:17px;font-weight:800;margin-top:15px}
button:disabled{opacity:.55}.result{white-space:pre-wrap;line-height:1.5;background:#0f1218;border-radius:14px;padding:15px;min-height:70px}
.small{font-size:13px;color:#8f99a8}.error{color:#ff7b7b}.ok{color:#78e08f}
</style>
</head>
<body><main class="wrap">
<div class="brand">List<span>ly</span></div>
<div class="sub">Turn a product photo into a ready-to-post marketplace listing.</div>
<div class="card">
  <div class="upload"><b>1. Add product photo</b><br><input id="photo" type="file" accept="image/jpeg,image/png,image/webp"></div>
  <label>Marketplace</label><select id="market"><option>Facebook Marketplace</option><option>eBay</option><option>Vinted</option><option>Etsy</option><option>General marketplace</option></select>
  <label>Language</label><select id="lang"><option>English</option><option>Ukrainian</option><option>Czech</option><option>German</option><option>Polish</option></select>
  <label>Extra details (optional)</label><textarea id="details" placeholder="Brand, condition, size, price, defects..."></textarea>
  <button id="go">Generate listing ✨</button>
  <div id="status" class="small" style="margin-top:10px"></div>
</div>
<div class="card"><b>Generated listing</b><div id="result" class="result" style="margin-top:12px">Your result will appear here.</div><button id="copy" style="background:#252b37">Copy text</button></div>
<div class="small">AI can make mistakes. Check product facts before publishing.</div>
</main>
<script>
const $=id=>document.getElementById(id);
$("go").onclick=async()=>{
 const file=$("photo").files[0];
 if(!file){$("status").innerHTML='<span class="error">Choose a photo first.</span>';return}
 if(file.size>8*1024*1024){$("status").innerHTML='<span class="error">Photo is too large. Use one under 8 MB.</span>';return}
 $("go").disabled=true;$("status").textContent="Analyzing photo…";$("result").textContent="";
 try{
   const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file)});
   const resp=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:dataUrl,market:$("market").value,language:$("lang").value,details:$("details").value})});
   const data=await resp.json();
   if(!resp.ok) throw new Error(data.error||"Generation failed");
   $("result").textContent=data.text;$("status").innerHTML='<span class="ok">Done.</span>';
 }catch(e){$("status").innerHTML='<span class="error">'+e.message+'</span>'}
 finally{$("go").disabled=false}
};
$("copy").onclick=async()=>{await navigator.clipboard.writeText($("result").textContent);$("copy").textContent="Copied ✓";setTimeout(()=>$("copy").textContent="Copy text",1200)}
</script></body></html>`;

app.get("/", (_req,res)=>res.type("html").send(html));
app.get("/health", (_req,res)=>res.json({ok:true}));

app.post("/api/generate", async (req,res)=>{
  try{
    if(!process.env.OPENAI_API_KEY) return res.status(500).json({error:"OPENAI_API_KEY is not configured on the server."});
    const {image,market="General marketplace",language="English",details=""}=req.body||{};
    if(!image || !image.startsWith("data:image/")) return res.status(400).json({error:"Valid image required."});
    const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
    const prompt=`Create a marketplace listing in ${language} for ${market}.
Use only details visible in the image or supplied by the user. Do not invent brand, model, condition, authenticity, specs, or defects.
User details: ${details || "none"}.
Return:
TITLE:
...
DESCRIPTION:
...
KEY DETAILS:
- ...
SEARCH TAGS:
...
Keep it concise and persuasive.`;
    const response=await client.responses.create({
      model:"gpt-5-mini",
      input:[{role:"user",content:[
        {type:"input_text",text:prompt},
        {type:"input_image",image_url:image,detail:"auto"}
      ]}]
    });
    res.json({text:response.output_text});
  }catch(err){
    console.error(err);
    res.status(500).json({error: err?.message || "Server error"});
  }
});

const port=process.env.PORT||3000;
app.listen(port,"0.0.0.0",()=>console.log("Listly running on port "+port));
