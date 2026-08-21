"use client";

import { Canvas } from "@react-three/fiber";
import { ContactShadows, OrbitControls, useGLTF } from "@react-three/drei";
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
  /** When true and model fails, show procedural torus with clear disclaimer */
  allowProceduralFallback?: boolean;
  className?: string;
};

function ProceduralFallbackMesh() {
  const metalMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#C9A227",
        metalness: 1,
        roughness: 0.28,
      }),
    [],
  );

  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metalMat}>
        <torusGeometry args={[0.9, 0.12, 32, 96]} />
      </mesh>
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
      }
    });
  }, [cloned]);

  return <primitive object={cloned} scale={1.2} />;
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
      {useFallback || !modelUrl ? (
        <ProceduralFallbackMesh />
      ) : (
        <GlbModel url={modelUrl} />
      )}
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
        autoRotateSpeed={0.55}
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
            key={retryKey}
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
              ? "Unable to load 3D model · Demo fallback mesh — not AI-generated"
              : "Demo fallback mesh — not AI-generated"}
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
