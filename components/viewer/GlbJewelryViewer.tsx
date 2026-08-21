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
import {
  CatalogSolitaireRing,
  parseMockRingAppearance,
} from "@/components/viewer/CatalogSolitaireRing";

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
  mat.envMapIntensity = 1.45;
  mat.needsUpdate = true;
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
  catalogAppearance,
}: {
  modelUrl: string | null;
  useFallback: boolean;
  catalogAppearance: ReturnType<typeof parseMockRingAppearance>;
}) {
  const showCatalog = Boolean(catalogAppearance) && !useFallback;

  return (
    <Canvas
      camera={{ position: [1.1, 1.35, 2.6], fov: 28 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#f0ebe1", 1);
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <ambientLight intensity={0.2} />
      <directionalLight position={[4, 7, 3]} intensity={1.5} color="#fff6ea" />
      <directionalLight position={[-3, 2, -2]} intensity={0.65} color="#dfe9ff" />
      <spotLight
        position={[2.5, 5, 2]}
        angle={0.32}
        penumbra={0.55}
        intensity={1.1}
        color="#ffffff"
      />
      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={1} />
      </Suspense>

      {showCatalog && catalogAppearance ? (
        <CatalogSolitaireRing appearance={catalogAppearance} />
      ) : useFallback || !modelUrl ? (
        <CatalogSolitaireRing
          appearance={{ metal: "yellow", variant: "solitaire", stone: "diamond" }}
        />
      ) : (
        <GlbModel url={modelUrl} />
      )}

      <ContactShadows
        position={[0, -0.95, 0]}
        opacity={0.22}
        scale={5.5}
        blur={3.2}
        far={3.5}
      />
      <OrbitControls
        enablePan={false}
        minDistance={1.6}
        maxDistance={5}
        target={[0, 0.55, 0]}
        autoRotate
        autoRotateSpeed={0.4}
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

  const catalogAppearance = useMemo(
    () => parseMockRingAppearance(modelUrl),
    [modelUrl],
  );

  // Mock catalog rings always render the live R3F solitaire (more realistic than baked GLB)
  const useCatalog = Boolean(catalogAppearance);
  const showFallback =
    !useCatalog && (loadFailed || !modelUrl) && allowProceduralFallback;
  const showErrorOnly =
    !useCatalog && (loadFailed || !modelUrl) && !allowProceduralFallback;

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
              useFallback={showFallback}
              catalogAppearance={catalogAppearance}
            />
          </GlbLoadErrorBoundary>
        </Suspense>
      )}

      <p className="pointer-events-none absolute bottom-3 left-3 text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-muted)]">
        Drag to orbit · scroll to zoom
      </p>
    </div>
  );
}
