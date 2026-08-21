/**
 * Generates a simple torus-ring GLB for Mock3DProvider previews.
 * Writes public/models/ai-mock/{ring,necklace,chain,pendant,bracelet,earrings}.glb
 *
 * Usage: node scripts/generate-mock-glb.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/models/ai-mock");

const TYPES = [
  "ring",
  "necklace",
  "chain",
  "pendant",
  "bracelet",
  "earrings",
];

/**
 * Pack JSON + BIN into a GLB (no browser FileReader required).
 */
function buildGlb(json, binary) {
  const jsonText = JSON.stringify(json);
  const jsonBuffer = Buffer.from(jsonText);
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const jsonChunk = Buffer.concat([
    jsonBuffer,
    Buffer.alloc(jsonPadding, 0x20),
  ]);

  const binPadding = (4 - (binary.length % 4)) % 4;
  const binChunk = Buffer.concat([binary, Buffer.alloc(binPadding, 0)]);

  const totalLength =
    12 + 8 + jsonChunk.length + (binChunk.length ? 8 + binChunk.length : 0);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // glTF
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // JSON

  const parts = [header, jsonHeader, jsonChunk];

  if (binChunk.length) {
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4); // BIN
    parts.push(binHeader, binChunk);
  }

  return Buffer.concat(parts);
}

function geometryToGlb(geometry) {
  geometry.computeVertexNormals();
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const index = geometry.getIndex();

  if (!position || !normal || !index) {
    throw new Error("Geometry missing attributes");
  }

  const posArray = new Float32Array(position.array);
  const norArray = new Float32Array(normal.array);
  const idxArray = new Uint16Array(index.array);

  const posBytes = Buffer.from(posArray.buffer);
  const norBytes = Buffer.from(norArray.buffer);
  const idxBytes = Buffer.from(idxArray.buffer);

  // Align each section to 4 bytes
  const align = (buf) => {
    const pad = (4 - (buf.length % 4)) % 4;
    return pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
  };

  const posBuf = align(posBytes);
  const norBuf = align(norBytes);
  const idxBuf = align(idxBytes);

  const binary = Buffer.concat([posBuf, norBuf, idxBuf]);
  const posOffset = 0;
  const norOffset = posBuf.length;
  const idxOffset = posBuf.length + norBuf.length;

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < posArray.length; i += 3) {
    minX = Math.min(minX, posArray[i]);
    minY = Math.min(minY, posArray[i + 1]);
    minZ = Math.min(minZ, posArray[i + 2]);
    maxX = Math.max(maxX, posArray[i]);
    maxY = Math.max(maxY, posArray[i + 1]);
    maxZ = Math.max(maxZ, posArray[i + 2]);
  }

  const json = {
    asset: { version: "2.0", generator: "generate-mock-glb" },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [{ mesh: 0 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, NORMAL: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: "Gold",
        pbrMetallicRoughness: {
          baseColorFactor: [0.788, 0.635, 0.153, 1],
          metallicFactor: 1,
          roughnessFactor: 0.28,
        },
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: position.count,
        type: "VEC3",
        max: [maxX, maxY, maxZ],
        min: [minX, minY, minZ],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: normal.count,
        type: "VEC3",
      },
      {
        bufferView: 2,
        componentType: 5123,
        count: index.count,
        type: "SCALAR",
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: posOffset,
        byteLength: posBytes.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: norOffset,
        byteLength: norBytes.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: idxOffset,
        byteLength: idxBytes.length,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: binary.length }],
  };

  return buildGlb(json, binary);
}

const torus = new THREE.TorusGeometry(0.9, 0.12, 24, 64);
torus.rotateX(Math.PI / 2);
const buffer = geometryToGlb(torus);

fs.mkdirSync(outDir, { recursive: true });
const ringPath = path.join(outDir, "ring.glb");
fs.writeFileSync(ringPath, buffer);
console.log(`Wrote ${ringPath} (${buffer.length} bytes)`);

for (const type of TYPES) {
  if (type === "ring") continue;
  const dest = path.join(outDir, `${type}.glb`);
  fs.copyFileSync(ringPath, dest);
  console.log(`Copied ${dest}`);
}

console.log("Mock GLB assets ready for /models/ai-mock/");
