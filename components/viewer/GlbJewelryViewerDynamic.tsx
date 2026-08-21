"use client";

import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Viewer = dynamic(
  () =>
    import("./GlbJewelryViewer").then((mod) => mod.GlbJewelryViewer),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Loading viewer…" />,
  },
);

export function GlbJewelryViewerDynamic({
  modelUrl,
  allowProceduralFallback = true,
  className,
}: {
  modelUrl: string | null | undefined;
  allowProceduralFallback?: boolean;
  className?: string;
}) {
  return (
    <Viewer
      modelUrl={modelUrl}
      allowProceduralFallback={allowProceduralFallback}
      className={className}
    />
  );
}
