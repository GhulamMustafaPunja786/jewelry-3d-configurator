"use client";

import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  OrbitControls,
  useGLTF,
} from "@react-three/drei";
import {
  Component,
  Suspense,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import * as THREE from "three";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/Button";

type GlbJewelryViewerProps = {
  modelUrl: string | null | undefined;
  allowProceduralFallback?: boolean;
  className?: string;
};

const STONE_NAME_RE =
  /diamond|ruby|sapphire|emerald|accent|gem|stone/i;

function isStoneMaterial(mat: THREE.Material): boolean {
  return STONE_NAME_RE.test(mat.name || "");
}

function upgradeStoneMaterial(
  mat: THREE.MeshStandardMaterial,
): THREE.MeshPhysicalMaterial {
  const color = mat.color?.clone() ?? new THREE.Color("#F4F7FF");
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughness: 0.02,
    transmission: 0.88,
    ior: 2.42,
    thickness: 0.4,
    transparent: true,
    opacity: 1,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    attenuationColor: color,
    attenuationDistance: 0.6,
    envMapIntensity: 1.4,
  });
}

function polishMetalMaterial(mat: THREE.MeshStandardMaterial) {
  mat.metalness = 1;
  mat.roughness = Math.min(mat.roughness ?? 0.2, 0.22);
  mat.envMapIntensity = 1.35;
  mat.needsUpdate = true;
}

/** Catalog-style procedural solitaire if GLB fails to load. */
function ProceduralFallbackMesh() {
  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#D4AF37",
        metalness: 1,
        roughness: 0.2,
        envMapIntensity: 1.35,
      }),
    [],
  );
  const gemMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#F4F7FF",
        metalness: 0,
        roughness: 0.02,
        transmission: 0.88,
        ior: 2.42,
        thickness: 0.4,
        transparent: true,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.4,
      }),
    [],
  );

  const prongs = useMemo(() => {
    const items: { x: number; z: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      items.push({ x: Math.cos(a) * 0.13, z: Math.sin(a) * 0.13 });
    }
    return items;
  }, []);

  return (
    <group position={[0, -0.15, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metalMat} castShadow>
        <torusGeometry args={[0.86, 0.07, 36, 128]} />
      </mesh>
      <mesh position={[0, 0.82, 0]} material={metalMat} castShadow>
        <cylinderGeometry args={[0.09, 0.12, 0.1, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 0.94, 0]} scale={[1, 1.1, 1]} material={gemMat} castShadow>
        <octahedronGeometry args={[0.17, 2]} />
      </mesh>
      {prongs.map((p, i) => (
        <group key={i}>
          <mesh position={[p.x, 0.88, p.z]} material={metalMat} castShadow>
            <cylinderGeometry args={[0.01, 0.015, 0.18, 8]} />
          </mesh>
          <mesh position={[p.x * 0.85, 0.98, p.z * 0.85]} material={metalMat}>
            <sphereGeometry args={[0.012, 10, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const root = scene.clone(true);
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      const next = mats.map((mat) => {
        if (!(mat instanceof THREE.MeshStandardMaterial)) return mat;
        if (isStoneMaterial(mat) || (mat.metalness ?? 1) < 0.3) {
          return upgradeStoneMaterial(mat);
        }
        polishMetalMaterial(mat);
        return mat;
      });
      obj.material = Array.isArray(obj.material) ? next : next[0];
    });
    return root;
  }, [scene]);

  return <primitive object={cloned} scale={1.05} />;
}

function ViewerCanvas({
  modelUrl,
  useFallback,
}: {
  modelUrl: string | null;
  useFallback: boolean;
}) {
  return (
    <Canvas
      camera={{ position: [0.55, 1.55, 2.85], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.2,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#f0ebe1", 1);
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 4]} intensity={1.45} color="#fff8f0" />
      <directionalLight position={[-4, 3, -3]} intensity={0.55} color="#e8f0ff" />
      <directionalLight position={[0, 4, 5]} intensity={0.4} color="#ffe8d0" />
      <spotLight
        position={[2, 5, 3]}
        angle={0.35}
        penumbra={0.6}
        intensity={0.8}
        color="#ffffff"
      />
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={0.85} />
      </Suspense>
      {useFallback || !modelUrl ? (
        <ProceduralFallbackMesh />
      ) : (
        <GlbModel url={modelUrl} />
      )}
      <ContactShadows
        position={[0, -0.95, 0]}
        opacity={0.28}
        scale={6}
        blur={2.8}
        far={4}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={5.5}
        target={[0, 0.45, 0]}
        autoRotate
        autoRotateSpeed={0.45}
      />
    </Canvas>
  );
}

class GlbLoadErrorBoundary extends Component<
  {
    children: ReactNode;
    onError: () => void;
  },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[GlbJewelryViewer]", error, info.componentStack);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

export function GlbJewelryViewer({
  modelUrl,
  allowProceduralFallback = true,
  className,
}: GlbJewelryViewerProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const showFallback = (loadFailed || !modelUrl) && allowProceduralFallback;
  const showErrorOnly = (loadFailed || !modelUrl) && !allowProceduralFallback;

  return (
    <div
      className={
        className ??
        "relative h-[360px] w-full overflow-hidden border border-[var(--color-border)] bg-[linear-gradient(160deg,#faf7f0_0%,#f0ebe1_55%,#e8e0d2_100%)] sm:h-[480px]"
      }
    >
      {showErrorOnly ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="font-display text-xl text-[var(--color-ink)]">
            Unable to load 3D model
          </p>
          <p className="max-w-sm text-sm text-[var(--color-ink-muted)]">
            The generated mesh could not be displayed. You can still continue
            with your estimate or try generating another design.
          </p>
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setLoadFailed(false);
              setRetryKey((k) => k + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner label="Loading 3D model…" />
            </div>
          }
        >
          <GlbLoadErrorBoundary
            key={`${retryKey}-${modelUrl ?? "none"}`}
            onError={() => setLoadFailed(true)}
          >
            <ViewerCanvas
              modelUrl={modelUrl ?? null}
              useFallback={showFallback || !modelUrl}
            />
          </GlbLoadErrorBoundary>
        </Suspense>
      )}

      {showFallback ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-[rgba(32,28,24,0.72)] px-3 py-2 text-center">
          <p className="text-[11px] tracking-wide text-[#f5f0e6]">
            {loadFailed
              ? "Unable to load 3D model · Studio fallback mesh — not manufacturing CAD"
              : "Studio fallback mesh — not manufacturing CAD"}
          </p>
        </div>
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
          Drag to orbit · scroll to zoom
        </p>
      )}
    </div>
  );
}
