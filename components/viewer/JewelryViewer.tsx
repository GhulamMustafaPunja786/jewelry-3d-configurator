"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import * as THREE from "three";
import { getMetalByCode } from "@/data/metals";
import { getStoneByCode } from "@/data/stones";
import type { RingConfig } from "@/types/jewelry";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { ViewerErrorBoundary } from "@/components/viewer/ViewerErrorBoundary";

/**
 * Procedural ring (torus + gem) used when GLB assets are missing.
 * Place real models at public/models/rings/<slug>.glb and wire useGLTF later.
 */
function ProceduralRing({ config }: { config: RingConfig }) {
  const metal = getMetalByCode(config.metalCode);
  const stone = getStoneByCode(config.stoneCode);

  const bandRadius = 0.85 + (config.ringSize - 7) * 0.03;
  const tube = Math.max(0.06, config.bandWidthMm * 0.028);
  const gemScale = 0.18 + config.stoneCarats * 0.08;

  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: metal?.colorHex ?? "#D4AF37",
        metalness: metal?.metalness ?? 1,
        roughness:
          config.finish === "matte"
            ? 0.55
            : config.finish === "brushed"
              ? 0.4
              : (metal?.roughness ?? 0.22),
      }),
    [metal, config.finish],
  );

  const gemMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: stone?.colorHex ?? "#F5F7FF",
        metalness: 0,
        roughness: 0.05,
        transmission: stone?.transmission ?? 0.9,
        ior: stone?.ior ?? 2.4,
        thickness: 0.4,
        transparent: true,
      }),
    [stone],
  );

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metalMat}>
        <torusGeometry args={[bandRadius, tube, 32, 96]} />
      </mesh>
      <mesh position={[0, bandRadius + gemScale * 0.35, 0]} material={gemMat}>
        <octahedronGeometry args={[gemScale, 0]} />
      </mesh>
      <mesh position={[0, bandRadius + gemScale * 0.05, 0]} material={metalMat}>
        <cylinderGeometry
          args={[gemScale * 0.35, gemScale * 0.45, gemScale * 0.25, 16]}
        />
      </mesh>
    </group>
  );
}

function ViewerCanvas({ config }: { config: RingConfig }) {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 3.2], fov: 35 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.setClearColor("#f0ebe1", 1);
      }}
    >
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 6, 2]} intensity={1.35} />
      <directionalLight position={[-3, 2, -2]} intensity={0.45} />
      <hemisphereLight args={["#fff8ef", "#cfc4b4", 0.55]} />
      <ProceduralRing config={config} />
      <ContactShadows
        position={[0, -1.1, 0]}
        opacity={0.35}
        scale={8}
        blur={2.5}
      />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.6}
      />
    </Canvas>
  );
}

export function JewelryViewer({ config }: { config: RingConfig }) {
  return (
    <ViewerErrorBoundary>
      <div className="relative h-[360px] w-full overflow-hidden border border-[var(--color-border)] bg-[linear-gradient(160deg,#faf7f0_0%,#f0ebe1_55%,#e8e0d2_100%)] sm:h-[480px]">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner label="Preparing 3D preview…" />
            </div>
          }
        >
          <ViewerCanvas config={config} />
        </Suspense>
        <p className="pointer-events-none absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
          Drag to orbit · scroll to zoom
        </p>
      </div>
    </ViewerErrorBoundary>
  );
}
