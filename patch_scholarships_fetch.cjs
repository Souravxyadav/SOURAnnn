const fs = require("fs");
let js = fs.readFileSync("js/scholarships.js", "utf8");

const oldFetch = `    const res = await fetch("/api/ai/scholarship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
        
    if (data.error) throw new Error(data.error);`;

const newFetch = `    const res = await fetch("/api/ai/scholarship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    
    if (!res.ok) {
       throw new Error("AI service is currently unavailable.");
    }
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);`;

js = js.replace(oldFetch, newFetch);

fs.writeFileSync("js/scholarships.js", js, "utf8");
