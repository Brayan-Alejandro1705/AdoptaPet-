require('dotenv').config();
const https = require('https');

const apiKey = process.env.GOOGLE_API_KEY;

if(!apiKey) {
    console.log("No se encontro GOOGLE_API_KEY");
    process.exit(1);
}

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Modelos permitidos para tu API Key:');
      if (json.models) {
        json.models.filter(m => m.name.includes('gemini')).forEach(m => {
          console.log(`- ${m.name}`);
        });
      } else {
        console.log(json);
      }
    } catch (e) {
      console.error("Parse Error:", e);
    }
  });
}).on('error', err => console.error("HTTP Error:", err));
