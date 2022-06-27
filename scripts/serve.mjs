import esbuild from "../luckysheet/node_modules/esbuild/lib/main.js";

esbuild.serve({ servedir: ".", port: 8000 }, {}).then(result => console.log(`http://localhost:${result.port}/demo/`));
