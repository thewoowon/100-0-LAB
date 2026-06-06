import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const danjo = localFont({
  src: "../public/fonts/Danjo-bold-Regular.otf",
  variable: "--font-danjo",
  display: "swap",
});

const pretendard = localFont({
  src: [
    { path: "../public/fonts/Pretendard-Thin.otf", weight: "100" },
    { path: "../public/fonts/Pretendard-ExtraLight.otf", weight: "200" },
    { path: "../public/fonts/Pretendard-Light.otf", weight: "300" },
    { path: "../public/fonts/Pretendard-Regular.otf", weight: "400" },
    { path: "../public/fonts/Pretendard-Medium.otf", weight: "500" },
    { path: "../public/fonts/Pretendard-SemiBold.otf", weight: "600" },
    { path: "../public/fonts/Pretendard-Bold.otf", weight: "700" },
    { path: "../public/fonts/Pretendard-ExtraBold.otf", weight: "800" },
    { path: "../public/fonts/Pretendard-Black.otf", weight: "900" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: "100:0 LAB — 블랙박스 영상 플랫폼",
  description: "블랙박스 영상만을 다루는 영상 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${danjo.variable} ${pretendard.variable} antialiased`} style={{ fontFamily: "var(--font-pretendard), sans-serif" }}>
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
          strategy="afterInteractive"
        />
        <Header />
        <main>{children}</main>
        <footer className="max-w-6xl mx-auto px-4 py-8 mt-16 flex gap-4 flex-wrap" style={{ borderTop: "1px solid var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>© 2025 100:0 연구소</span>
          <a href="/policy/terms" className="text-xs" style={{ color: "var(--text-muted)" }}>이용약관</a>
          <a href="/policy/privacy" className="text-xs" style={{ color: "var(--text-muted)" }}>개인정보처리방침</a>
        </footer>
      </body>
    </html>
  );
}
