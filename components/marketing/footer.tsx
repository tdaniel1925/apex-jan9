/**
 * Marketing Site Footer
 * Footer for public marketing pages
 */

import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { Phone, Mail, MapPin, Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';

export function MarketingFooter(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              Building financial futures through trusted insurance solutions and entrepreneurial opportunities since 2018.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com/theapexway" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://linkedin.com/company/theapexway" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://twitter.com/theapexway" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://instagram.com/theapexway" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="font-semibold mb-4">Get Started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/professionals" className="hover:text-foreground">Licensed Agents</Link></li>
              <li><Link href="/new-to-insurance" className="hover:text-foreground">New to Insurance</Link></li>
              <li><Link href="/opportunity" className="hover:text-foreground">Career Opportunity</Link></li>
              <li><Link href="/join" className="hover:text-foreground">Join Apex</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/opportunity#life-insurance" className="hover:text-foreground">Life Insurance</Link></li>
              <li><Link href="/opportunity#annuities" className="hover:text-foreground">Annuities</Link></li>
              <li><Link href="/opportunity#final-expense" className="hover:text-foreground">Final Expense</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Dallas, Texas</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href="tel:+18885550123" className="hover:text-foreground">(888) 555-0123</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@theapexway.net" className="hover:text-foreground">info@theapexway.net</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {currentYear} Apex Affinity Group. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              <Link href="/income-disclaimer" className="hover:text-foreground">Income Disclosure</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
