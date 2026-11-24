#!/usr/bin/env node
// Usage: npm run hash-password -- "your strong password"
// Prints a value for ADMIN_PASSWORD_HASH and a random AUTH_SECRET.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Provide a password of at least 12 characters: npm run hash-password -- "your password"');
  process.exit(1);
}
const N = 32768;
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1, maxmem: 256 * N * 8 });
console.log(`ADMIN_PASSWORD_HASH=scrypt:${N}:${salt.toString("hex")}:${hash.toString("hex")}`);
console.log(`AUTH_SECRET=${randomBytes(32).toString("base64url")}`);
