
'use client';
import { useState, useEffect } from 'react';
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import ConvexClientProvider from "@/providers/convex-client-provider";
import { Toaster } from "react-hot-toast";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Bizmous",
	description: "Get paid to chat",
	viewport: {
	  width: "device-width",
	  initialScale: 1.0,
	  maximumScale: 1.0,
	},
};


export default function RootLayout({
	children,
  }: Readonly<{
	children: React.ReactNode;
  }>): JSX.Element {
	const [width, setWidth] = useState(window.innerWidth);
  
	useEffect(() => {
	  const handleResize = () => setWidth(window.innerWidth);
	  window.addEventListener('resize', handleResize);
	  return () => window.removeEventListener('resize', handleResize);
	}, []);
  
	return (
	  <html lang='en'>
		<body className={inter.className} style={{ maxWidth: width, margin: '0 auto' }}>
		  <ThemeProvider attribute='class' defaultTheme='system' enableSystem disableTransitionOnChange>
			<ConvexClientProvider>
			  {children}
			  <Toaster />
			</ConvexClientProvider>
		  </ThemeProvider>
		</body>
	  </html>
	);
  }
