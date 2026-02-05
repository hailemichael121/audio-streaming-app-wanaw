import fs from "fs";
import path from "path";

// ---- CLI ARG ----
const [, , rootDir] = process.argv;

if (!rootDir) {
  console.error("Usage: node reset-global-ids.js <json-root-directory>");
  process.exit(1);
}

let globalId = 1;

// ---- NUMERIC-AWARE SORT ----
function sortEntries(a, b) {
  const aNum = parseInt(a.name, 10);
  const bNum = parseInt(b.name, 10);

  if (!isNaN(aNum) && !isNaN(bNum)) {
    return aNum - bNum; // numeric order: 1,2,3,10
  }

  return a.name.localeCompare(b.name); // fallback
}

// ---- RECURSIVE WALK ----
function walk(dir) {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort(sortEntries);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      fixIds(fullPath);
    }
  }
}

// ---- FIX IDS ----
function fixIds(filePath) {
  let data;

  try {
    data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    console.error(`✖ Skipping invalid JSON: ${filePath}`);
    return;
  }

  if (!Array.isArray(data)) return;

  data.forEach(item => {
    item.id = String(globalId++);
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`✔ ${filePath}`);
}

// ---- START ----
walk(rootDir);
console.log(`Done. Last ID = ${globalId - 1}`);
