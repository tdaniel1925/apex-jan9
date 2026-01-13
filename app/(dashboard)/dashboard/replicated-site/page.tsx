'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  Copy,
  ExternalLink,
  Loader2,
  Save,
  Eye,
  Palette,
  Share2,
  User,
  CheckCircle,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
} from 'lucide-react';
import { toast } from 'sonner';

interface SiteSettings {
  id: string;
  agent_code: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  site_headline: string | null;
  site_cta_text: string | null;
  site_primary_color: string | null;
  show_phone: boolean;
  show_email: boolean;
  replicated_site_enabled: boolean;
  social_facebook: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  social_youtube: string | null;
  social_tiktok: string | null;
  site_url: string;
}

const DEFAULT_COLOR = '#0ea5e9';

const PRESET_COLORS = [
  '#0ea5e9', // Sky blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#22c55e', // Green
  '#14b8a6', // Teal
  '#f43f5e', // Rose
  '#0891b2', // Cyan
  '#84cc16', // Lime
];

export default function ReplicatedSitePage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [bio, setBio] = useState('');
  const [headline, setHeadline] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_COLOR);
  const [showPhone, setShowPhone] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [siteEnabled, setSiteEnabled] = useState(false);
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/replicated-site/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Populate form
        setBio(data.bio || '');
        setHeadline(data.site_headline || '');
        setCtaText(data.site_cta_text || 'Join My Team');
        setPrimaryColor(data.site_primary_color || DEFAULT_COLOR);
        setShowPhone(data.show_phone ?? true);
        setShowEmail(data.show_email ?? true);
        setSiteEnabled(data.replicated_site_enabled ?? false);
        setSocialFacebook(data.social_facebook || '');
        setSocialInstagram(data.social_instagram || '');
        setSocialLinkedin(data.social_linkedin || '');
        setSocialYoutube(data.social_youtube || '');
        setSocialTiktok(data.social_tiktok || '');
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/replicated-site/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: bio || null,
          site_headline: headline || null,
          site_cta_text: ctaText || null,
          site_primary_color: primaryColor || null,
          show_phone: showPhone,
          show_email: showEmail,
          replicated_site_enabled: siteEnabled,
          social_facebook: socialFacebook || null,
          social_instagram: socialInstagram || null,
          social_linkedin: socialLinkedin || null,
          social_youtube: socialYoutube || null,
          social_tiktok: socialTiktok || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        toast.success('Settings saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = () => {
    if (!settings) return;
    const fullUrl = `${window.location.origin}${settings.site_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Unable to load settings</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Replicated Site</h1>
          <p className="text-muted-foreground">
            Customize your personal agent website
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={settings.site_url} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Link>
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Site URL Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Your Personal Site</p>
                <p className="text-sm text-muted-foreground">
                  {typeof window !== 'undefined' ? window.location.origin : ''}{settings.site_url}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyLink}>
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={settings.site_url} target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" />
            Social Links
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                This information is displayed on your replicated site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar preview */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={settings.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {settings.first_name[0]}{settings.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">
                    {settings.first_name} {settings.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{settings.email}</p>
                  <Link href="/dashboard/settings" className="text-sm text-primary hover:underline">
                    Update profile photo in Settings
                  </Link>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Personal Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell visitors about yourself and why they should join your team..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="headline">Custom Headline</Label>
                <Input
                  id="headline"
                  placeholder="Your custom headline for the hero section..."
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the default headline
                </p>
              </div>

              {/* CTA Text */}
              <div className="space-y-2">
                <Label htmlFor="cta">Call-to-Action Button Text</Label>
                <Input
                  id="cta"
                  placeholder="Join My Team"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  maxLength={50}
                />
              </div>

              {/* Contact visibility */}
              <div className="space-y-4">
                <Label>Contact Information Visibility</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Show Phone Number</p>
                      <p className="text-xs text-muted-foreground">
                        Display your phone number on the site
                      </p>
                    </div>
                    <Switch checked={showPhone} onCheckedChange={setShowPhone} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Show Email Address</p>
                      <p className="text-xs text-muted-foreground">
                        Display your email address on the site
                      </p>
                    </div>
                    <Switch checked={showEmail} onCheckedChange={setShowEmail} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Site Enable/Disable */}
          <Card>
            <CardHeader>
              <CardTitle>Site Status</CardTitle>
              <CardDescription>
                Enable or disable your replicated site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Site Enabled</p>
                  <p className="text-sm text-muted-foreground">
                    When disabled, visitors will see a &quot;Coming Soon&quot; page
                  </p>
                </div>
                <Switch checked={siteEnabled} onCheckedChange={setSiteEnabled} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize your site&apos;s primary color
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Color picker */}
              <div className="space-y-3">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="h-12 w-12 rounded-lg border-2 border-border cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => document.getElementById('color-input')?.click()}
                  />
                  <Input
                    id="color-input"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-28 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Preset colors */}
              <div className="space-y-3">
                <Label>Preset Colors</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`h-10 w-10 rounded-lg transition-all ${
                        primaryColor === color
                          ? 'ring-2 ring-offset-2 ring-primary'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setPrimaryColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <div className="border rounded-lg p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span className="font-semibold">Sample Button</span>
                  </div>
                  <Button style={{ backgroundColor: primaryColor }}>
                    {ctaText || 'Join My Team'}
                  </Button>
                  <p className="text-sm" style={{ color: primaryColor }}>
                    This is how links will look
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Add your social media profiles to display on your site
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facebook" className="flex items-center gap-2">
                  <Facebook className="h-4 w-4" />
                  Facebook
                </Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/yourprofile"
                  value={socialFacebook}
                  onChange={(e) => setSocialFacebook(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram" className="flex items-center gap-2">
                  <Instagram className="h-4 w-4" />
                  Instagram
                </Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/yourprofile"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input
                  id="linkedin"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={socialLinkedin}
                  onChange={(e) => setSocialLinkedin(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtube" className="flex items-center gap-2">
                  <Youtube className="h-4 w-4" />
                  YouTube
                </Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={socialYoutube}
                  onChange={(e) => setSocialYoutube(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok" className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                  TikTok
                </Label>
                <Input
                  id="tiktok"
                  type="url"
                  placeholder="https://tiktok.com/@yourprofile"
                  value={socialTiktok}
                  onChange={(e) => setSocialTiktok(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save button (sticky footer) */}
      <div className="sticky bottom-4 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg" className="shadow-lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
