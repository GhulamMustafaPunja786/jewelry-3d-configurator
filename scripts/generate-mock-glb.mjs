/**
 * Generates higher-fidelity jewelry mock GLBs for visualization (not manufacturing CAD).
 * Ring assets: rounded band, gallery, four-prong head, faceted center stone,
 * plus halo / pavé variants.
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

  for (const part of parts) {
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
    asset: { version: "2.0", generator: "maison-atelier-mock-glb-v2" },
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

function metalMaterial(hex, roughness = 0.18) {
  const c = new THREE.Color(hex);
  return {
    name: "Metal",
    pbrMetallicRoughness: {
      baseColorFactor: [c.r, c.g, c.b, 1],
      metallicFactor: 1,
      roughnessFactor: roughness,
    },
  };
}

function stoneMaterial(hex, name, roughness = 0.04) {
  const c = new THREE.Color(hex);
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor: [c.r, c.g, c.b, 1],
      metallicFactor: 0.02,
      roughnessFactor: roughness,
    },
  };
}

/** D-cut band: flatter inner profile via lathe of a rounded rectangle. */
function createBand(metalMat, options = {}) {
  const radius = options.radius ?? 0.86;
  const width = options.width ?? 0.11;
  const height = options.height ?? 0.085;
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hh = height / 2;
  shape.moveTo(-hw, -hh);
  shape.lineTo(hw, -hh);
  shape.quadraticCurveTo(hw + 0.012, -hh, hw + 0.012, -hh + 0.012);
  shape.lineTo(hw + 0.012, hh - 0.012);
  shape.quadraticCurveTo(hw + 0.012, hh, hw, hh);
  shape.lineTo(-hw, hh);
  shape.quadraticCurveTo(-hw - 0.008, hh, -hw - 0.008, hh - 0.01);
  shape.lineTo(-hw - 0.008, -hh + 0.01);
  shape.quadraticCurveTo(-hw - 0.008, -hh, -hw, -hh);

  const geo = new THREE.LatheGeometry(shape.getPoints(12), 96);
  geo.rotateZ(Math.PI / 2);
  // Lathe around Y; scale/position so ring sits in XZ plane like a finger ring
  geo.rotateX(Math.PI / 2);
  // Expand to finger size — Lathe of small profile around Y creates vertical torus-like ring
  // Reset: simpler reliable approach — torus with elliptical tube via scale
  geo.dispose();

  const band = new THREE.TorusGeometry(radius, height * 0.95, 36, 128);
  band.rotateX(Math.PI / 2);
  band.scale(1, 1, width / (height * 1.9));
  return { geometry: band, material: metalMat };
}

function createProng(metalMat, x, y, z, tipY) {
  const prong = new THREE.CylinderGeometry(0.012, 0.018, tipY - y, 8);
  prong.translate(x, (y + tipY) / 2, z);
  // slight inward lean toward stone center
  const lean = 0.12;
  const len = tipY - y;
  prong.translate(-x * lean * 0.15, 0, -z * lean * 0.15);
  void len;
  return { geometry: prong, material: metalMat };
}

function createFacetedStone(stoneMat, y, size = 0.2) {
  // Double-ended brilliant-ish: octahedron with 1 subdivision reads as facets
  const gem = new THREE.OctahedronGeometry(size, 1);
  gem.translate(0, y, 0);
  gem.scale(1, 1.15, 1);
  return { geometry: gem, material: stoneMat };
}

/**
 * Classic four-prong solitaire with gallery and connected head.
 */
function createSolitaireRing(metalHex, stoneHex, stoneName, variant = "solitaire") {
  const metalMat = metalMaterial(metalHex);
  const stoneMat = stoneMaterial(stoneHex, stoneName);
  const accentStone = stoneMaterial("#F8FAFF", "AccentDiamond", 0.05);
  const parts = [];

  const bandWidth = variant === "pave" ? 0.14 : 0.1;
  parts.push(createBand(metalMat, { width: bandWidth, height: 0.08 }));

  const headY = 0.78;
  // Gallery / basket under the stone (connected to band)
  const gallery = new THREE.CylinderGeometry(0.1, 0.14, 0.14, 24, 1, true);
  gallery.translate(0, headY - 0.02, 0);
  parts.push({ geometry: gallery, material: metalMat });

  const galleryFloor = new THREE.CylinderGeometry(0.09, 0.09, 0.02, 24);
  galleryFloor.translate(0, headY - 0.08, 0);
  parts.push({ geometry: galleryFloor, material: metalMat });

  // Shoulder bridges from band top to gallery
  for (const side of [-1, 1]) {
    const bridge = new THREE.BoxGeometry(0.06, 0.05, 0.1);
    bridge.translate(side * 0.22, headY - 0.2, 0);
    bridge.rotateZ(side * -0.35);
    parts.push({ geometry: bridge, material: metalMat });
  }

  const stoneY = headY + 0.16;
  const stoneSize = variant === "halo" ? 0.17 : 0.2;
  parts.push(createFacetedStone(stoneMat, stoneY, stoneSize));

  // Four prongs gripping the girdle
  const prongR = stoneSize * 0.72;
  const tipY = stoneY + stoneSize * 0.55;
  const baseY = headY + 0.02;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const x = Math.cos(a) * prongR;
    const z = Math.sin(a) * prongR;
    parts.push(createProng(metalMat, x, baseY, z, tipY));
  }

  // Prong tips (small spheres)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const tip = new THREE.SphereGeometry(0.014, 10, 10);
    tip.translate(Math.cos(a) * prongR * 0.92, tipY, Math.sin(a) * prongR * 0.92);
    parts.push({ geometry: tip, material: metalMat });
  }

  if (variant === "halo") {
    const haloR = stoneSize + 0.08;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const small = new THREE.OctahedronGeometry(0.032, 0);
      small.translate(Math.cos(a) * haloR, stoneY - 0.02, Math.sin(a) * haloR);
      parts.push({ geometry: small, material: accentStone });
      const bezel = new THREE.CylinderGeometry(0.028, 0.03, 0.02, 8);
      bezel.translate(Math.cos(a) * haloR, stoneY - 0.045, Math.sin(a) * haloR);
      parts.push({ geometry: bezel, material: metalMat });
    }
  }

  if (variant === "pave") {
    for (let i = 0; i < 14; i++) {
      const a = ((i - 6.5) / 18) * Math.PI;
      const r = 0.86;
      const x = Math.sin(a) * r;
      const z = -Math.cos(a) * r;
      const y = 0.06;
      const small = new THREE.OctahedronGeometry(0.028, 0);
      small.translate(x, y, z);
      parts.push({ geometry: small, material: accentStone });
    }
  }

  return parts;
}

function writeRing(filename, metalHex, stoneHex, stoneName, variant = "solitaire") {
  const buffer = meshesToGlb(
    createSolitaireRing(metalHex, stoneHex, stoneName, variant),
  );
  const dest = path.join(outDir, filename);
  fs.writeFileSync(dest, buffer);
  console.log(`Wrote ${dest} (${buffer.length} bytes)`);
}

fs.mkdirSync(outDir, { recursive: true });

// Solitaire library (metal × stone)
writeRing("ring.glb", "#B76E79", "#F5F7FF", "Diamond", "solitaire");
writeRing("ring-diamond.glb", "#B76E79", "#F5F7FF", "Diamond", "solitaire");
writeRing("ring-diamond-yellow.glb", "#D4AF37", "#F5F7FF", "Diamond", "solitaire");
writeRing("ring-diamond-white.glb", "#E8E6E3", "#F5F7FF", "Diamond", "solitaire");
writeRing("ring-ruby.glb", "#B76E79", "#C41E3A", "Ruby", "solitaire");
writeRing("ring-sapphire.glb", "#E8E6E3", "#0F52BA", "Sapphire", "solitaire");
writeRing("ring-emerald.glb", "#D4AF37", "#50C878", "Emerald", "solitaire");

// Style variants
writeRing("ring-halo.glb", "#B76E79", "#F5F7FF", "Diamond", "halo");
writeRing("ring-halo-yellow.glb", "#D4AF37", "#F5F7FF", "Diamond", "halo");
writeRing("ring-pave.glb", "#E8E6E3", "#F5F7FF", "Diamond", "pave");
writeRing("ring-pave-rose.glb", "#B76E79", "#F5F7FF", "Diamond", "pave");

// Other categories: elegant metal loop placeholders
const loop = new THREE.TorusGeometry(0.9, 0.08, 28, 96);
loop.rotateX(Math.PI / 2);
const loopBuf = meshesToGlb([
  { geometry: loop, material: metalMaterial("#D4AF37") },
]);
for (const type of ["necklace", "chain", "pendant", "bracelet", "earrings"]) {
  const dest = path.join(outDir, `${type}.glb`);
  fs.writeFileSync(dest, loopBuf);
  console.log(`Wrote ${dest}`);
}

console.log("Mock GLB assets ready (solitaire / halo / pave).");
