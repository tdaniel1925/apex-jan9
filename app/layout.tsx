import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ErrorHandler } from "@/components/error-handler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apex Affinity Group",
  description: "Agent Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground" suppressHydrationWarning>
        <ErrorHandler />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
