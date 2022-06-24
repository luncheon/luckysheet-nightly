import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import luckysheetPackage from "../luckysheet/package.json" assert { type: 'json' };

const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const resolve = (...pathSegments) => path.join(__dirname, ...pathSegments);

luckysheetPackage.name = 'luckysheet-nightly';
luckysheetPackage.version = luckysheetPackage.version + '-' + new Date().toISOString().replace(/T.*/, '').replace(/-/g, '')
fs.writeFileSync(resolve('package.json'), JSON.stringify(luckysheetPackage, undefined, 2), 'utf8')
