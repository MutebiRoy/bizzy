// src/app/page.tsx
"use client";
import React, { useLayoutEffect } from "react";
import LeftPanel from "@/components/home/left-panel";

export default function Home() {
  useLayoutEffect(() => {
    function recalc() {
      const headerEl = document.querySelector<HTMLElement>(".app-header");
      const footerEl = document.querySelector<HTMLElement>(".app-footer");
      const mainEl = document.querySelector<HTMLElement>("#conversationListMain");

      if (!headerEl || !footerEl || !mainEl) return;

      const totalHF = headerEl.offsetHeight + footerEl.offsetHeight;
      mainEl.style.height = `calc(100vh - ${totalHF}px)`;
      (mainEl.style as any).webkitOverflowScrolling = "touch";
      mainEl.style.overflowY = "auto";
    }

    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);

    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <LeftPanel />
    </div>
  );
}
