import Link from 'next/link';
import { Agent } from '@/lib/types/database';
import { Phone, Mail, Facebook, Linkedin, Twitter, Instagram } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

interface ReplicatedSiteFooterProps {
  agent: Agent;
  agentCode?: string;
}

export function ReplicatedSiteFooter({ agent, agentCode }: ReplicatedSiteFooterProps) {
  const currentYear = new Date().getFullYear();
  // Use agent code from props or fall back to agent's code
  const code = agentCode || agent.agent_code;
  const basePath = `/join/${code}`;

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
              <a href="https://facebook.com/apexaffinity" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://linkedin.com/company/apexaffinity" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="https://twitter.com/apexaffinity" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://instagram.com/apexaffinity" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href={`${basePath}/about-me`} className="hover:text-foreground">About Your Agent</Link></li>
              <li><Link href="/carriers" className="hover:text-foreground">Our Carriers</Link></li>
              <li><Link href="/compare" className="hover:text-foreground">Compare</Link></li>
              <li><Link href="/faq" className="hover:text-foreground">FAQ</Link></li>
              <li><Link href={`${basePath}/contact`} className="hover:text-foreground">Contact Us</Link></li>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="font-semibold mb-4">Get Started</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/professionals" className="hover:text-foreground">Licensed Agents</Link></li>
              <li><Link href="/new-to-insurance" className="hover:text-foreground">New to Insurance</Link></li>
              <li><Link href={`${basePath}/opportunity`} className="hover:text-foreground">Career Opportunity</Link></li>
              <li><Link href={`${basePath}/signup`} className="hover:text-foreground">Join Our Team</Link></li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold mb-4">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/carriers#life-insurance" className="hover:text-foreground">Life Insurance</Link></li>
              <li><Link href="/carriers#annuities" className="hover:text-foreground">Annuities</Link></li>
              <li><Link href="/carriers#iul" className="hover:text-foreground">IUL Policies</Link></li>
              <li><Link href="/carriers#term-life" className="hover:text-foreground">Term Life</Link></li>
              <li><Link href="/carriers#final-expense" className="hover:text-foreground">Final Expense</Link></li>
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
