import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";

const outputDir = path.resolve("/www/wwwroot/stream.mago-bot.com/.output/public");
const assetsDir = path.join(outputDir, "assets");
const legacyCssPath = path.join(outputDir, "legacy.css");

function flattenNode(node, container) {
  if (node.type === "comment") {
    return;
  }

  if (node.type === "atrule") {
    if (node.name === "property") {
      return;
    }

    if (node.name === "layer") {
      if (node.nodes?.length) {
        node.nodes.forEach((child) => flattenNode(child, container));
      }
      return;
    }

    const cloned = node.clone({ nodes: [] });
    container.append(cloned);

    if (node.nodes?.length) {
      node.nodes.forEach((child) => flattenNode(child, cloned));
    }
    return;
  }

  container.append(node.clone());
}

async function main() {
  const files = await fs.readdir(assetsDir);
  const styleFile = files
    .filter((file) => file.startsWith("styles-") && file.endsWith(".css"))
    .map((file) => path.join(assetsDir, file))
    .sort()
    .at(-1);

  if (!styleFile) {
    throw new Error(`No compiled stylesheet found in ${assetsDir}`);
  }

  const css = await fs.readFile(styleFile, "utf8");
  const root = postcss.parse(css);
  const flattened = postcss.root();

  root.nodes?.forEach((node) => flattenNode(node, flattened));

  await fs.writeFile(legacyCssPath, flattened.toString(), "utf8");
  console.log(`Legacy stylesheet written to ${legacyCssPath}`);
}

main().catch((error) => {
  console.error("Failed to generate legacy stylesheet:");
  console.error(error);
  process.exit(1);
});
