import { cpSync, existsSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const appRoot = process.cwd();
const monorepoRoot = resolve(appRoot, "../..");
const monorepoPackageJson = resolve(monorepoRoot, "package.json");

if (process.env.VERCEL !== "1") {
  process.exit(0);
}

if (!existsSync(monorepoPackageJson)) {
  process.exit(0);
}

const packageJson = JSON.parse(readFileSync(monorepoPackageJson, "utf8"));

if (!Array.isArray(packageJson.workspaces) || !packageJson.workspaces.includes("apps/web")) {
  process.exit(0);
}

const source = resolve(appRoot, "dist");
const target = resolve(monorepoRoot, "dist");

if (!existsSync(source)) {
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
cpSync(source, target, { recursive: true });
