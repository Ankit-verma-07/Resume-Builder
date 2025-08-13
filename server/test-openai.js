// test-openai.js
const fetch = require('node-fetch');
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error("❌ No API key found in .env file");
  process.exit(1);
}

(async () => {
  try {
    console.log("🔍 Testing connection to OpenAI API...");

    const res = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    console.log("✅ Connection successful! First model:", data.data[0].id);
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
})();
