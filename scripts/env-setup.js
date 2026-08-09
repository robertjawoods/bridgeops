#!/usr/bin/env node
import { existsSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { glob } from "fs/promises";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for await (const example of glob("**/.env.example", {
  cwd: root,
  exclude: (name) => name === "node_modules",
})) {
  const examplePath = resolve(root, example);
  const envPath = resolve(dirname(examplePath), ".env");

  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.log(`created ${example.replace(".example", "")} from .env.example`);
  }
}
