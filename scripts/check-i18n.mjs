import fs from "fs";
import path from "path";

const basePath = "src/locales/en/common.json";
const localesDir = "src/locales";

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = true;
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(basePath, "utf8"));
const baseKeys = Object.keys(flatten(en));

for (const lang of fs.readdirSync(localesDir)) {
  if (lang === "en") continue;
  const p = path.join(localesDir, lang, "common.json");
  if (!fs.existsSync(p)) { console.log(`[${lang}] missing file common.json`); continue; }
  const json = JSON.parse(fs.readFileSync(p, "utf8"));
  const keys = Object.keys(flatten(json));
  const missing = baseKeys.filter(k => !keys.includes(k));
  if (missing.length) {
    console.log(`\n[${lang}] missing keys:`);
    missing.forEach(k => console.log("  -", k));
  } else {
    console.log(`\n[${lang}] ✅ up to date`);
  }
}
