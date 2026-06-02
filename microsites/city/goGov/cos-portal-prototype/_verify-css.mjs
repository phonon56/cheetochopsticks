import { compile } from "tailwindcss";
import fs from "node:fs";
import path from "node:path";

const PROJ = "/sessions/compassionate-serene-ride/mnt/cos-portal-prototype";
const TW = path.join(PROJ, "node_modules/tailwindcss");
const indexCss = fs.readFileSync(path.join(PROJ, "src/index.css"), "utf8");

async function loadStylesheet(id, base) {
  let file;
  if (id === "tailwindcss") file = path.join(TW, "index.css");
  else if (id.startsWith(".")) file = path.resolve(base, id);
  else file = path.join(TW, id.replace(/^tailwindcss\/?/, ""));
  return { base: path.dirname(file), content: fs.readFileSync(file, "utf8") };
}

const { build } = await compile(indexCss, {
  base: path.join(PROJ, "src"),
  loadStylesheet,
  loadModule: async () => { throw new Error("no js config"); },
});

const candidates = ["bg-brand","hover:bg-brand-hover","text-ink-strong","border-line-stronger","bg-surface","bg-canvas","text-success-ink","bg-warning-surface","text-danger","text-brand-ink"];
const out = build(candidates);
function findVal(name){ const m = out.match(new RegExp("--color-"+name+":\\s*([^;]+);")); return m ? m[1].trim() : "(not emitted)"; }

console.log("--- generated utility rules present? ---");
for (const c of candidates){
  const sel = "." + c.replace(/:/g,"\\:");
  console.log((out.includes(sel) ? "OK   " : "MISS ") + c);
}
console.log("\n--- resolved token values in :root ---");
for (const t of ["brand","brand-hover","ink-strong","line-stronger","surface","canvas","success-ink","warning-surface"]) {
  console.log(t.padEnd(16), findVal(t));
}
console.log("\nTotal CSS length:", out.length, "bytes");
