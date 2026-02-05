import fs from "fs";
import { JSDOM } from "jsdom";

const html = fs.readFileSync("input.html", "utf-8");
const dom = new JSDOM(html);
const document = dom.window.document;

const result = [];

let id = 1

document.querySelectorAll("a[href]").forEach(a => {
  result.push({
    id: (id++).toString(),
    title: a.textContent.trim(),
    month: 1,
    day: 1,
    url: a.getAttribute("href"),
  });
});

fs.writeFileSync("output.json", JSON.stringify(result, null, 2));
console.log("Done. Extracted", result.length, "items");

// regex: ("title"\s*:\s*"[^"]*)\s(-|=)\s then replace with $1 
// regex for double spaces: ("title"\s*:\s*"[^"]*)\s{2,} then replace with $1