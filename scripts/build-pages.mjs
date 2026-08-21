import { cp, mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const stagingRoot = await mkdtemp(join(projectRoot, ".pages-build-"));
const copiedEntries = ["package.json", "next.config.ts", "next-env.d.ts", "tsconfig.json", "public", "src"];

function run(command, args, cwd, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)));
  });
}

try {
  for (const entry of copiedEntries) {
    await cp(join(projectRoot, entry), join(stagingRoot, entry), { recursive: true });
  }
  // GitHub Pages has no server runtime. Keep the full-stack routes in the source
  // project while excluding them only from this isolated export workspace.
  await rm(join(stagingRoot, "src/app/api"), { recursive: true, force: true });
  await rm(join(stagingRoot, "src/app/checkout"), { recursive: true, force: true });

  await run(join(projectRoot, "node_modules/.bin/next"), ["build"], stagingRoot, {
    ...process.env,
    STATIC_DEMO: "true",
    CHECKOUT_ENABLED: "false",
  });

  await rm(join(projectRoot, "out"), { recursive: true, force: true });
  await cp(join(stagingRoot, "out"), join(projectRoot, "out"), { recursive: true });
  await writeFile(join(projectRoot, "out/.nojekyll"), "");
  await mkdir(join(projectRoot, "out"), { recursive: true });
} finally {
  await rm(stagingRoot, { recursive: true, force: true });
}
