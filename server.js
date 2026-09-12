import express from 'express';
import fs from 'fs';
import path from 'path';
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
app.use(express.static(__dirname, { extensions: ['html'] }));

// Fallback to index.html for root or routes without file extension
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Scholarship Ledger server running at http://${HOST}:${PORT}`);
});
