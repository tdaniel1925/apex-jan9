// SPEC: OPTIVE REDESIGN > Marketing Header
// SOURCE: index.html lines 48-105

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";

interface MarketingHeaderProps {
  variant: "corporate" | "replicated";
  distributorName?: string;
  ctaLink: string;
}

export function MarketingHeader({ variant, distributorName, ctaLink }: MarketingHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const navLinks = variant === "corporate"
    ? [
        { label: "Home", href: "#home" },
        { label: "About", href: "#about" },
        { label: "Opportunity", href: "#opportunity" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "FAQ", href: "#faq" },
        { label: "Contact", href: "#contact" },
      ]
    : [
        { label: `About ${distributorName?.split(" ")[0] || "Us"}`, href: "#about" },
        { label: "Opportunity", href: "#opportunity" },
        { label: "How to Join", href: "#how-to-join" },
        { label: "Contact", href: "#contact" },
      ];

  const ctaText = variant === "corporate"
    ? "Join Now"
    : `Join ${distributorName?.split(" ")[0] || "Us"}`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white ${
        isScrolled ? "shadow-md" : ""
      }`}
    >
      <nav className="container max-w-optive mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo/apex-full-color.png"
              alt="Apex Affinity Group"
              width={180}
              height={60}
              priority
              className="h-12 w-auto transition-opacity group-hover:opacity-80"
            />
            {variant === "replicated" && distributorName && (
              <span className="hidden sm:block text-sm text-apex-gray border-l border-apex-gray/30 pl-3">
                with {distributorName.split(" ")[0]}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-base font-medium text-apex-gray hover:text-apex-navy transition-colors duration-300 cursor-pointer"
              >
                {link.label}
              </a>
            ))}
            <Link
              href={ctaLink}
              className="relative inline-flex items-center justify-center gap-2 px-6 py-3 pr-12 rounded bg-apex-red hover:bg-apex-red-dark text-white text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 group"
            >
              {ctaText}
              <span className="absolute right-5 transition-transform duration-400 group-hover:translate-x-0.5">
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-apex-dark hover:text-apex-navy transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 animate-in slide-in-from-top duration-300">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="py-3 px-4 text-apex-gray hover:text-apex-navy hover:bg-apex-bg rounded transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href={ctaLink}
                className="mt-4 px-6 py-3 bg-apex-red hover:bg-apex-red-dark text-white text-center rounded font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {ctaText}
              </Link>
            </nav>
          </div>
        )}
      </nav>
    </header>
  );
}
