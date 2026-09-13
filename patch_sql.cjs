const fs = require("fs");
let sql = fs.readFileSync("sql/production_schema.sql", "utf8");

// We'll replace `create policy "name" on table` with `drop policy if exists "name" on table; create policy "name" on table`

const lines = sql.split('\n');
const newLines = [];
for (let line of lines) {
  if (line.trim().startsWith('create policy')) {
    const match = line.match(/create policy\s+"([^"]+)"\s+on\s+([^\s]+)/i);
    if (match) {
      newLines.push(`drop policy if exists "${match[1]}" on ${match[2]};`);
    }
  }
  newLines.push(line);
}

fs.writeFileSync("sql/production_schema.sql", newLines.join('\n'), "utf8");
