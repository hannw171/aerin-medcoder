import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppLayout from "@/components/AppLayout";
import { TourProvider } from "@/components/TourProvider";
import { VoiceCommandProvider } from "@/components/VoiceCommandContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clinical Medical Coder - Dashboard",
  description: "Dashboard for Clinical Medical Coder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <VoiceCommandProvider>
          <TourProvider>
            <AppLayout>{children}</AppLayout>
          </TourProvider>
        </VoiceCommandProvider>
      </body>
    </html>
  );
}
