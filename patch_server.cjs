const fs = require('fs');
let js = fs.readFileSync('server.js', 'utf8');

const importGenAI = `import { GoogleGenAI } from '@google/genai';\n`;
if (!js.includes('@google/genai')) {
  js = js.replace("import { fileURLToPath }", importGenAI + "import { fileURLToPath }");
}

const aiEndpoint = `
app.post('/api/ai/scholarship', async (req, res) => {
  try {
    const { text } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      // Return a mock response if API key is not set
      return res.json({
        name: "AI Generated Scholarship",
        provider: "Mock Provider",
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
    
    const prompt = \`Extract the following scholarship information from the provided text.
    Return ONLY valid JSON.
    Text:
    \${text}
    
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
      "course_levels": ["Class 10", "Class 12", "Diploma", "ITI", "UG", "PG", "PhD", "Professional", "Other"],
      "categories": ["General", "OBC", "SC", "ST", "EWS", "Minority", "PwD", "Female", "Other"],
      "min_percentage": number,
      "income_limit": number,
      "gender": "Male" | "Female" | "Transgender" | "Any",
      "state": "string (State name or Any)",
      "age_limit": number,
      "eligibility_conditions": "string"
    }
    If a field is not found or unclear, leave it blank, null, or "Any" depending on context.\`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
`;

if (!js.includes('/api/ai/scholarship')) {
  js = js.replace("app.use(express.static(", aiEndpoint + "\napp.use(express.static(");
  fs.writeFileSync('server.js', js, 'utf8');
}
