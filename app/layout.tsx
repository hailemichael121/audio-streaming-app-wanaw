import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AudioPlayerProvider } from "@/lib/AudioContext";
import { ThemeProvider } from "@/components/theme-provider";
import AudioPlayer from "@/components/AudioPlayer";
import PwaRegistration from "@/components/PwaRegistration";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "mezgebe sbhat",
  description: "Ethiopian Orthodox Church spiritual audio player",
  manifest: "/manifest.json",
  themeColor: "#1a1a2e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "mezgebe sbhat",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AudioPlayerProvider>
            {children}
            <AudioPlayer />
            <PwaRegistration />
          </AudioPlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
