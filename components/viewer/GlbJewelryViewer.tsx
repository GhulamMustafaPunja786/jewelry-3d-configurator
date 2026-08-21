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
  /** When true and model fails, show procedural solitaire with clear disclaimer */
  allowProceduralFallback?: boolean;
  className?: string;
};

/** Premium procedural solitaire used only when GLB cannot load. */
function ProceduralFallbackMesh() {
  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#C9A227",
        metalness: 1,
        roughness: 0.18,
        envMapIntensity: 1.2,
      }),
    [],
  );
  const gemMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#F5F7FF",
        metalness: 0,
        roughness: 0.02,
        transmission: 0.92,
        ior: 2.42,
        thickness: 0.45,
        transparent: true,
        reflectivity: 1,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
      }),
    [],
  );

  const prongs = useMemo(() => {
    const items: { x: number; z: number }[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      items.push({ x: Math.cos(a) * 0.145, z: Math.sin(a) * 0.145 });
    }
    return items;
  }, []);

  return (
    <group>
      {/* Band */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metalMat} castShadow>
        <torusGeometry args={[0.86, 0.078, 36, 128]} />
      </mesh>
      {/* Gallery */}
      <mesh position={[0, 0.76, 0]} material={metalMat} castShadow>
        <cylinderGeometry args={[0.1, 0.14, 0.14, 24, 1, true]} />
      </mesh>
      <mesh position={[0, 0.7, 0]} material={metalMat}>
        <cylinderGeometry args={[0.09, 0.09, 0.02, 24]} />
      </mesh>
      {/* Shoulders */}
      <mesh
        position={[-0.22, 0.58, 0]}
        rotation={[0, 0, 0.35]}
        material={metalMat}
        castShadow
      >
        <boxGeometry args={[0.06, 0.05, 0.1]} />
      </mesh>
      <mesh
        position={[0.22, 0.58, 0]}
        rotation={[0, 0, -0.35]}
        material={metalMat}
        castShadow
      >
        <boxGeometry args={[0.06, 0.05, 0.1]} />
      </mesh>
      {/* Center stone */}
      <mesh position={[0, 0.94, 0]} scale={[1, 1.15, 1]} material={gemMat} castShadow>
        <octahedronGeometry args={[0.2, 1]} />
      </mesh>
      {/* Prongs */}
      {prongs.map((p, i) => (
        <group key={i}>
          <mesh position={[p.x, 0.86, p.z]} material={metalMat} castShadow>
            <cylinderGeometry args={[0.012, 0.018, 0.22, 8]} />
          </mesh>
          <mesh position={[p.x * 0.92, 0.98, p.z * 0.92]} material={metalMat}>
            <sphereGeometry args={[0.014, 10, 10]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GlbModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useMemo(() => {
    cloned.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        const mat = obj.material;
        if (mat && !Array.isArray(mat) && "metalness" in mat) {
          const m = mat as THREE.MeshStandardMaterial;
          if ((m.metalness ?? 0) > 0.5) {
            m.envMapIntensity = 1.25;
            m.needsUpdate = true;
          }
        }
      }
    });
  }, [cloned]);

  return <primitive object={cloned} scale={1.15} />;
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
      camera={{ position: [0.35, 1.35, 3.1], fov: 32 }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#f0ebe1", 1);
      }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 7, 3]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3.5, 2.5, -2]} intensity={0.55} />
      <directionalLight position={[0, 2, 4]} intensity={0.35} color="#fff4e8" />
      <hemisphereLight args={["#fff8ef", "#b8a990", 0.4]} />
      <Suspense fallback={null}>
        <Environment preset="studio" />
      </Suspense>
      {useFallback || !modelUrl ? (
        <ProceduralFallbackMesh />
      ) : (
        <GlbModel url={modelUrl} />
      )}
      <ContactShadows
        position={[0, -1.05, 0]}
        opacity={0.4}
        scale={8}
        blur={2.2}
      />
      <OrbitControls
        enablePan={false}
        minDistance={2}
        maxDistance={6}
        target={[0, 0.35, 0]}
        autoRotate
        autoRotateSpeed={0.5}
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
