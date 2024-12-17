// src/components/home/ClientLayout.tsx
"use client";

import { useEffect, useState } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [viewportHeight, setViewportHeight] = useState("100vh");

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(`${window.innerHeight}px`);
    };

    window.addEventListener("resize", updateHeight);
    updateHeight(); // Set initial height

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return (
    <div style={{ height: viewportHeight, overflow: "hidden" }}>
      {children}
    </div>
  );
}
