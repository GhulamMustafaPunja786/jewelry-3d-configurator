/**
 * Generates jewelry mock GLBs for visualization (not manufacturing CAD).
 * Ring assets include a band + center stone so diamond requests look correct.
 *
 * Usage: node scripts/generate-mock-glb.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/models/ai-mock");

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
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLength, 8);

  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonChunk.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);

  const parts = [header, jsonHeader, jsonChunk];
  if (binChunk.length) {
    const binHeader = Buffer.alloc(8);
    binHeader.writeUInt32LE(binChunk.length, 0);
    binHeader.writeUInt32LE(0x004e4942, 4);
    parts.push(binHeader, binChunk);
  }
  return Buffer.concat(parts);
}

function align4(buf) {
  const pad = (4 - (buf.length % 4)) % 4;
  return pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
}

function prepareGeometry(geometry) {
  geometry.computeVertexNormals();
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  let index = geometry.getIndex();
  if (!index) {
    const indices = [];
    for (let i = 0; i < position.count; i++) indices.push(i);
    geometry.setIndex(indices);
    index = geometry.getIndex();
  }
  return { position, normal, index };
}

function meshesToGlb(parts) {
  /** @type {{ geometry: THREE.BufferGeometry, materialIndex: number }[]} */
  const meshParts = parts;
  const materials = [];
  const materialMap = new Map();

  const getMatIndex = (mat) => {
    const key = JSON.stringify(mat);
    if (materialMap.has(key)) return materialMap.get(key);
    const idx = materials.length;
    materials.push(mat);
    materialMap.set(key, idx);
    return idx;
  };

  const accessors = [];
  const bufferViews = [];
  const primitives = [];
  const buffersList = [];
  let byteOffset = 0;

  for (const part of meshParts) {
    const { position, normal, index } = prepareGeometry(part.geometry);
    const posArray = new Float32Array(position.array);
    const norArray = new Float32Array(normal.array);
    const idxArray =
      index.count > 65535
        ? new Uint32Array(index.array)
        : new Uint16Array(index.array);

    const posBytes = align4(Buffer.from(posArray.buffer));
    const norBytes = align4(Buffer.from(norArray.buffer));
    const idxBytes = align4(Buffer.from(idxArray.buffer));

    let minX = Infinity,
      minY = Infinity,
      minZ = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity,
      maxZ = -Infinity;
    for (let i = 0; i < posArray.length; i += 3) {
      minX = Math.min(minX, posArray[i]);
      minY = Math.min(minY, posArray[i + 1]);
      minZ = Math.min(minZ, posArray[i + 2]);
      maxX = Math.max(maxX, posArray[i]);
      maxY = Math.max(maxY, posArray[i + 1]);
      maxZ = Math.max(maxZ, posArray[i + 2]);
    }

    const posView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: Buffer.from(posArray.buffer).length,
      target: 34962,
    });
    const posAcc = accessors.length;
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: position.count,
      type: "VEC3",
      max: [maxX, maxY, maxZ],
      min: [minX, minY, minZ],
    });
    buffersList.push(posBytes);
    byteOffset += posBytes.length;

    const norView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: Buffer.from(norArray.buffer).length,
      target: 34962,
    });
    const norAcc = accessors.length;
    accessors.push({
      bufferView: norView,
      componentType: 5126,
      count: normal.count,
      type: "VEC3",
    });
    buffersList.push(norBytes);
    byteOffset += norBytes.length;

    const idxView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: Buffer.from(idxArray.buffer).length,
      target: 34963,
    });
    const idxAcc = accessors.length;
    accessors.push({
      bufferView: idxView,
      componentType: idxArray instanceof Uint32Array ? 5125 : 5123,
      count: index.count,
      type: "SCALAR",
    });
    buffersList.push(idxBytes);
    byteOffset += idxBytes.length;

    primitives.push({
      attributes: { POSITION: posAcc, NORMAL: norAcc },
      indices: idxAcc,
      material: getMatIndex(part.material),
    });
  }

  const binary = Buffer.concat(buffersList);
  const json = {
    asset: { version: "2.0", generator: "maison-atelier-mock-glb" },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives }],
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: binary.length }],
  };

  return buildGlb(json, binary);
}

function metalMaterial(hex) {
  const c = new THREE.Color(hex);
  return {
    name: "Metal",
    pbrMetallicRoughness: {
      baseColorFactor: [c.r, c.g, c.b, 1],
      metallicFactor: 1,
      roughnessFactor: 0.22,
    },
  };
}

function stoneMaterial(hex, name) {
  const c = new THREE.Color(hex);
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor: [c.r, c.g, c.b, 1],
      metallicFactor: 0.05,
      roughnessFactor: 0.08,
    },
  };
}

function createSolitaireRing(metalHex, stoneHex, stoneName) {
  const band = new THREE.TorusGeometry(0.85, 0.09, 28, 96);
  band.rotateX(Math.PI / 2);

  const setting = new THREE.CylinderGeometry(0.12, 0.16, 0.12, 16);
  setting.translate(0, 0.9, 0);

  const gem = new THREE.OctahedronGeometry(0.22, 0);
  gem.translate(0, 1.08, 0);

  // halo diamonds
  const halo = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const small = new THREE.OctahedronGeometry(0.045, 0);
    small.translate(Math.cos(a) * 0.28, 0.95, Math.sin(a) * 0.28);
    halo.push({
      geometry: small,
      material: stoneMaterial(stoneHex, `${stoneName}Halo`),
    });
  }

  return [
    { geometry: band, material: metalMaterial(metalHex) },
    { geometry: setting, material: metalMaterial(metalHex) },
    { geometry: gem, material: stoneMaterial(stoneHex, stoneName) },
    ...halo,
  ];
}

function writeSolitaire(filename, metalHex, stoneHex, stoneName) {
  const buffer = meshesToGlb(
    createSolitaireRing(metalHex, stoneHex, stoneName),
  );
  const dest = path.join(outDir, filename);
  fs.writeFileSync(dest, buffer);
  console.log(`Wrote ${dest} (${buffer.length} bytes)`);
}

fs.mkdirSync(outDir, { recursive: true });

// Primary diamond ring (rose gold — matches common demo prompt)
writeSolitaire("ring.glb", "#B76E79", "#F5F7FF", "Diamond");
writeSolitaire("ring-diamond.glb", "#B76E79", "#F5F7FF", "Diamond");
writeSolitaire("ring-diamond-yellow.glb", "#D4AF37", "#F5F7FF", "Diamond");
writeSolitaire("ring-diamond-white.glb", "#E8E6E3", "#F5F7FF", "Diamond");
writeSolitaire("ring-ruby.glb", "#B76E79", "#C41E3A", "Ruby");
writeSolitaire("ring-sapphire.glb", "#E8E6E3", "#0F52BA", "Sapphire");
writeSolitaire("ring-emerald.glb", "#D4AF37", "#50C878", "Emerald");

// Other categories: elegant band / loop placeholders (still metal PBR)
const bandOnly = new THREE.TorusGeometry(0.9, 0.1, 24, 64);
bandOnly.rotateX(Math.PI / 2);
const bandBuf = meshesToGlb([
  { geometry: bandOnly, material: metalMaterial("#D4AF37") },
]);
for (const type of ["necklace", "chain", "pendant", "bracelet", "earrings"]) {
  const dest = path.join(outDir, `${type}.glb`);
  fs.writeFileSync(dest, bandBuf);
  console.log(`Wrote ${dest}`);
}

console.log("Mock GLB assets ready (solitaire + gem).");
