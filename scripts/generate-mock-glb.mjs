/**
 * Catalog-style mock ring GLBs (visualization only — not manufacturing CAD).
 *
 * Anatomy:
 *  - Tapered band (wider at head, thinner at bottom) via variable-radius sweep
 *  - 4-prong basket head gripping a seated center stone
 *  - Optional pavé (embedded in shoulders) and halo
 *
 * Usage: node scripts/generate-mock-glb.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as THREE from "three";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, "../public/models/ai-mock");

/* -------------------------------------------------------------------------- */
/* GLB writer                                                                  */
/* -------------------------------------------------------------------------- */

function buildGlb(json, binary) {
  const jsonBuffer = Buffer.from(JSON.stringify(json));
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
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: position.count,
      type: "VEC3",
      max: [maxX, maxY, maxZ],
      min: [minX, minY, minZ],
    });
    const posAcc = accessors.length - 1;
    buffersList.push(posBytes);
    byteOffset += posBytes.length;

    const norView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: Buffer.from(norArray.buffer).length,
      target: 34962,
    });
    accessors.push({
      bufferView: norView,
      componentType: 5126,
      count: normal.count,
      type: "VEC3",
    });
    const norAcc = accessors.length - 1;
    buffersList.push(norBytes);
    byteOffset += norBytes.length;

    const idxView = bufferViews.length;
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: Buffer.from(idxArray.buffer).length,
      target: 34963,
    });
    accessors.push({
      bufferView: idxView,
      componentType: idxArray instanceof Uint32Array ? 5125 : 5123,
      count: index.count,
      type: "SCALAR",
    });
    const idxAcc = accessors.length - 1;
    buffersList.push(idxBytes);
    byteOffset += idxBytes.length;

    primitives.push({
      attributes: { POSITION: posAcc, NORMAL: norAcc },
      indices: idxAcc,
      material: getMatIndex(part.material),
    });
  }

  const binary = Buffer.concat(buffersList);
  return buildGlb(
    {
      asset: { version: "2.0", generator: "maison-atelier-catalog-mock-v3" },
      scenes: [{ nodes: [0] }],
      scene: 0,
      nodes: [{ mesh: 0 }],
      meshes: [{ primitives }],
      materials,
      accessors,
      bufferViews,
      buffers: [{ byteLength: binary.length }],
    },
    binary,
  );
}

/* -------------------------------------------------------------------------- */
/* Materials                                                                   */
/* -------------------------------------------------------------------------- */

function metalMaterial(hex, roughness = 0.2) {
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

/** Named so the viewer can upgrade to MeshPhysicalMaterial + transmission. */
function stoneMaterial(hex, name, roughness = 0.06) {
  const c = new THREE.Color(hex);
  return {
    name,
    pbrMetallicRoughness: {
      baseColorFactor: [c.r, c.g, c.b, 1],
      metallicFactor: 0,
      roughnessFactor: roughness,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Geometry helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Tapered ring band in XZ plane (finger along Y).
 * Head at +Z (u = 0): thickest. Bottom at -Z (u = π): thinnest.
 */
function createTaperedBand(metalMat, opts = {}) {
  const R = opts.radius ?? 0.88;
  const rHead = opts.rHead ?? 0.095;
  const rBottom = opts.rBottom ?? 0.055;
  const radial = opts.radial ?? 28;
  const tubular = opts.tubular ?? 96;
  const widthScale = opts.widthScale ?? 1.15; // slightly wider in X than tall in Y

  const positions = [];
  const indices = [];

  for (let i = 0; i <= tubular; i++) {
    const u = (i / tubular) * Math.PI * 2;
    // 1 at head (+Z), 0 at bottom (−Z)
    const taper = 0.5 + 0.5 * Math.cos(u);
    const r = THREE.MathUtils.lerp(rBottom, rHead, taper);

    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const cx = (R + r * Math.cos(v) * widthScale) * Math.sin(u);
      const cy = r * Math.sin(v);
      const cz = (R + r * Math.cos(v) * widthScale) * Math.cos(u);
      positions.push(cx, cy, cz);
    }
  }

  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1);
      indices.push(b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return { geometry: geo, material: metalMat };
}

/** Round-brilliant-ish: faceted octahedron with flattened table + pavilion depth. */
function createRoundBrilliant(size, stoneMat) {
  const geo = new THREE.OctahedronGeometry(size, 2);
  const pos = geo.getAttribute("position");
  const tableY = size * 0.22;
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i);
    if (y > tableY) {
      pos.setY(i, tableY + (y - tableY) * 0.15);
    }
    // deepen pavilion
    if (y < 0) {
      pos.setY(i, y * 1.25);
    }
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  // Seat so girdle (~y=0 of stone) sits at world origin of stone group;
  // we translate so table faces +Y and girdle is mid-height.
  geo.translate(0, size * 0.08, 0);
  return { geometry: geo, material: stoneMat };
}

function createProng(metalMat, angle, radius, baseY, tipY) {
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const h = tipY - baseY;
  const geo = new THREE.CylinderGeometry(0.01, 0.016, h, 10);
  // lean slightly inward toward stone center
  const midY = (baseY + tipY) / 2;
  geo.translate(x * 0.92, midY, z * 0.92);
  const tip = new THREE.SphereGeometry(0.012, 10, 10);
  tip.translate(x * 0.85, tipY, z * 0.85);
  return [
    { geometry: geo, material: metalMat },
    { geometry: tip, material: metalMat },
  ];
}

/**
 * Classic 4-prong solitaire (+ optional pavé / halo).
 * Ring sits with head at +Z; we rotate the whole group later for viewer (+Y up head).
 */
function createCatalogRing(metalHex, stoneHex, stoneName, variant = "solitaire") {
  const metalMat = metalMaterial(metalHex, 0.2);
  const stoneMat = stoneMaterial(stoneHex, stoneName, 0.05);
  const accentMat = stoneMaterial("#F7F9FF", "AccentDiamond", 0.04);
  const parts = [];

  const hasPave = variant === "pave" || variant === "halo-pave";
  const hasHalo = variant === "halo" || variant === "halo-pave";

  parts.push(
    createTaperedBand(metalMat, {
      radius: 0.88,
      rHead: hasPave ? 0.1 : 0.092,
      rBottom: 0.052,
      widthScale: 1.2,
    }),
  );

  // Head sits on outer top of band (+Z)
  const headZ = 0.88 + 0.02;
  const basketY = 0.02;

  // Basket / gallery cup under stone
  const gallery = new THREE.CylinderGeometry(0.085, 0.12, 0.11, 24, 1, true);
  gallery.rotateX(Math.PI / 2);
  gallery.translate(0, basketY, headZ + 0.04);
  parts.push({ geometry: gallery, material: metalMat });

  const galleryFloor = new THREE.CylinderGeometry(0.07, 0.07, 0.018, 20);
  galleryFloor.rotateX(Math.PI / 2);
  galleryFloor.translate(0, basketY, headZ + 0.01);
  parts.push({ geometry: galleryFloor, material: metalMat });

  // Shoulder bridges into head
  for (const side of [-1, 1]) {
    const bridge = new THREE.BoxGeometry(0.07, 0.045, 0.14);
    bridge.translate(side * 0.2, basketY + 0.01, headZ - 0.08);
    bridge.rotateZ(side * -0.25);
    bridge.rotateX(-0.35);
    parts.push({ geometry: bridge, material: metalMat });
  }

  const stoneSize = hasHalo ? 0.155 : 0.175;
  const girdleZ = headZ + 0.1;
  const brilliant = createRoundBrilliant(stoneSize, stoneMat);
  // Orient stone: table toward +Z (outward from finger), pavilion toward band
  brilliant.geometry.rotateX(-Math.PI / 2);
  brilliant.geometry.translate(0, basketY + 0.02, girdleZ);
  parts.push(brilliant);

  // 4 prongs gripping girdle
  const prongR = stoneSize * 0.78;
  const baseZ = girdleZ - 0.06;
  const tipZ = girdleZ + stoneSize * 0.35;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    // Prongs along a circle in XY at z~girdle — rebuild for Z-forward head
    const x = Math.cos(a) * prongR;
    const y = Math.sin(a) * prongR + basketY + 0.02;
    const h = tipZ - baseZ;
    const shaft = new THREE.CylinderGeometry(0.01, 0.015, h, 10);
    shaft.rotateX(Math.PI / 2);
    shaft.translate(x * 0.9, y, (baseZ + tipZ) / 2);
    parts.push({ geometry: shaft, material: metalMat });
    const tip = new THREE.SphereGeometry(0.011, 10, 10);
    tip.translate(x * 0.82, y, tipZ - 0.01);
    parts.push({ geometry: tip, material: metalMat });
  }

  if (hasHalo) {
    const haloR = stoneSize + 0.07;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const hx = Math.cos(a) * haloR;
      const hy = Math.sin(a) * haloR + basketY + 0.02;
      const hz = girdleZ - 0.01;
      const small = new THREE.OctahedronGeometry(0.028, 1);
      small.rotateX(-Math.PI / 2);
      small.translate(hx, hy, hz);
      parts.push({ geometry: small, material: accentMat });
      const bezel = new THREE.CylinderGeometry(0.022, 0.026, 0.016, 8);
      bezel.rotateX(Math.PI / 2);
      bezel.translate(hx, hy, hz - 0.02);
      parts.push({ geometry: bezel, material: metalMat });
    }
  }

  if (hasPave) {
    // Embed along both shoulders (±X, near +Z head) into the band surface
    for (const side of [-1, 1]) {
      for (let i = 0; i < 8; i++) {
        // u angles from near head toward sides
        const u = side * ((0.18 + i * 0.09) * Math.PI);
        const R = 0.88;
        const rSurf = 0.072;
        const cx = (R + rSurf * 0.35) * Math.sin(u);
        const cy = rSurf * 0.55; // slightly into outer surface
        const cz = (R + rSurf * 0.35) * Math.cos(u);
        const small = new THREE.OctahedronGeometry(0.024, 0);
        small.translate(cx, cy, cz);
        parts.push({ geometry: small, material: accentMat });
      }
    }
  }

  // Rotate so head faces +Y for the viewer (catalog framing)
  for (const part of parts) {
    part.geometry.rotateX(-Math.PI / 2);
  }

  return parts;
}

function writeRing(filename, metalHex, stoneHex, stoneName, variant) {
  const buffer = meshesToGlb(
    createCatalogRing(metalHex, stoneHex, stoneName, variant),
  );
  const dest = path.join(outDir, filename);
  fs.writeFileSync(dest, buffer);
  console.log(`Wrote ${filename} (${buffer.length} bytes)`);
}

function copyAs(srcName, destName) {
  fs.copyFileSync(path.join(outDir, srcName), path.join(outDir, destName));
  console.log(`Alias ${destName} ← ${srcName}`);
}

/* -------------------------------------------------------------------------- */
/* Build library                                                               */
/* -------------------------------------------------------------------------- */

fs.mkdirSync(outDir, { recursive: true });

const YELLOW = "#D4AF37";
const WHITE = "#E8E6E3";
const ROSE = "#B76E79";
const DIAMOND = "#F4F7FF";

// Solitaire × metal
writeRing("ring-solitaire-yellow.glb", YELLOW, DIAMOND, "Diamond", "solitaire");
writeRing("ring-solitaire-white.glb", WHITE, DIAMOND, "Diamond", "solitaire");
writeRing("ring-solitaire-rose.glb", ROSE, DIAMOND, "Diamond", "solitaire");

// Pavé band × metal
writeRing("ring-pave-yellow.glb", YELLOW, DIAMOND, "Diamond", "pave");
writeRing("ring-pave-white.glb", WHITE, DIAMOND, "Diamond", "pave");
writeRing("ring-pave-rose.glb", ROSE, DIAMOND, "Diamond", "pave");

// Halo × metal
writeRing("ring-halo-yellow.glb", YELLOW, DIAMOND, "Diamond", "halo");
writeRing("ring-halo-white.glb", WHITE, DIAMOND, "Diamond", "halo");
writeRing("ring-halo-rose.glb", ROSE, DIAMOND, "Diamond", "halo");

// Colored center stones (solitaire yellow / rose / white)
writeRing("ring-ruby.glb", ROSE, "#C41E3A", "Ruby", "solitaire");
writeRing("ring-sapphire.glb", WHITE, "#0F52BA", "Sapphire", "solitaire");
writeRing("ring-emerald.glb", YELLOW, "#50C878", "Emerald", "solitaire");

// Legacy aliases (persisted DesignVersion URLs)
copyAs("ring-solitaire-rose.glb", "ring.glb");
copyAs("ring-solitaire-rose.glb", "ring-diamond.glb");
copyAs("ring-solitaire-yellow.glb", "ring-diamond-yellow.glb");
copyAs("ring-solitaire-white.glb", "ring-diamond-white.glb");
copyAs("ring-halo-rose.glb", "ring-halo.glb");
copyAs("ring-pave-white.glb", "ring-pave.glb");

// Non-ring placeholders
const loop = createTaperedBand(metalMaterial(YELLOW), {
  radius: 0.9,
  rHead: 0.07,
  rBottom: 0.07,
});
loop.geometry.rotateX(-Math.PI / 2);
const loopBuf = meshesToGlb([loop]);
for (const type of ["necklace", "chain", "pendant", "bracelet", "earrings"]) {
  fs.writeFileSync(path.join(outDir, `${type}.glb`), loopBuf);
  console.log(`Wrote ${type}.glb`);
}

console.log("Catalog mock GLB library ready.");
