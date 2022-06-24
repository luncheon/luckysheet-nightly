import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import luckysheetPackage from "../luckysheet/package.json" assert { type: 'json' };

const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const resolve = (...pathSegments) => path.join(__dirname, ...pathSegments);

const thisPackage = {
  name: 'luckysheet-nightly',
  version: `${luckysheetPackage.version}-${new Date().toISOString().replace(/T.*/, '').replace(/-/g, '')}`,
  main: 'luckysheet-without-locales.iife.js',
}

fs.writeFileSync(resolve('package.json'), JSON.stringify(thisPackage, undefined, 2), 'utf8')
