import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { STATE_FILE } from "../config.js";
import type { SandboxState } from "../types.js";

const statePath = resolve(process.cwd(), STATE_FILE);

export async function readState(): Promise<Partial<SandboxState> | null> {
  try {
    return JSON.parse(await readFile(statePath, "utf8")) as Partial<SandboxState>;
  } catch {
    return null;
  }
}

export async function writeState(state: SandboxState): Promise<string> {
  await writeFile(statePath, JSON.stringify(state, null, 2) + "\n", "utf8");
  return statePath;
}
