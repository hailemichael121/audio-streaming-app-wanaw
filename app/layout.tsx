import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AudioPlayerProvider } from "@/lib/AudioContext";
import { ThemeProvider } from "@/components/theme-provider";
import AudioPlayer from "@/components/AudioPlayer";
import PwaRegistration from "@/components/PwaRegistration";
import { Toaster } from "react-hot-toast";

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
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "var(--color-primary)",
                  color: "var(--color-primary-foreground)",
                  borderRadius: "12px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                },
              }}
            />
            <AudioPlayer />
            <PwaRegistration />
          </AudioPlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
