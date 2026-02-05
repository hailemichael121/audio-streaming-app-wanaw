import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";

// ---- CLI ARG ----
const [, , rootDir] = process.argv;

if (!rootDir) {
  console.error("Usage: node extract-all.js <root-directory>");
  process.exit(1);
}

// ---- RECURSIVE WALK ----
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      processHtml(fullPath);
    }
  }
}

// ---- HTML PROCESSOR ----
function processHtml(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf-8");
  const dom = new JSDOM(html);
  const document = dom.window.document;

  let items = [];

  document.querySelectorAll("a[href]").forEach(a => {
    const title = a.textContent.trim();
    const match = title.match(/^(\d+)/);
    if (!match) return;

    items.push({
      order: Number(match[1]),
      title,
      month: 1,
      day: 1,
      url: a.getAttribute("href"),
    });
  });

  if (items.length === 0) return;

  // Sort numerically
  items.sort((a, b) => a.order - b.order);

  const result = items.map((item, index) => ({
    id: (index + 1).toString(),
    title: item.title,
    month: item.month,
    day: item.day,
    url: item.url,
  }));

  // Output file name = same as HTML
  const outputPath = htmlPath.replace(/\.html$/i, ".json");

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`✔ ${path.relative(rootDir, outputPath)} (${result.length} items)`);
}

// ---- START ----
walk(rootDir);
console.log("Done.");
