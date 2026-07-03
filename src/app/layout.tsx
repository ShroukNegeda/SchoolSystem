import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["600", "700", "800"],
});

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "إدارة غرب الزقازيق التعليمية مدرسة أحمد الشاذلى عز الإعدادية المشتركة",
  description: "منصة داخلية لإدارة الدرجات والحضور والغياب للمدرسين وشؤون الطلبة والإدارة",
  icons: {
    icon: "/Login.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${tajawal.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}