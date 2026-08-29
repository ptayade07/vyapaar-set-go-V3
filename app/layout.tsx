import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-work-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Vyapaar Set Go",
  description: "Simple digital khata and shop hisaab for Indian small businesses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f5",
};

// Deliberately minimal: no sidebar/nav shell and no LangProvider here. Those only belong to the
// authenticated app section (app/(app)/layout.tsx) -- /login, /signup, /lock, /terms, and /privacy
// are all standalone screens with no i18n toggle and nothing to navigate to yet.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${workSans.variable} ${ibmPlexMono.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
