import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "./luckysheet/node_modules/esbuild/lib/main.js";
import luckysheetPackage from "./luckysheet/package.json" assert { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolve = (...pathSegments) => path.join(__dirname, ...pathSegments);

const banner = `/*! @preserve
 * ${luckysheetPackage.name}
 * version: ${luckysheetPackage.version}
 * https://github.com/mengshukeji/Luckysheet
 */`;

const localeJs = `
import Store from '../store';
export const locales = {};
export default () => locales[Store.lang];
`;

/** @type esbuild.Plugin */
const replaceLocalePlugin = {
  name: "replace-locale",
  setup(build) {
    const namespace = "replace-locale";
    build.onResolve({ filter: /\/locale\/locale$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path + ".js"),
      namespace,
    }));
    build.onLoad({ filter: /.*/, namespace }, (args) => ({
      loader: "js",
      contents: localeJs,
      resolveDir: path.dirname(args.path),
    }));
  },
};

esbuild.build({
  entryPoints: [resolve("luckysheet/src/index.js")],
  outfile: resolve("dist/luckysheet-without-locales.iife.js"),
  format: "iife",
  globalName: "luckysheet",
  bundle: true,
  minify: true,
  banner: { js: banner },
  target: "es2020",
  plugins: [replaceLocalePlugin],
});

// locales
const index_html = fs.readFileSync(resolve("dist/index.html"), "utf8");
const index_html_with_locale = (lang, localeSource) => {
  const html = index_html
    .replace(`<html>`, `<html lang="${lang}">`)
    .replace(`<head lang='zh'>`, `<head>`)
    .replace("luckysheet.umd.js", "luckysheet-without-locales.iife.js")
    .replace(
      "<script>",
      `<script type="module">
\t\timport locale_${lang} from './luckysheet-locale-${lang}.js';
\t\tluckysheet.locales.${lang} = locale_${lang};
`
    )
    .replace(/var lang =.+$/m, `var lang = '${lang}';`);
  fs.writeFileSync(resolve(`dist/index_${lang}.html`), html, "utf8");

  esbuild.buildSync({
    entryPoints: [resolve(localeSource)],
    outfile: resolve(`dist/luckysheet-locale-${lang}.js`),
    format: "esm",
    minify: true,
  });
};

for (const lang of ["en", "es", "zh", "zh_tw"]) {
  index_html_with_locale(lang, `luckysheet/src/locale/${lang}.js`);
}
index_html_with_locale("ja", `luckysheet-locale-ja/index.js`);
