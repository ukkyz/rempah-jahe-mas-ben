import { Suspense } from "react";
import SpiceExplorer from "@/components/SpiceExplorer";

export default function RempahPage() {
  return (
    <Suspense fallback={<div className="text-center text-white/50 py-20">Memuat rempah...</div>}>
      <SpiceExplorer />
    </Suspense>
  );
}
