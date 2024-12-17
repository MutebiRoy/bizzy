// src\app\layout.tsx"
"use client";
import { useEffect, useState } from "react";
import type { Metadata } from "next";
import type { Viewport } from 'next'
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import ConvexClientProvider from "@/providers/convex-client-provider";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Bizmous",
	description: "Get paid to chat",
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	viewportFit: 'cover',
};

export default function RootLayout({ 
	children 
}: { 
	children: React.ReactNode 
}) {

	const [viewportHeight, setViewportHeight] = useState("100vh");

	useEffect(() => {
		// Function to set the height dynamically
		const updateHeight = () => {
		  setViewportHeight(`${window.innerHeight}px`);
		};
	
		window.addEventListener("resize", updateHeight);
		updateHeight(); // Set the initial height
	
		return () => window.removeEventListener("resize", updateHeight);
	}, []);
  
	return (
		<html lang='en'>
			<body className={inter.className} style={{ height: viewportHeight, overflow: "hidden" }}>
			<ThemeProvider 
					attribute='class' 
					defaultTheme='system' 
					enableSystem 
					disableTransitionOnChange>

					<ConvexClientProvider>
						{children}
						<Toaster />
					</ConvexClientProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
