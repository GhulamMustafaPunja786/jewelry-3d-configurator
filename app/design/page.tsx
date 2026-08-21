import { Suspense } from "react";
import DesignClient from "./DesignClient";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

export default function DesignRoute() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading design studio…" />}>
      <DesignClient />
    </Suspense>
  );
}
