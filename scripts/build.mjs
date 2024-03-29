import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "../luckysheet/node_modules/esbuild/lib/main.js";
import luckysheetPackage from "../luckysheet/package.json" assert { type: "json" };

const __dirname = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const resolve = (...pathSegments) => path.join(__dirname, ...pathSegments);

fs.rmSync(resolve("assets"), { force: true, recursive: true });
fs.rmSync(resolve("demo"), { force: true, recursive: true });
fs.rmSync(resolve("locales"), { force: true, recursive: true });

fs.cpSync(resolve("luckysheet/dist/demoData"), resolve("demo/demoData"), { recursive: true });
fs.cpSync(resolve("luckysheet/dist/expendPlugins"), resolve("demo/expendPlugins"), { recursive: true });

const banner = `/*! @preserve
 * ${luckysheetPackage.name}
 * version: ${luckysheetPackage.version}
 * https://github.com/mengshukeji/Luckysheet
 */`;

/**
 * @type esbuild.Plugin
 */
const myPlugin = {
  name: "my-plugin",
  setup(build) {
    // exports `Store`, `hyperlinkCtrl` as `hyperlinkController`, `freezen` as `freezeController`
    build.onLoad({ filter: /\/src\/core\.js$/ }, args => ({
      contents: `
import hyperlinkCtrl from './controllers/hyperlinkCtrl';
import luckysheetFreezen from './controllers/freezen';
${fs.readFileSync(args.path, "utf8")}
luckysheet.store = Store;
luckysheet.hyperlinkController = hyperlinkCtrl;
luckysheet.freezeController = luckysheetFreezen;
`,
    }));

    // erase `"www.baidu.com"`
    build.onLoad({ filter: /\/src\/config\.js$/ }, args => ({
      contents: fs
        .readFileSync(args.path, "utf8")
        .replace(/^(\s*)userMenuItem:.*$/m, "userMenuItem:[],")
        .replace("www.baidu.com", "https://github.com/luncheon/luckysheet-nightly"),
    }));

    // do not bundle huge locale resources
    build.onLoad({ filter: /\/src\/locale\/locale\.js$/ }, () => ({
      contents: `
import Store from '../store';
export const locales = {};
export default () => locales[Store.lang];
`,
    }));

    // delete html template indents
    build.onLoad({ filter: /\/src\/controllers\/[^/]+\.js$/ }, args => ({
      contents: fs.readFileSync(args.path, "utf8").replace(/^\s*/gm, ""),
    }));
  },
};

await esbuild
  .build({
    entryPoints: [resolve("luckysheet/src/index.js")],
    inject: [resolve("luckysheet/dist/plugins/js/plugin.js")],
    format: "iife",
    globalName: "luckysheet",
    bundle: true,
    minify: true,
    banner: { js: banner },
    target: "es2020",
    plugins: [myPlugin],
    write: false,
  })
  .then(result => {
    const plugin = fs.readFileSync(resolve("luckysheet/dist/plugins/js/plugin.js"), "utf8");
    fs.writeFileSync(resolve("luckysheet-without-locales.iife.js"), plugin + result.outputFiles[0].text, "utf8");
  });

await esbuild.build({
  stdin: {
    contents: `
      /* @import "./luckysheet/dist/plugins/css/pluginsCss.css"; */
      @import "./luckysheet/dist/assets/iconfont/iconfont.css";
      @import "./luckysheet/src/plugins/css/spectrum.min.css";
      @import "./luckysheet/dist/plugins/plugins.css";
      @import "./luckysheet/dist/css/luckysheet.css";
      @import "./luckysheet-locale-ja/styles.css";
    `,
    loader: "css",
    resolveDir: resolve(),
  },
  outfile: resolve("luckysheet.css"),
  bundle: true,
  minify: true,
  loader: {
    ".png": "file",
    ".gif": "file",
    ".svg": "file",
    ".ico": "file",
    ".eot": "file",
    ".ttf": "file",
    ".woff": "file",
    ".woff2": "file",
  },
  assetNames: "assets/[name]",
});

fs.mkdirSync(resolve("demo"), { recursive: true });

// locales
const index_html = fs.readFileSync(resolve("luckysheet/dist/index.html"), "utf8");
const index_html_with_locale = (lang, localeSource) => {
  const html = index_html
    .replace(
      /<html[\s\S]+?<\/head>/m,
      `
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Luckysheet</title>
  <link rel="stylesheet" href="../luckysheet.css">
  <script src="../luckysheet-without-locales.iife.js"></script>
</head>
`.trim()
    )
    .replace(
      "<script>",
      `<script type="module">
\t\timport locale_${lang} from '../locales/${lang}.js';
\t\tluckysheet.locales.${lang} = locale_${lang};
`.trim()
    )
    .replace(/var lang =.+$/m, `var lang = '${lang}';`)
    .replace(/fontList:\[[\s\S]+?\],\s*/, "");
  fs.writeFileSync(resolve(`demo/${lang}.html`), html, "utf8");

  esbuild.buildSync({
    entryPoints: [resolve(localeSource)],
    outfile: resolve(`locales/${lang}.js`),
    format: "esm",
    minify: true,
  });
};

for (const lang of ["en", "es", "zh", "zh_tw"]) {
  index_html_with_locale(lang, `luckysheet/src/locale/${lang}.js`);
}
index_html_with_locale("ja", "luckysheet-locale-ja/index.js");
