import express from "express";

const app = express();
app.use(express.json({ limit: "12mb" }));

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Listly</title>

<style>
*{box-sizing:border-box}
body{
  margin:0;
  background:#090d12;
  color:#f5f7fb;
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif
}
.wrap{
  max-width:720px;
  margin:auto;
  padding:30px 20px
}
.brand{
  font-size:52px;
  font-weight:900
}
.brand span{color:#8957ff}
.sub{
  color:#aab2bf;
  font-size:21px;
  line-height:1.4;
  margin:8px 0 28px
}
.card{
  background:#151a25;
  border:1px solid #303849;
  border-radius:26px;
  padding:28px
}
.upload{
  border:3px dashed #465063;
  border-radius:22px;
  padding:28px 15px;
  text-align:center;
  margin-bottom:25px
}
.upload b{
  display:block;
  font-size:22px;
  margin-bottom:15px
}
label{
  display:block;
  font-size:19px;
  font-weight:800;
  margin:18px 0 8px
}
select,textarea{
  width:100%;
  background:#0c1017;
  color:white;
  border:1px solid #424b5c;
  border-radius:18px;
  padding:16px;
  font-size:18px
}
textarea{
  min-height:130px;
  resize:vertical
}
button{
  width:100%;
  margin-top:24px;
  padding:18px;
  border:0;
  border-radius:18px;
  background:#8957ff;
  color:white;
  font-size:20px;
  font-weight:900
}
.result{
  margin-top:25px;
  background:#151a25;
  border:1px solid #303849;
  border-radius:25px;
  padding:25px
}
.small{
  color:#9ba4b4;
  font-size:14px
}
</style>
</head>

<body>
<main class="wrap">

<div class="brand">List<span>ly</span></div>
<div class="sub">
Turn a product photo into a ready-to-post marketplace listing.
</div>

<div class="card">

<div class="upload">
<b>1. Add product photo</b>
<input id="photo" type="file" accept="image/*">
</div>

<label>Marketplace</label>
<select id="market">
<option>Facebook Marketplace</option>
<option>eBay</option>
<option>Vinted</option>
<option>Craigslist</option>
</select>

<label>Language</label>
<select id="language">
<option>English</option>
<option>Ukrainian</option>
<option>Czech</option>
<option>German</option>
<option>Spanish</option>
</select>

<label>Extra details (optional)</label>
<textarea id="details"
placeholder="Brand, condition, size, price, defects..."></textarea>

<button onclick="makeListing()">Generate listing ✨</button>

<p class="small">
Free demo mode — AI generation is temporarily disabled.
</p>

</div>

<div class="result">
<h2>Generated listing</h2>
<div id="output">Your result will appear here.</div>
</div>

</main>

<script>
function makeListing(){

 const market =
   document.getElementById("market").value;

 const language =
   document.getElementById("language").value;

 const details =
   document.getElementById("details").value.trim();

 const photo =
   document.getElementById("photo").files[0];

 if(!photo){
   alert("Please choose a product photo first.");
   return;
 }

 let text = "";

 if(language === "Ukrainian"){
   text =
   "🔥 Продається товар\\n\\n" +
   (details || "Товар у хорошому стані.") +
   "\\n\\n📦 Готовий до продажу через " + market +
   ".\\n💬 Пишіть для детальної інформації.";
 }
 else if(language === "Czech"){
   text =
   "🔥 Nabízím k prodeji\\n\\n" +
   (details || "Produkt je v dobrém stavu.") +
   "\\n\\n📦 Nabídka pro " + market +
   ".\\n💬 Pro více informací napište zprávu.";
 }
 else{
   text =
   "🔥 FOR SALE\\n\\n" +
   (details || "Item is in good condition.") +
   "\\n\\n📦 Ready to list on " + market +
   ".\\n💬 Message me for more information.";
 }

 document.getElementById("output").innerText = text;
}
</script>

</body>
</html>`;

app.get("/", (req,res)=>{
  res.type("html").send(html);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
  console.log("Listly running on port " + PORT);
});
