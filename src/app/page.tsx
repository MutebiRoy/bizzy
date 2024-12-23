// src/app/page.tsx
"use client";

import React, { useLayoutEffect } from "react";
import LeftPanel from "@/components/home/left-panel";

export default function Home() {
  useLayoutEffect(() => {
    // Safari fix: measure header + footer, set <main> to the exact leftover height
    function recalc() {
      const headerEl = document.querySelector<HTMLElement>(".app-header");
      const footerEl = document.querySelector<HTMLElement>("footerJs");
      // We'll share the same <main> for both conversation list + chat
      const mainEl = document.querySelector<HTMLElement>("#conversationListMain");

      if (!headerEl || !footerEl || !mainEl) return;

      // Calculate total height used by the header and footer
      const totalHF = headerEl.offsetHeight + footerEl.offsetHeight;
      // Force <main> to fill the remaining vertical space (100vh - header - footer)
      mainEl.style.height = `calc(100vh - ${totalHF}px)`;
      // Safari “smooth scroll” on iOS
      (mainEl.style as any).webkitOverflowScrolling = "touch";
      mainEl.style.overflowY = "auto";
    }

    recalc(); // Run immediately

    // Re-run on orientation/resize, since Safari can change viewport height
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
