import type { Metadata, Viewport } from "next";
import PwaRegister from "@/components/PwaRegister";
import "./globals.css";
import "./mobile.css";
import "./foldable.css";
import "./destination-scroll.css";
import "./desktop-height.css";
import "./tablet.css";

export const metadata: Metadata = {
  title: "ICN FIDS v0.2",
  description: "Incheon International Airport passenger departure FIDS",
  applicationName: "ICN FIDS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "ICN FIDS",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1263ba",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
