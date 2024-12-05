// src\app\layout.tsx"
import { useEffect } from "react";
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
	viewport: "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover",
};

export default function RootLayout({ 
	children 
}: { 
	children: React.ReactNode 
}) {
  
	return (
		<html lang='en'>
			<body className={inter.className}>
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
