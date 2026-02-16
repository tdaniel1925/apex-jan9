// SPEC: OPTIVE REDESIGN > Marketing Footer
// SOURCE: index.html lines 1975-2106

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-apex-navy-950 to-apex-navy-dark text-gray-300">
      {/* Main Footer Content */}
      <div className="container max-w-optive mx-auto px-6 py-16">
        {/* Logo & Description */}
        <div className="mb-12">
          <Link href="/" className="inline-block mb-4 group">
            <Image
              src="/logo/apex-white.png"
              alt="Apex Affinity Group"
              width={200}
              height={66}
              className="h-16 w-auto opacity-100 group-hover:opacity-80 transition-opacity"
            />
          </Link>
          <p className="text-gray-400 max-w-md">
            Empowering individuals to achieve financial independence through proven business systems, comprehensive training, and unwavering support.
          </p>
        </div>

        {/* Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          {/* Quick Links */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="hover:text-apex-red transition-colors duration-300">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#about" className="hover:text-apex-red transition-colors duration-300">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#opportunity" className="hover:text-apex-red transition-colors duration-300">
                  Opportunity
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-apex-red transition-colors duration-300">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-apex-red transition-colors duration-300">
                  Distributor Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="#" className="hover:text-apex-red transition-colors duration-300">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-apex-red transition-colors duration-300">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-apex-red transition-colors duration-300">
                  Income Disclosure
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-apex-red transition-colors duration-300">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-heading font-semibold text-lg mb-4">Contact Information</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-apex-red flex-shrink-0 mt-0.5" />
                <a href="mailto:info@apexaffinitygroup.com" className="hover:text-apex-red transition-colors duration-300">
                  info@apexaffinitygroup.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-apex-red flex-shrink-0 mt-0.5" />
                <a href="tel:+15551234567" className="hover:text-apex-red transition-colors duration-300">
                  (555) 123-4567
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-apex-red flex-shrink-0 mt-0.5" />
                <span>123 Business Ave, Suite 100<br />City, State 12345</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-heading font-semibold mb-4 sm:mb-0">Follow Us On Socials:</h3>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-apex-red rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-apex-red rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-apex-red rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-gray-800 hover:bg-apex-red rounded-full flex items-center justify-center transition-colors duration-300"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-gray-800">
        <div className="container max-w-optive mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>Copyright © {currentYear} Apex Affinity Group. All Rights Reserved.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-apex-red transition-colors duration-300">
                Terms & Conditions
              </Link>
              <Link href="#" className="hover:text-apex-red transition-colors duration-300">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Large Site Name (Optive Style) */}
      <div className="border-t border-gray-800 py-8 overflow-hidden">
        <div className="container max-w-optive mx-auto px-6">
          <div className="text-center">
            <h2 className="text-6xl sm:text-7xl lg:text-8xl font-heading font-bold text-gray-900 select-none">
              Apex
            </h2>
          </div>
        </div>
      </div>
    </footer>
  );
}
