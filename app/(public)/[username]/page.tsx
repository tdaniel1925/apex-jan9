// SPEC: SPEC-PAGES > Replicated Distributor Page
// DEP-MAP: FEATURE 2 > Replicated Page

import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { findDistributorByUsername, trackSignupEvent } from "@/lib/db/queries";
import { headers } from "next/headers";
import { getClientIp } from "@/lib/rate-limit";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/ContactForm";
import { OpportunitySection } from "@/components/marketing/OpportunitySection";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  const distributor = await findDistributorByUsername(username);

  if (!distributor) {
    return {
      title: "Distributor Not Found",
    };
  }

  const fullName = `${distributor.firstName} ${distributor.lastName}`;

  return {
    title: `${fullName} - Apex Affinity Group`,
    description: `Join ${fullName}'s team at Apex Affinity Group. ${distributor.bio || "Start your journey to financial freedom today."}`,
    openGraph: {
      title: `${fullName} - Apex Affinity Group`,
      description: `Join ${fullName}'s team at Apex Affinity Group`,
      images: distributor.photoUrl ? [distributor.photoUrl] : [],
    },
  };
}

export default async function ReplicatedPage({ params }: PageProps) {
  const { username } = await params;

  // Lookup distributor by username (case-insensitive)
  const distributor = await findDistributorByUsername(username);

  if (!distributor) {
    notFound();
  }

  // Track page view analytics
  const headersList = await headers();
  const clientIp = getClientIp(headersList);
  const userAgent = headersList.get("user-agent") || undefined;
  const referrer = headersList.get("referer") || undefined;

  // Track async (non-blocking)
  trackSignupEvent({
    distributorSlug: distributor.username,
    event: "page_view",
    visitorIp: clientIp,
    userAgent,
    referrer,
    metadata: {},
  }).catch((error) => {
    console.error("Failed to track page view:", error);
  });

  const fullName = `${distributor.firstName} ${distributor.lastName}`;
  const initials = `${distributor.firstName.charAt(0)}${distributor.lastName.charAt(0)}`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + Distributor */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
              >
                Apex
              </Link>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>|</span>
                <Avatar className="h-8 w-8">
                  {distributor.photoUrl && (
                    <AvatarImage
                      src={distributor.photoUrl}
                      alt={fullName}
                    />
                  )}
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground">{fullName}</span>
              </div>
            </div>

            {/* Right: CTAs */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <a href="#contact">Contact Me</a>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/join/${distributor.username}`}>
                  Join My Team
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Personalized */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-blue-800 text-white py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Distributor Photo */}
            <Avatar className="h-32 w-32 mx-auto mb-6 ring-4 ring-white/20">
              {distributor.photoUrl && (
                <AvatarImage
                  src={distributor.photoUrl}
                  alt={fullName}
                />
              )}
              <AvatarFallback className="bg-white/10 text-white text-4xl">
                {initials}
              </AvatarFallback>
            </Avatar>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Join {distributor.firstName}'s Team
            </h1>

            {distributor.bio && (
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-2xl mx-auto">
                {distributor.bio}
              </p>
            )}

            {!distributor.bio && (
              <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-2xl mx-auto">
                Start your journey to financial freedom with the Apex Affinity
                Group
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href={`/join/${distributor.username}`}>
                  Join My Team
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-white text-white hover:bg-white/10">
                <a href="#contact">Get In Touch</a>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      </section>

      {/* Opportunity Section - Reused from corporate */}
      <OpportunitySection />

      {/* How It Works - Personalized */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How to Get Started
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to join {distributor.firstName}'s team
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-8 shadow-md text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Learn About the Opportunity
              </h3>
              <p className="text-muted-foreground">
                Explore how Apex Affinity Group can help you achieve your
                financial goals and build a sustainable business.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-8 shadow-md text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Sign Up with {distributor.firstName}
              </h3>
              <p className="text-muted-foreground">
                Create your account and get your own replicated site to start
                sharing the opportunity with others.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-8 shadow-md text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Start Building Your Team
              </h3>
              <p className="text-muted-foreground">
                Share your replicated site with prospects and watch your
                organization grow through our 5×7 matrix system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Contact {distributor.firstName}
              </h2>
              <p className="text-xl text-muted-foreground">
                Have questions? Send {distributor.firstName} a message and they'll
                get back to you soon.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <ContactForm
                distributorId={distributor.id}
                distributorName={fullName}
                distributorEmail={distributor.email}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Join {distributor.firstName}'s Team?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Start your journey today and get your own replicated site to build
            your business.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href={`/join/${distributor.username}`}>
              Join Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <MarketingFooter />
    </div>
  );
}
