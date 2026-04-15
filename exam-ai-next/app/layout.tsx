import type { Metadata } from "next";
import localFont from "next/font/local";
import NextAuthProvider from "@/context/NextAuthContext";
import Footer from "@/components/sessions/footer/footer";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Exam-AI",
  description: "Generate exam questions from text, topis or sites using AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextAuthProvider>{children}</NextAuthProvider>
        <Footer />
      </body>
    </html>
  );
}
