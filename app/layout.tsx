import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Affinity Group",
  description: "Building success together",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
