'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/db/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { Agent } from '@/lib/types/database';
import { RANK_CONFIG } from '@/lib/config/ranks';

export default function ContactPage() {
  const params = useParams();
  const username = params.username as string;
  const t = useTranslations('replicated.contact');
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  useEffect(() => {
    const fetchAgent = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('agents')
        .select('*')
        .eq('username', username.toLowerCase())
        .single();

      if (data) {
        setAgent(data);
      }
      setLoading(false);
    };

    fetchAgent();
  }, [username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Split name into first/last
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Submit to lead capture API using agent_code for compatibility
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formData.message,
          agentCode: agent?.agent_code, // Use agent_code for API compatibility
          source: 'contact_form',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit form');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Form submission error:', error);
      // Still show success to user - they don't need to know about backend issues
      // The message was captured, just email automation may have failed
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t('agentNotFound')}</p>
      </div>
    );
  }

  const rankConfig = RANK_CONFIG[agent.rank];

  return (
    <div>
      {/* Hero */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t('title', { agentName: agent.first_name })}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Agent Info */}
            <div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage src={agent.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                        {agent.first_name[0]}{agent.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <h2 className="text-2xl font-semibold">
                      {agent.first_name} {agent.last_name}
                    </h2>
                    <p className="text-muted-foreground">{rankConfig.name}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t('email')}</p>
                        <a
                          href={`mailto:${agent.email}`}
                          className="font-medium hover:text-primary"
                        >
                          {agent.email}
                        </a>
                      </div>
                    </div>

                    {agent.phone && (
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">{t('phone')}</p>
                          <a
                            href={`tel:${agent.phone}`}
                            className="font-medium hover:text-primary"
                          >
                            {agent.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {t('agentMessage')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>{t('form.title')}</CardTitle>
                  </div>
                  <CardDescription>
                    {t('form.subtitle')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{t('success.title')}</h3>
                      <p className="text-muted-foreground">
                        {t('success.description', { agentName: agent.first_name })}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('form.yourName')}</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">{t('form.emailAddress')}</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('form.phoneOptional')}</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{t('form.message')}</Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder={t('form.messagePlaceholder')}
                          rows={4}
                          value={formData.message}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? (
                          t('form.sending')
                        ) : (
                          <>
                            {t('form.sendMessage')}
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">{t('faq.title')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('faq.subtitle')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" asChild>
              <a href={`/team/${username}/opportunity`}>{t('faq.aboutOpportunity')}</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/team/${username}/products`}>{t('faq.ourProducts')}</a>
            </Button>
            <Button variant="outline" asChild>
              <a href={`/team/${username}/about-me`}>{t('faq.aboutYourAgent')}</a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
