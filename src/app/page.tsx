// src/app/page.tsx
"use client";
import React, { useLayoutEffect } from "react";
import LeftPanel from "@/components/home/left-panel";

export default function Home() {
  
  return (
    <div className="flex flex-col h-screen">
      <LeftPanel />
    </div>
  );
}
