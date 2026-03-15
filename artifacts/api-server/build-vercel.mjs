import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { readFile } from "fs/promises";

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

const outfile = path.resolve(__dirname, "../../api/index.js");

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
});

console.log(`API bundled → api/index.js`);
