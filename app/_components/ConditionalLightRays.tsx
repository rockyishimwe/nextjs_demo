"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

const LightRays = dynamic(() => import("@/components/LightRays"), {
  ssr: false,
  loading: () => null,
});

export default function ConditionalLightRays() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="absolute inset-0 top-0 z-[-1] min-h-screen">
      <LightRays
        raysOrigin="top-center-offset"
        raysColor="#5dfeca"
        raysSpeed={1.2}
        lightSpread={0.9}
        rayLength={1.4}
        followMouse={true}
        mouseInfluence={0.01}
        noiseAmount={0.0}
        distortion={0.01}
      />
    </div>
  );
}
