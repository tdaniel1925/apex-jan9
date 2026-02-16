// Layout for public pages (marketing, replicated pages)

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Are You Enjoying What You Do? — Apex Affinity Group",
  description:
    "The only insurance company with AI-powered automation. Own your book, access top rates through 3Mark Financial, and build wealth through your team.",
  keywords: "insurance business opportunity, life insurance agent, own your book, AI automation, team growth, passive income",
  openGraph: {
    title: "Are You Enjoying What You Do? — Apex Affinity Group",
    description:
      "The only insurance company with AI that does the follow-up for you. Own your business. Keep your commissions. Build a legacy.",
    images: ["/logo/apex-full-color.png"],
    type: "website",
    url: "https://theapexway.net",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
