import { useEffect } from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import ConvexClientProvider from "@/providers/convex-client-provider";
import { Toaster } from "react-hot-toast";
import ViewportHeightSetter from '@/components/home/ViewportHeightSetter';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Bizmous",
	description: "Get paid to chat",
	viewport: {
	  width: "device-width",
	  initialScale: 1.0
	},
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  
	return (
		<html lang='en'>
			<body className={inter.className}>
			<ViewportHeightSetter /> {/* Include the Client Component here */}
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
