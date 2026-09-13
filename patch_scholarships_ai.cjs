const fs = require("fs");
let js = fs.readFileSync("js/scholarships.js", "utf8");

const oldCode = `    closeAIScholarshipModal();
    toast("Scholarship data extracted! Please review and Verify.", "success");
  } catch(err) {
    console.error(err);
    toast("Failed to generate from AI. Using mock if no API available...", "error");
    // MOCK fallback for safety
    document.getElementById("s-name").value = "Generated Scholarship Name";
    closeAIScholarshipModal();
  } finally {`;

const newCode = `    closeAIScholarshipModal();
    toast("Scholarship data extracted! Please review and Verify.", "success");
  } catch(err) {
    console.error("AI Generation Error:", err);
    toast("AI extraction failed or unavailable. Please fill manually.", "error");
  } finally {`;

js = js.replace(oldCode, newCode);

fs.writeFileSync("js/scholarships.js", js, "utf8");
console.log("Patched scholarships AI");
