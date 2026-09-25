import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Michroma } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/web/theme-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

// Configure Michroma
export const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-michroma", // Define a CSS variable name
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TaskPulse - Collaborative Workspace",
  description: "Next.js 16 + Firebase In-Depth Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en" suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="w-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
          <Providers>{children}</Providers>
        </ThemeProvider>
        
      </body>
    </html>
  );
}