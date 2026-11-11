import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { builtinModules } from "node:module";
import { rm, readFile, writeFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];
const optionalExternalModules = new Set(["pg-native", "supports-color"]);

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  // Plesk may use dist itself as the application root. Keep the compiled
  // server's external runtime dependencies discoverable from that directory.
  const serverBundle = await readFile("dist/index.cjs", "utf-8");
  const builtins = new Set([
    ...builtinModules,
    ...builtinModules.map((name) => `node:${name}`),
  ]);
  const declaredDependencies = pkg.dependencies || {};
  const runtimeDependencies: Record<string, string> = {};

  for (const match of serverBundle.matchAll(/\brequire\((['"])([^'"]+)\1\)/g)) {
    const specifier = match[2];
    const packageName = specifier.startsWith("@")
      ? specifier.split("/").slice(0, 2).join("/")
      : specifier.split("/")[0];

    if (
      builtins.has(specifier) ||
      builtins.has(packageName) ||
      optionalExternalModules.has(packageName)
    ) {
      continue;
    }

    const version = declaredDependencies[packageName];
    if (!version) {
      throw new Error(
        `Server bundle requires "${packageName}", but it is not declared in package.json dependencies.`,
      );
    }
    runtimeDependencies[packageName] = version;
  }

  const runtimePackage = {
    name: `${pkg.name}-server-runtime`,
    version: pkg.version,
    private: true,
    type: "commonjs",
    engines: { node: ">=20" },
    scripts: { start: "node index.cjs" },
    dependencies: Object.fromEntries(
      Object.entries(runtimeDependencies).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };
  await writeFile(
    "dist/package.json",
    `${JSON.stringify(runtimePackage, null, 2)}\n`,
    "utf-8",
  );
  await writeFile(
    "dist/pnpm-workspace.yaml",
    "onlyBuiltDependencies:\n  - bcrypt\n",
    "utf-8",
  );
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
