import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkgPath = path.resolve(__dirname, "package.json");
const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));

const allDeps = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

// Bundle everything except native Node.js modules
const external = allDeps.filter(
  (dep) =>
    !dep.startsWith("@workspace/") &&
    ![
      "@aws-sdk/client-bedrock-runtime",
      "@aws-sdk/client-s3",
      "@aws-sdk/s3-request-presigner",
      "cors",
      "drizzle-orm",
      "express",
      "multer",
      "pg",
      "uuid",
      "zod",
    ].includes(dep)
);

// Build Output API: functions go in .vercel/output/functions/<name>.func/
const funcDir = path.resolve(
  __dirname,
  "../../.vercel/output/functions/api/index.func"
);
await mkdir(funcDir, { recursive: true });

const outfile = path.join(funcDir, "index.js");

await build({
  entryPoints: [path.resolve(__dirname, "src/vercel.ts")],
  platform: "node",
  bundle: true,
  format: "cjs",
  outfile,
  define: { "process.env.NODE_ENV": '"production"' },
  external,
  logLevel: "info",
  tsconfig: path.resolve(__dirname, "tsconfig.json"),
  conditions: ["workspace"],
  // Ensure module.exports = handler for Vercel Node.js launcher
  footer: {
    js: "if (typeof exports.default !== 'undefined') { module.exports = exports.default; }",
  },
});

// Write the Vercel function config
await writeFile(
  path.join(funcDir, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.js",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
    },
    null,
    2
  )
);

console.log(
  `API bundled → .vercel/output/functions/api/index.func/index.js`
);
