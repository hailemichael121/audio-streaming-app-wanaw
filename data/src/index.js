import fs from "fs";
import { JSDOM } from "jsdom";

// ---- CLI ARGS ----
const [, , inputFile, outputFile] = process.argv;

if (!inputFile || !outputFile) {
  console.error("Usage: node extract.js <input.html> <output.json>");
  process.exit(1);
}

// ---- READ HTML ----
const html = fs.readFileSync(inputFile, "utf-8");
const dom = new JSDOM(html);
const document = dom.window.document;

let items = [];

// ---- EXTRACT ----
document.querySelectorAll("a[href]").forEach(a => {
  const title = a.textContent.trim();

  // Extract leading number: "12 - something" → 12
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

// ---- SORT ----
items.sort((a, b) => a.order - b.order);

// ---- FINAL SHAPE ----
const result = items.map((item, index) => ({
  id: (index + 1).toString(),
  title: item.title,
  month: item.month,
  day: item.day,
  url: item.url,
}));

// ---- WRITE OUTPUT ----
fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
console.log(`Done. Extracted ${result.length} items → ${outputFile}`);
