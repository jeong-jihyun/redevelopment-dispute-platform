import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/ui";

export const metadata: Metadata = {
  title: "재개발 분쟁 도우미",
  description: "재개발·재건축 분쟁 법령·판례 검색, AI 법률정보 분석, 서류 자동 작성, 사건·증거 관리",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "재개발 분쟁 도우미", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1b2d52",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
