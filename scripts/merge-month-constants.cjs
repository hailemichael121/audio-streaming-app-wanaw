/**
 * Merges data/src/jsons/ into lib/monthConstants/.
 * Reads each month folder's JSON files, builds parts/songs, and writes TS files
 * with BASE_URL embedded in each song's url.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const JSONS_DIR = path.join(ROOT, "data", "src", "jsons");
const OUT_DIR = path.join(ROOT, "lib", "monthConstants");

const BASE_URL =
  "https://www.ethiopianorthodox.org/churchmusic/zema%20timehert%20bet";

// data folder name -> { appId, name, constName } (appId 1-18)
const FOLDER_TO_MONTH = {
  "1.meskerem": { appId: 1, name: "Meskerem", constName: "MESKEREM" },
  "2.tkmt": { appId: 2, name: "Tikimt", constName: "TIKIMT" },
  "3.hdar": { appId: 3, name: "Hidar", constName: "HIDAR" },
  "4.tahsas": { appId: 4, name: "Tahsas", constName: "TAHSAS" },
  "5.tir": { appId: 5, name: "Tir", constName: "TIR" },
  "6.yekatit": { appId: 6, name: "Yekatit", constName: "YEKATIT" },
  "7.megabit": { appId: 7, name: "Megabit", constName: "MEGABIT" },
  "8.miyazya": { appId: 10, name: "Miyazya", constName: "MIYAZYA" },
  "9.gnbot": { appId: 11, name: "Gnbot", constName: "GNBOT" },
  "10.sene": { appId: 12, name: "Sene", constName: "SENE" },
  "11.hamle": { appId: 13, name: "Hamle", constName: "HAMLE" },
  "12.nehase": { appId: 14, name: "Nehase", constName: "NEHASE" },
  "13.puagmen": { appId: 15, name: "Pagumen", constName: "PAGUMEN" },
  "15.abiyTsom": { appId: 8, name: "Abiy Tsom", constName: "ABIY_TSOM" },
  "16.tnsae": { appId: 9, name: "Tinsae", constName: "TINSAE" },
  "14.tsige": { appId: 16, name: "Tsige", constName: "TSIGE" },
  "17.erget": { appId: 17, name: "Erget", constName: "ERGET" },
  "18.peraqlitos": { appId: 18, name: "Peraqlitos", constName: "PERAQLITOS" },
};

function encodePath(relativePath) {
  return relativePath
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

function basename(url) {
  const last = url.split("/").pop() || "audio.mp3";
  return last;
}

function numericSort(a, b) {
  const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
  const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
  if (numA !== numB) return numA - numB;
  return String(a).localeCompare(String(b));
}

function mapSongsToAudio(songs, appId) {
  return songs.map((s) => ({
    id: String(s.id),
    title: String(s.title ?? ""),
    filename: basename(s.url ?? "audio.mp3"),
    month: appId,
    day: typeof s.day === "number" ? s.day : 1,
    url: `${BASE_URL}/${encodePath(String(s.url ?? "").trim())}`,
  }));
}

function loadMonthFromFolder(folderName) {
  const meta = FOLDER_TO_MONTH[folderName];
  if (!meta) return null;

  const dir = path.join(JSONS_DIR, folderName);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return null;

  // 14.tsige: subfolders (gmjabet, hamsay, ...), each subfolder = one part, all JSONs inside merged
  if (folderName === "14.tsige") {
    return loadTsigeFromFolder(dir, meta);
  }
  // 17.erget: top-level JSON files (beale-erget.json, miscellaneous.json), each file = one part
  if (folderName === "17.erget") {
    return loadErgetFromFolder(dir, meta);
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort(numericSort);

  const parts = [];
  jsonFiles.forEach((filename, index) => {
    const partId = index + 1;
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    let songs;
    try {
      songs = JSON.parse(raw);
    } catch (err) {
      console.warn(`Skip ${filePath}: ${err.message}`);
      songs = [];
    }
    if (!Array.isArray(songs)) songs = [];

    parts.push({
      id: partId,
      name: `Part ${partId}`,
      songs: mapSongsToAudio(songs, meta.appId),
    });
  });

  return {
    id: meta.appId,
    name: meta.name,
    constName: meta.constName,
    parts,
  };
}

/** 14.tsige: each subfolder (gmjabet, hamsay, ...) = one part; all JSONs in that subfolder merged into that part */
function loadTsigeFromFolder(dir, meta) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const subdirs = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const parts = [];
  subdirs.forEach((subdirName, index) => {
    const partId = index + 1;
    const subdirPath = path.join(dir, subdirName);
    const subEntries = fs.readdirSync(subdirPath, { withFileTypes: true });
    const jsonFiles = subEntries
      .filter((e) => e.isFile() && e.name.endsWith(".json"))
      .map((e) => e.name)
      .sort(numericSort);

    const allSongs = [];
    jsonFiles.forEach((filename) => {
      const filePath = path.join(subdirPath, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      let songs;
      try {
        songs = JSON.parse(raw);
      } catch (err) {
        console.warn(`Skip ${filePath}: ${err.message}`);
        songs = [];
      }
      if (Array.isArray(songs)) allSongs.push(...songs);
    });

    const partName = subdirName.charAt(0).toUpperCase() + subdirName.slice(1);
    parts.push({
      id: partId,
      name: partName,
      songs: mapSongsToAudio(allSongs, meta.appId),
    });
  });

  return {
    id: meta.appId,
    name: meta.name,
    constName: meta.constName,
    parts,
  };
}

/** 17.erget: each top-level JSON file = one part (beale-erget.json -> "Beale Erget", miscellaneous.json -> "Miscellaneous") */
function loadErgetFromFolder(dir, meta) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const jsonFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".json"))
    .map((e) => e.name)
    .sort();

  const parts = [];
  jsonFiles.forEach((filename, index) => {
    const partId = index + 1;
    const filePath = path.join(dir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    let songs;
    try {
      songs = JSON.parse(raw);
    } catch (err) {
      console.warn(`Skip ${filePath}: ${err.message}`);
      songs = [];
    }
    if (!Array.isArray(songs)) songs = [];

    const baseName = filename.replace(/\.json$/i, "");
    const partName = baseName
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

    parts.push({
      id: partId,
      name: partName,
      songs: mapSongsToAudio(songs, meta.appId),
    });
  });

  return {
    id: meta.appId,
    name: meta.name,
    constName: meta.constName,
    parts,
  };
}

function escapeTsString(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function serializeSong(song) {
  const lines = [
    `        {`,
    `          id: "${escapeTsString(song.id)}",`,
    `          title: "${escapeTsString(song.title)}",`,
    `          filename: "${escapeTsString(song.filename)}",`,
    `          month: ${song.month},`,
    `          day: ${song.day},`,
    `          url: "${escapeTsString(song.url)}",`,
    `        },`,
  ];
  return lines.join("\n");
}

function serializePart(part) {
  const songsStr = part.songs.map(serializeSong).join("\n");
  return `    {\n      id: ${part.id},\n      name: "${escapeTsString(part.name)}",\n      songs: [\n${songsStr}\n      ],\n    }`;
}

const CONST_TO_FILENAME = {
  MESKEREM: "meskerem.ts",
  TIKIMT: "tikimt.ts",
  HIDAR: "hidar.ts",
  TAHSAS: "tahsas.ts",
  TIR: "tir.ts",
  YEKATIT: "yekatit.ts",
  MEGABIT: "megabit.ts",
  ABIY_TSOM: "abiyTsom.ts",
  TINSAE: "tinsae.ts",
  MIYAZYA: "miyazya.ts",
  GNBOT: "gnbot.ts",
  SENE: "sene.ts",
  HAMLE: "hamle.ts",
  NEHASE: "nehase.ts",
  PAGUMEN: "pagumen.ts",
  TSIGE: "tsige.ts",
  ERGET: "erget.ts",
  PERAQLITOS: "peraqlitos.ts",
};

function writeMonthFile(month) {
  const partsStr = month.parts.map(serializePart).join(",\n");
  const constName = month.constName;
  const content = `import type { MonthWithParts } from "../types";

/** BASE_URL embedded in each song url */
const BASE_URL = "${BASE_URL}";

export const ${constName}: MonthWithParts = {
  id: ${month.id},
  name: "${escapeTsString(month.name)}",
  parts: [
${partsStr}
  ],
};
`;
  const outPath = path.join(OUT_DIR, CONST_TO_FILENAME[constName] || `${constName.toLowerCase()}.ts`);
  fs.writeFileSync(outPath, content, "utf-8");
  const totalSongs = month.parts.reduce((n, p) => n + p.songs.length, 0);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${month.parts.length} parts, ${totalSongs} songs)`);
}

function main() {
  if (!fs.existsSync(JSONS_DIR)) {
    console.error("Missing data dir:", JSONS_DIR);
    process.exit(1);
  }
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const folderNames = fs.readdirSync(JSONS_DIR);
  const monthsByAppId = {};

  for (const folderName of folderNames) {
    const month = loadMonthFromFolder(folderName);
    if (month) monthsByAppId[month.id] = month;
  }

  const appOrder = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  for (const appId of appOrder) {
    const month = monthsByAppId[appId];
    if (month) writeMonthFile(month);
    else console.warn(`No data for app month id ${appId}`);
  }

  console.log("Done.");
}

main();
