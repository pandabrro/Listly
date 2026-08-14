import express from "express";

const app = express();
app.use(express.json({ limit: "15mb" }));

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
  padding:30px 20px 60px
}
.brand{
  font-size:52px;
  font-weight:900
}
.brand span{color:#8957ff}
.sub{
  color:#aab2bf;
  font-size:20px;
  line-height:1.4;
  margin:8px 0 28px
}
.card{
  background:#151a25;
  border:1px solid #303849;
  border-radius:26px;
  padding:28px;
  margin-bottom:22px
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
.preview{
  width:100%;
  max-height:300px;
  object-fit:contain;
  border-radius:16px;
  margin-top:15px;
  display:none
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
button:disabled{opacity:.5}
.result{
  white-space:pre-wrap;
  line-height:1.6;
  font-size:17px
}
.status{
  color:#aab2bf;
  font-size:14px;
  margin-top:14px
}
.error{color:#ff7777}
</style>
</head>

<body>
<main class="wrap">

<div class="brand">List<span>ly</span></div>
<div class="sub">
Upload a product photo and get a ready-to-post marketplace listing.
</div>

<div class="card">

<div class="upload">
<b>Add product photo</b>
<input id="photo" type="file" accept="image/*">
<img id="preview" class="preview">
</div>

<label>Marketplace</label>
<select id="market">
<option>Facebook Marketplace</option>
<option>eBay</option>
<option>Vinted</option>
<option>Etsy</option>
<option>General Marketplace</option>
</select>

<label>Language</label>
<select id="language">
<option>English</option>
<option>Ukrainian</option>
<option>Czech</option>
<option>German</option>
<option>Polish</option>
</select>

<label>Extra details (optional)</label>
<textarea id="details"
placeholder="Price, exact model, condition, defects, accessories..."></textarea>

<button id="generate">Generate listing ✨</button>

<div id="status" class="status"></div>

</div>

<div class="card">
<h2>Generated listing</h2>
<div id="output" class="result">
Your result will appear here.
</div>
</div>

</main>

<script>

const photo = document.getElementById("photo");
const preview = document.getElementById("preview");
const button = document.getElementById("generate");
const status = document.getElementById("status");
const output = document.getElementById("output");

photo.addEventListener("change", () => {
  const file = photo.files[0];

  if(file){
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

async function compressImage(file){

  const bitmap = await createImageBitmap(file);

  let width = bitmap.width;
  let height = bitmap.height;

  const maxSide = 1600;

  const scale =
    Math.min(1, maxSide / Math.max(width,height));

  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas =
    document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    bitmap,
    0,
    0,
    width,
    height
  );

  return await new Promise(resolve => {
    canvas.toBlob(
      resolve,
      "image/jpeg",
      0.82
    );
  });
}

button.addEventListener("click", async () => {

  const file = photo.files[0];

  if(!file){
    status.innerHTML =
      '<span class="error">Choose a photo first.</span>';
    return;
  }

  button.disabled = true;

  status.textContent =
    "Analyzing product photo...";

  output.textContent = "";

  try{

    const compressed =
      await compressImage(file);

    const base64 =
      await new Promise((resolve,reject)=>{

        const reader =
          new FileReader();

        reader.onload = () =>
          resolve(
            reader.result.split(",")[1]
          );

        reader.onerror = reject;

        reader.readAsDataURL(compressed);
      });

    const response =
      await fetch("/api/generate",{

        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({

          image:base64,

          mimeType:"image/jpeg",

          marketplace:
            document.getElementById("market").value,

          language:
            document.getElementById("language").value,

          details:
            document.getElementById("details").value

        })

      });

    const data =
      await response.json();

    if(!response.ok){
      throw new Error(
        data.error || "Generation failed"
      );
    }

    output.textContent =
      data.text;

    status.textContent =
      "Done ✓";

  }

  catch(error){

    status.innerHTML =
      '<span class="error">' +
      error.message +
      '</span>';

  }

  finally{

    button.disabled = false;

  }

});

</script>

</body>
</html>`;

app.get("/", (req,res)=>{
  res.type("html").send(html);
});

app.post("/api/generate", async (req,res)=>{

  try{

    const apiKey =
      process.env.GEMINI_API_KEY;

    if(!apiKey){

      return res.status(500).json({
        error:"GEMINI_API_KEY is missing in Render."
      });

    }

    const {
      image,
      mimeType,
      marketplace,
      language,
      details
    } = req.body;

    if(!image){

      return res.status(400).json({
        error:"Image is missing."
      });

    }

    const prompt = `
You are Listly, an AI assistant that creates marketplace listings from product photos.

Analyze the photo carefully.

First identify what product is visible.

Use only information you can reasonably see in the image or information supplied by the user.

Do NOT invent:
- exact model
- brand
- authenticity
- condition
- specifications
- storage size
- materials
- defects

If something is uncertain, do not claim it as fact.

Marketplace: ${marketplace}
Output language: ${language}

Extra user details:
${details || "None"}

Create a useful ready-to-post listing in this exact format:

TITLE:
A concise attractive title.

PRODUCT:
What the item appears to be.

VISIBLE DETAILS:
- bullet points describing useful visible details
- color
- style
- obvious features
- visible condition only if reasonably clear

DESCRIPTION:
A natural sales description suitable for ${marketplace}.

SEARCH KEYWORDS:
Comma-separated keywords.

Do not mention that you are an AI.
`;

    const geminiResponse =
      await fetch(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json",
            "x-goog-api-key":apiKey
          },

          body:JSON.stringify({

            model:"gemini-2.5-flash",

            store:false,

            input:[
              {
                type:"text",
                text:prompt
              },
              {
                type:"image",
                data:image,
                mime_type:
                  mimeType || "image/jpeg"
              }
            ]

          })

        }
      );

    const data =
      await geminiResponse.json();

    if(!geminiResponse.ok){

      console.error(data);

      return res.status(
        geminiResponse.status
      ).json({

        error:
          data?.error?.message ||
          "Gemini request failed."

      });

    }

    const text =
      data.outputs
        ?.flatMap(x => x.content || [])
        ?.filter(x => x.type === "text")
        ?.map(x => x.text)
        ?.join("\\n")
      ||
      data.output_text
      ||
      "No result returned.";

    res.json({text});

  }

  catch(error){

    console.error(error);

    res.status(500).json({
      error:
        error.message ||
        "Server error."
    });

  }

});

const PORT =
  process.env.PORT || 3000;

app.listen(
  PORT,
  "0.0.0.0",
  ()=>{
    console.log(
      "Listly running on port " + PORT
    );
  }
);
