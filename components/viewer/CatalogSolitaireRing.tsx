"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { MeshTransmissionMaterial } from "@react-three/drei";

export type CatalogMetalTone = "yellow" | "white" | "rose";
export type CatalogRingVariant = "solitaire" | "pave" | "halo";
export type CatalogStoneKind =
  | "diamond"
  | "ruby"
  | "sapphire"
  | "emerald";

export type CatalogRingAppearance = {
  metal: CatalogMetalTone;
  variant: CatalogRingVariant;
  stone: CatalogStoneKind;
};

const METAL_HEX: Record<CatalogMetalTone, string> = {
  yellow: "#E1B84A",
  white: "#EDEAE6",
  rose: "#C97B84",
};

const STONE_HEX: Record<CatalogStoneKind, string> = {
  diamond: "#F7F9FF",
  ruby: "#C41E3A",
  sapphire: "#1E4DB7",
  emerald: "#2E8B57",
};

/** Parse `/models/ai-mock/ring-*.glb` into appearance; null if not a mock ring. */
export function parseMockRingAppearance(
  modelUrl: string | null | undefined,
): CatalogRingAppearance | null {
  if (!modelUrl?.includes("/models/ai-mock/ring")) return null;

  const file = modelUrl.split("/").pop()?.toLowerCase() ?? "";
  let metal: CatalogMetalTone = "rose";
  if (file.includes("yellow")) metal = "yellow";
  else if (file.includes("white") || file.includes("sapphire")) metal = "white";
  else if (file.includes("emerald")) metal = "yellow";
  else if (file.includes("ruby")) metal = "rose";

  let variant: CatalogRingVariant = "solitaire";
  if (file.includes("halo")) variant = "halo";
  else if (file.includes("pave")) variant = "pave";

  let stone: CatalogStoneKind = "diamond";
  if (file.includes("ruby")) stone = "ruby";
  else if (file.includes("sapphire")) stone = "sapphire";
  else if (file.includes("emerald")) stone = "emerald";

  return { metal, variant, stone };
}

function createTaperedBandGeometry(
  radius = 0.9,
  rHead = 0.095,
  rBottom = 0.048,
): THREE.BufferGeometry {
  const radial = 32;
  const tubular = 128;
  const widthScale = 1.25;
  const positions: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= tubular; i++) {
    const u = (i / tubular) * Math.PI * 2;
    // Head at +Y after we build in XZ and rotate — build with head at +Y directly
    // u=0 → +X; shift so u=π/2 is head (+Y)
    const uHead = u - Math.PI / 2;
    const taper = 0.5 + 0.5 * Math.cos(uHead);
    const r = THREE.MathUtils.lerp(rBottom, rHead, taper);

    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const cx = (radius + r * Math.cos(v) * widthScale) * Math.cos(u);
      const cy = (radius + r * Math.cos(v) * widthScale) * Math.sin(u);
      const cz = r * Math.sin(v);
      positions.push(cx, cy, cz);
    }
  }

  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * High-fidelity mock solitaire rendered in R3F (not a torus + floating gem).
 * Head at +Y, finger through Z, catalog three-quarter framing.
 */
export function CatalogSolitaireRing({
  appearance,
}: {
  appearance: CatalogRingAppearance;
}) {
  const { metal, variant, stone } = appearance;
  const hasPave = variant === "pave";
  const hasHalo = variant === "halo";

  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: METAL_HEX[metal],
        metalness: 1,
        roughness: metal === "white" ? 0.16 : 0.2,
        envMapIntensity: 1.55,
      }),
    [metal],
  );

  const bandGeo = useMemo(
    () =>
      createTaperedBandGeometry(
        0.9,
        hasPave ? 0.1 : 0.092,
        0.046,
      ),
    [hasPave],
  );

  const stoneSize = hasHalo ? 0.16 : 0.185;
  const headY = 0.9;
  const girdleY = headY + 0.12;
  const prongR = stoneSize * 0.72;

  const prongs = useMemo(() => {
    const items: { x: number; z: number; rot: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      items.push({
        x: Math.cos(a) * prongR,
        z: Math.sin(a) * prongR,
        rot: a,
      });
    }
    return items;
  }, [prongR]);

  const paveSlots = useMemo(() => {
    if (!hasPave) return [];
    const slots: { x: number; y: number; z: number }[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i++) {
        const t = 0.22 + i * 0.085;
        const u = Math.PI / 2 + side * t;
        const R = 0.9;
        const embed = 0.055;
        slots.push({
          x: Math.cos(u) * (R + embed * 0.2),
          y: Math.sin(u) * (R + embed * 0.2),
          z: embed * 0.85,
        });
      }
    }
    return slots;
  }, [hasPave]);

  const haloSlots = useMemo(() => {
    if (!hasHalo) return [];
    const slots: { x: number; z: number }[] = [];
    const hr = stoneSize + 0.075;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      slots.push({ x: Math.cos(a) * hr, z: Math.sin(a) * hr });
    }
    return slots;
  }, [hasHalo, stoneSize]);

  const stoneColor = STONE_HEX[stone];
  const isDiamond = stone === "diamond";

  return (
    <group position={[0, -0.2, 0]} rotation={[0.12, 0.35, 0]}>
      {/* Tapered shank */}
      <mesh geometry={bandGeo} material={metalMat} castShadow receiveShadow />

      {/* Gallery / basket under the stone */}
      <mesh
        position={[0, girdleY - 0.08, 0]}
        material={metalMat}
        castShadow
      >
        <cylinderGeometry args={[0.09, 0.13, 0.1, 28, 1, true]} />
      </mesh>
      <mesh position={[0, girdleY - 0.12, 0]} material={metalMat}>
        <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} />
      </mesh>

      {/* Shoulders flowing into the head */}
      {([-1, 1] as const).map((side) => (
        <mesh
          key={side}
          position={[side * 0.22, headY - 0.05, 0]}
          rotation={[0.15, 0, side * -0.4]}
          material={metalMat}
          castShadow
        >
          <boxGeometry args={[0.08, 0.06, 0.12]} />
        </mesh>
      ))}

      {/* Four prongs gripping the girdle */}
      {prongs.map((p, i) => (
        <group key={i}>
          <mesh
            position={[p.x * 0.95, girdleY - 0.02, p.z * 0.95]}
            rotation={[0.2, p.rot, 0.18]}
            material={metalMat}
            castShadow
          >
            <cylinderGeometry args={[0.014, 0.02, 0.2, 12]} />
          </mesh>
          {/* Claw tip curling over the crown */}
          <mesh
            position={[p.x * 0.78, girdleY + stoneSize * 0.42, p.z * 0.78]}
            material={metalMat}
            castShadow
          >
            <sphereGeometry args={[0.016, 12, 12]} />
          </mesh>
        </group>
      ))}

      {/* Center stone — seated in the head */}
      <mesh
        position={[0, girdleY + stoneSize * 0.05, 0]}
        scale={[1, 1.12, 1]}
        castShadow
      >
        <octahedronGeometry args={[stoneSize, 2]} />
        {isDiamond ? (
          <MeshTransmissionMaterial
            backside
            samples={8}
            resolution={512}
            transmission={0.95}
            roughness={0.05}
            thickness={0.45}
            ior={2.4}
            chromaticAberration={0.12}
            anisotropy={0.25}
            distortion={0.08}
            distortionScale={0.15}
            temporalDistortion={0}
            color={stoneColor}
            attenuationColor="#e8eefc"
            attenuationDistance={0.5}
          />
        ) : (
          <meshPhysicalMaterial
            color={stoneColor}
            metalness={0}
            roughness={0.08}
            transmission={0.55}
            ior={1.77}
            thickness={0.4}
            transparent
            clearcoat={0.8}
            clearcoatRoughness={0.05}
            envMapIntensity={1.3}
          />
        )}
      </mesh>

      {/* Halo */}
      {haloSlots.map((h, i) => (
        <group key={`h-${i}`}>
          <mesh
            position={[h.x, girdleY - 0.02, h.z]}
            material={metalMat}
          >
            <cylinderGeometry args={[0.024, 0.028, 0.018, 8]} />
          </mesh>
          <mesh position={[h.x, girdleY + 0.01, h.z]} castShadow>
            <octahedronGeometry args={[0.026, 1]} />
            <MeshTransmissionMaterial
              samples={4}
              resolution={256}
              transmission={0.92}
              roughness={0.06}
              thickness={0.2}
              ior={2.4}
              color="#F7F9FF"
            />
          </mesh>
        </group>
      ))}

      {/* Pavé along shoulders */}
      {paveSlots.map((s, i) => (
        <group key={`p-${i}`}>
          <mesh position={[s.x, s.y, s.z]} castShadow>
            <octahedronGeometry args={[0.022, 0]} />
            <MeshTransmissionMaterial
              samples={3}
              resolution={128}
              transmission={0.9}
              roughness={0.08}
              thickness={0.15}
              ior={2.4}
              color="#F7F9FF"
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
