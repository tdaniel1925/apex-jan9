/**
 * Copilot Widget Configuration
 * Settings for the embeddable chat widget
 */

export interface WidgetConfig {
  // Required
  agentId: string;

  // Optional customization
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
  greeting?: string;
  placeholder?: string;
  buttonText?: string;

  // Branding
  showBranding?: boolean;
  agentName?: string;
  agentAvatar?: string;

  // Behavior
  autoOpen?: boolean;
  autoOpenDelay?: number; // milliseconds
  collectEmail?: boolean;
  collectPhone?: boolean;
}

export const DEFAULT_WIDGET_CONFIG: Partial<WidgetConfig> = {
  primaryColor: '#2563eb', // Blue
  position: 'bottom-right',
  greeting: "Hi! I'm here to help you learn about our insurance solutions. What questions do you have?",
  placeholder: 'Type your message...',
  buttonText: 'Chat with us',
  showBranding: true,
  autoOpen: false,
  autoOpenDelay: 5000,
  collectEmail: true,
  collectPhone: false,
};

export interface WidgetMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WidgetSession {
  id: string;
  agentId: string;
  visitorId: string;
  contactId?: string;
  email?: string;
  phone?: string;
  messages: WidgetMessage[];
  startedAt: Date;
  lastActivityAt: Date;
}

/**
 * Generate embed code for an agent's widget
 */
export function generateEmbedCode(agentId: string, config?: Partial<WidgetConfig>): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theapexway.net';
  const configStr = config ? encodeURIComponent(JSON.stringify(config)) : '';

  return `<!-- Apex Copilot Widget -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['ApexCopilot']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s);fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  })(window,document,'script','apex','${baseUrl}/widget.js');
  apex('init', { agentId: '${agentId}'${configStr ? `, config: ${decodeURIComponent(configStr)}` : ''} });
</script>
<!-- End Apex Copilot Widget -->`;
}

/**
 * Generate visitor ID (persisted in localStorage)
 */
export function generateVisitorId(): string {
  return `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Rate limiting for widget messages
 */
export const WIDGET_RATE_LIMITS = {
  messagesPerMinute: 10,
  messagesPerHour: 60,
  maxMessageLength: 1000,
  maxSessionDuration: 60 * 60 * 1000, // 1 hour
};
