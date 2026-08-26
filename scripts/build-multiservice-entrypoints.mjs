import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = resolve(fileURLToPath(new URL("..", import.meta.url)));

const entries = [
  {
    source: "src/server-player.ts",
    output: ".output/player/index.mjs",
  },
  {
    source: "src/server-payments.ts",
    output: ".output/payments/index.mjs",
  },
  {
    source: "src/worker.ts",
    output: ".output/worker/index.mjs",
  },
];

async function main() {
  for (const entry of entries) {
    const outputPath = resolve(ROOT_DIR, entry.output);
    await mkdir(dirname(outputPath), { recursive: true });

    const result = spawnSync(
      "bun",
      ["build", entry.source, "--outfile", outputPath, "--target=node", "--format=esm"],
      {
        cwd: ROOT_DIR,
        stdio: "inherit",
      },
    );

    if (result.status !== 0) {
      throw new Error(`Falha ao compilar ${entry.source}`);
    }
  }
}

main().catch((error) => {
  console.error("Falha no build multi-servico:");
  console.error(error);
  process.exit(1);
});
