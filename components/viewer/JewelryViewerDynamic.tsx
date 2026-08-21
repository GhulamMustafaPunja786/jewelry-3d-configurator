"use client";

import dynamic from "next/dynamic";
import type { RingConfig } from "@/types/jewelry";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const Viewer = dynamic(
  () =>
    import("./JewelryViewer").then((mod) => mod.JewelryViewer),
  {
    ssr: false,
    loading: () => <LoadingSpinner label="Loading viewer…" />,
  },
);

export function JewelryViewerDynamic({ config }: { config: RingConfig }) {
  return <Viewer config={config} />;
}
