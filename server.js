import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Dynamic configuration endpoint for the frontend
app.get('/js/config.js', (req, res) => {
  res.type('application/javascript');
  const supabaseUrl = process.env.SUPABASE_URL || "https://YOUR-PROJECT-REF.supabase.co";
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "YOUR-ANON-PUBLIC-KEY";
  res.send(`// Auto-generated configuration by server
window.APP_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
  SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)},
};
`);
});

// API health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Scholarship Ledger',
    mode: (process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('YOUR-PROJECT-REF')) ? 'supabase' : 'mock'
  });
});

// Serve static assets from root directory

app.post('/api/ai/scholarship', async (req, res) => {
  try {
    const { text } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      // Return a mock response if API key is not set
      return res.json({
        name: "AI Generated Scholarship",
        provider: "",
        description: "This is a mocked description because no GEMINI_API_KEY was provided.",
        course_levels: ["UG", "PG"],
        categories: ["SC", "ST", "General"],
        min_percentage: 60,
        income_limit: 250000,
        gender: "Any",
        state: "Any",
        eligibility_conditions: "Generated mock eligibility conditions based on input: " + text.substring(0, 50) + "..."
      });
    }
    
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Extract the following scholarship information from the provided text.
    Return ONLY valid JSON.
    Text:
    ${text}
    
    JSON Schema:
    {
      "name": "string",
      "provider": "string",
      "description": "string",
      "official_url": "string (url)",
      "application_url": "string (url)",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "scholarship_amount": number,
      "course_levels": ["Class 1 to 9", "Class 10", "Class 12", "Diploma", "ITI", "UG", "PG", "PhD", "Professional", "Other"],
      "categories": ["General", "OBC", "SC", "ST", "EWS", "Minority", "PwD", "Female", "Other"],
      "min_percentage": number,
      "income_limit": number,
      "gender": "Male" | "Female" | "Transgender" | "Any",
      "state": "string (State name or Any)",
      "age_limit": number,
      "eligibility_conditions": "string"
    }
    If a field is not found or unclear, leave it blank, null, or "Any" depending on context.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(response.text);
    res.json(data);
  } catch (error) {
    console.error("AI Auto-fill error:", error);
    res.status(500).json({ error: "Failed to process AI extraction." });
  }
});

app.use(express.static(__dirname, { extensions: ['html'] }));

// Fallback to index.html for root or routes without file extension
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Scholarship Ledger server running at http://${HOST}:${PORT}`);
});
