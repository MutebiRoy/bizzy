// src/app/page.tsx"
"use client"; // <-- This makes the file a Client Component

import React, { useLayoutEffect } from "react";
import Head from "next/head";
import LeftPanel from "@/components/home/left-panel";



export default function Home() {
	useLayoutEffect(() => {
		const recalc = () => {
		  const headerEl = document.querySelector<HTMLElement>(".app-header");
		  const footerEl = document.querySelector<HTMLElement>(".app-footer");
		  const mainEl = document.querySelector<HTMLElement>(".app-main");
	  
		  if (!headerEl || !footerEl || !mainEl) return;
	  
		  mainEl.style.marginTop = `${headerEl.offsetHeight}px`;
		  mainEl.style.marginBottom = `${footerEl.offsetHeight}px`;
		};
	  
		recalc(); // run initially
		
		// Recalculate if device orientation or window size changes
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
