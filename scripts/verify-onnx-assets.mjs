import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = [
  "ort-wasm-simd-threaded.asyncify.mjs",
  "ort-wasm-simd-threaded.asyncify.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.wasm",
];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

for (const asset of assets) {
  const source = await readFile(path.join(root, "node_modules", "onnxruntime-web", "dist", asset));
  const vendored = await readFile(path.join(root, "public", "onnx", asset));
  if (sha256(source) !== sha256(vendored)) {
    throw new Error(`${asset} does not match the lockfile-pinned onnxruntime-web package.`);
  }
}

console.log(`Verified ${assets.length} self-hosted ONNX Runtime assets.`);
