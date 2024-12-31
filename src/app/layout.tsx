// src\app\layout.tsx"
import { ClerkProvider } from "@clerk/nextjs";
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
  
	return (
		<ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
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
		</ClerkProvider>
	);
}
