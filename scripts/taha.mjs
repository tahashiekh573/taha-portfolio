#!/usr/bin/env node
// One command to set up and run the portfolio locally:  taha   (or: npm run taha)
// 1. Installs dependencies if missing or out of date
// 2. Creates .env.local (local file store + admin password) if missing
// 3. Starts the dev server on http://localhost:3000
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";

function run(args) {
  const r = spawnSync(npm, args, { stdio: "inherit", shell: isWin });
  if (r.status !== 0) {
    console.error(`\n✖ "npm ${args.join(" ")}" failed.`);
    process.exit(r.status ?? 1);
  }
}

// ── 1. Dependencies ─────────────────────────────────────────────────────────
const nextBin = join("node_modules", ".bin", isWin ? "next.cmd" : "next");
const lockInstalled = join("node_modules", ".package-lock.json");
const needsInstall =
  !existsSync(nextBin) ||
  !existsSync(lockInstalled) ||
  statSync("package-lock.json").mtimeMs > statSync(lockInstalled).mtimeMs;

if (needsInstall) {
  console.log("▶ Installing dependencies...\n");
  run(["install"]);
} else {
  console.log("✔ Dependencies already installed");
}

// ── 2. .env.local ───────────────────────────────────────────────────────────
const envFile = ".env.local";
if (!existsSync(envFile)) {
  console.log("\n▶ Creating .env.local (local mode, no Supabase needed)");
  let password = "";
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    while (password.length < 12) {
      password = (await rl.question("  Admin password (min 12 chars, Enter = random): ")).trim();
      if (!password) break;
      if (password.length < 12) console.log("  Too short, try again.");
    }
    rl.close();
  }
  const generated = !password;
  if (generated) password = randomBytes(12).toString("base64url");

  const N = 32768;
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1, maxmem: 256 * N * 8 });
  let env = readFileSync(".env.example", "utf8")
    .replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=scrypt:${N}:${salt.toString("hex")}:${hash.toString("hex")}`)
    .replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${randomBytes(32).toString("base64url")}`)
    .replace(/^# DATA_STORE=file$/m, "DATA_STORE=file");
  if (!/^DATA_STORE=file$/m.test(env)) env += "\nDATA_STORE=file\n";
  writeFileSync(envFile, env);
  console.log("✔ .env.local created");
  if (generated) {
    console.log(`\n  ┌─ Admin login (save this, it is shown only once) ─`);
    console.log(`  │ URL:      http://localhost:3000/admin`);
    console.log(`  │ Password: ${password}`);
    console.log(`  └────────────────────────────────────────────────`);
  }
} else {
  console.log("✔ .env.local found");
}

// ── 3. Run ──────────────────────────────────────────────────────────────────
console.log("\n▶ Starting dev server → http://localhost:3000  (Ctrl+C to stop)\n");
const child = spawn(npm, ["run", "dev"], { stdio: "inherit", shell: isWin });
child.on("exit", (code) => process.exit(code ?? 0));
