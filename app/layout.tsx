import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibm = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "رادار السوق السعودي",
  description: "لوحة محلية لمتابعة الأخبار الاقتصادية وقطاع الأعمال السعودي",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={ibm.className}>{children}</body>
    </html>
  );
}
