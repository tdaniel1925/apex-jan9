import Link from 'next/link';
import { Agent } from '@/lib/types/database';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface ReplicatedSiteFooterProps {
  agent: Agent;
}

export function ReplicatedSiteFooter({ agent }: ReplicatedSiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="text-sm text-muted-foreground">
              Building financial futures through trusted insurance solutions and entrepreneurial opportunities.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About Us</Link></li>
              <li><Link href="#" className="hover:text-foreground">Our Products</Link></li>
              <li><Link href="#" className="hover:text-foreground">Career Opportunity</Link></li>
              <li><Link href="#" className="hover:text-foreground">Testimonials</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Life Insurance</Link></li>
              <li><Link href="#" className="hover:text-foreground">Annuities</Link></li>
              <li><Link href="#" className="hover:text-foreground">IUL Policies</Link></li>
              <li><Link href="#" className="hover:text-foreground">Term Life</Link></li>
            </ul>
          </div>

          {/* Contact Agent */}
          <div>
            <h4 className="font-semibold mb-4">Your Agent</h4>
            <div className="space-y-3 text-sm">
              <p className="font-medium">{agent.first_name} {agent.last_name}</p>
              {agent.phone && (
                <a href={`tel:${agent.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <Phone className="h-4 w-4" />
                  {agent.phone}
                </a>
              )}
              <a href={`mailto:${agent.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Mail className="h-4 w-4" />
                {agent.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {currentYear} Apex Affinity Group. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-foreground">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground">Disclosures</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
