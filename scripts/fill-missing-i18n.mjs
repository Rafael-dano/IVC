import fs from "fs";
import path from "path";

const basePath = "src/locales/en/common.json";
const localesDir = "src/locales";

function setDeep(obj, pathStr, value) {
  const parts = pathStr.split(".");
  let cur = obj;
  parts.forEach((p, i) => {
    if (i === parts.length - 1) cur[p] = value;
    else cur = cur[p] = cur[p] || {};
  });
}

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") flatten(v, key, out);
    else out[key] = v;
  }
  return out;
}

const en = JSON.parse(fs.readFileSync(basePath, "utf8"));
const enFlat = flatten(en);

for (const lang of fs.readdirSync(localesDir)) {
  if (lang === "en") continue;
  const p = path.join(localesDir, lang, "common.json");
  if (!fs.existsSync(p)) { console.log(`[${lang}] missing file common.json`); continue; }
  const json = JSON.parse(fs.readFileSync(p, "utf8"));

  // find missing
  const curFlat = flatten(json);
  const missing = Object.keys(enFlat).filter(k => !(k in curFlat));
  if (!missing.length) { console.log(`[${lang}] up to date`); continue; }

  // fill with English fallback
  missing.forEach(k => setDeep(json, k, enFlat[k]));
  fs.writeFileSync(p, JSON.stringify(json, null, 2), "utf8");
  console.log(`[${lang}] added ${missing.length} keys with English fallbacks`);
}
