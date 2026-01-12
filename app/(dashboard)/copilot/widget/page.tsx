/**
 * Copilot Widget Settings Page
 * Allows agents to customize and get their embed code
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth/auth-context';
import { Copy, Check, Code, Palette, MessageSquare, ExternalLink } from 'lucide-react';

interface WidgetConfig {
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  greeting: string;
  placeholder: string;
  buttonText: string;
  showBranding: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
  collectEmail: boolean;
}

const defaultConfig: WidgetConfig = {
  primaryColor: '#2563eb',
  position: 'bottom-right',
  greeting: "Hi! I'm here to help you learn about our insurance solutions. What questions do you have?",
  placeholder: 'Type your message...',
  buttonText: 'Chat with us',
  showBranding: true,
  autoOpen: false,
  autoOpenDelay: 5000,
  collectEmail: true,
};

export default function CopilotWidgetPage() {
  const { agent } = useAuth();
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [copied, setCopied] = useState(false);
  const [subscription, setSubscription] = useState<{ status: string; tier: string } | null>(null);

  useEffect(() => {
    // Load subscription status
    const loadSubscription = async () => {
      try {
        const response = await fetch('/api/copilot/subscription');
        if (response.ok) {
          const data = await response.json();
          if (data.subscription) {
            setSubscription({
              status: data.subscription.status,
              tier: data.subscription.tier,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load subscription:', error);
      }
    };

    loadSubscription();
  }, []);

  const generateEmbedCode = () => {
    if (!agent?.id) return '';

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const configStr =
      JSON.stringify(config, null, 2) !== JSON.stringify(defaultConfig, null, 2)
        ? `, config: ${JSON.stringify(config)}`
        : '';

    return `<!-- Apex Copilot Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ApexCopilot']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  })(window,document,'script','apex','${baseUrl}/widget.js');
  apex('init', { agentId: '${agent.id}'${configStr} });
</script>
<!-- End Apex Copilot Widget -->`;
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isActive =
    subscription && (subscription.status === 'active' || subscription.status === 'trialing');

  if (!isActive) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Copilot Widget</h1>
          <p className="text-muted-foreground">
            Add an AI-powered chat widget to your website
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Subscription Required</h3>
            <p className="text-muted-foreground mb-4">
              Start a free trial or subscribe to use the AI Copilot widget on your website.
            </p>
            <div className="flex justify-center gap-4">
              <Button asChild>
                <a href="/copilot/subscribe">Start Free Trial</a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/copilot">Learn More</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">AI Copilot Widget</h1>
        <p className="text-muted-foreground">
          Customize and embed the AI chat widget on your website
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Widget Settings
            </CardTitle>
            <CardDescription>Customize how the widget appears and behaves</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="appearance">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="behavior">Behavior</TabsTrigger>
              </TabsList>

              <TabsContent value="appearance" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <select
                    id="position"
                    value={config.position}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        position: e.target.value as 'bottom-right' | 'bottom-left',
                      })
                    }
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greeting">Greeting Message</Label>
                  <Textarea
                    id="greeting"
                    value={config.greeting}
                    onChange={(e) => setConfig({ ...config, greeting: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeholder">Input Placeholder</Label>
                  <Input
                    id="placeholder"
                    value={config.placeholder}
                    onChange={(e) => setConfig({ ...config, placeholder: e.target.value })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showBranding">Show Apex Branding</Label>
                  <Switch
                    id="showBranding"
                    checked={config.showBranding}
                    onCheckedChange={(checked) => setConfig({ ...config, showBranding: checked })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoOpen">Auto-Open Widget</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically open after a delay
                    </p>
                  </div>
                  <Switch
                    id="autoOpen"
                    checked={config.autoOpen}
                    onCheckedChange={(checked) => setConfig({ ...config, autoOpen: checked })}
                  />
                </div>

                {config.autoOpen && (
                  <div className="space-y-2">
                    <Label htmlFor="autoOpenDelay">Auto-Open Delay (seconds)</Label>
                    <Input
                      id="autoOpenDelay"
                      type="number"
                      min={1}
                      max={60}
                      value={config.autoOpenDelay / 1000}
                      onChange={(e) =>
                        setConfig({ ...config, autoOpenDelay: parseInt(e.target.value) * 1000 })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="collectEmail">Collect Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Ask visitors for their email address
                    </p>
                  </div>
                  <Switch
                    id="collectEmail"
                    checked={config.collectEmail}
                    onCheckedChange={(checked) => setConfig({ ...config, collectEmail: checked })}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Embed Code Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Embed Code
            </CardTitle>
            <CardDescription>
              Copy this code and paste it before the closing &lt;/body&gt; tag on your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto max-h-[300px]">
                <code>{generateEmbedCode()}</code>
              </pre>
              <Button
                size="sm"
                className="absolute top-2 right-2"
                onClick={copyToClipboard}
                variant={copied ? 'default' : 'secondary'}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Installation Instructions</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Copy the embed code above</li>
                <li>Open your website&apos;s HTML</li>
                <li>
                  Paste the code just before the closing <code>&lt;/body&gt;</code> tag
                </li>
                <li>Save and publish your changes</li>
              </ol>
            </div>

            <div className="mt-4">
              <Button variant="outline" className="w-full" asChild>
                <a
                  href={`/api/copilot/widget/preview?agentId=${agent?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview Widget
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widget Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your widget will look to visitors</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="relative bg-slate-100 rounded-lg p-8 min-h-[400px] flex items-end"
            style={{ justifyContent: config.position === 'bottom-right' ? 'flex-end' : 'flex-start' }}
          >
            {/* Simulated website content */}
            <div className="absolute inset-4 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400">
              Your Website Content
            </div>

            {/* Widget Preview */}
            <div className="relative z-10">
              {/* Chat Window */}
              <div className="w-[320px] bg-white rounded-xl shadow-xl overflow-hidden mb-4">
                <div
                  className="p-4 text-white flex items-center gap-3"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold">
                    {agent?.first_name?.[0]}
                    {agent?.last_name?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {agent?.first_name} {agent?.last_name}
                    </div>
                    <div className="text-xs opacity-90">Usually replies instantly</div>
                  </div>
                </div>
                <div className="p-4 space-y-3 max-h-[200px] overflow-y-auto">
                  <div className="bg-slate-100 rounded-xl rounded-bl p-3 text-sm max-w-[85%]">
                    {config.greeting}
                  </div>
                </div>
                <div className="p-3 border-t flex gap-2">
                  <input
                    type="text"
                    placeholder={config.placeholder}
                    className="flex-1 px-3 py-2 border rounded-full text-sm"
                    disabled
                  />
                  <button
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: config.primaryColor }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                </div>
                {config.showBranding && (
                  <div className="py-2 text-center text-xs text-slate-400 border-t">
                    Powered by Apex
                  </div>
                )}
              </div>

              {/* Chat Button */}
              <button
                className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
                style={{ backgroundColor: config.primaryColor }}
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />
                </svg>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
