'use client';

/**
 * Social Share Component
 * Allow agents to share their replicated site on social media
 * Following CodeBakers patterns from 04-frontend.md
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Share2, Facebook, Linkedin, Link, Check, Mail } from 'lucide-react';

// X/Twitter icon (not available in lucide by default)
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'default' | 'compact' | 'icons-only';
  className?: string;
}

export function SocialShare({
  url,
  title,
  description = '',
  variant = 'default',
  className = '',
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  // Compact dropdown version
  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            <Facebook className="h-4 w-4 mr-2 text-[#1877F2]" />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            <XIcon className="h-4 w-4 mr-2" />
            X (Twitter)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('linkedin')}>
            <Linkedin className="h-4 w-4 mr-2 text-[#0A66C2]" />
            LinkedIn
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')}>
            <Mail className="h-4 w-4 mr-2" />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyLink}>
            {copied ? (
              <Check className="h-4 w-4 mr-2 text-green-600" />
            ) : (
              <Link className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy Link'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Icons only version (for tight spaces)
  if (variant === 'icons-only') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare('facebook')}
          title="Share on Facebook"
        >
          <Facebook className="h-4 w-4 text-[#1877F2]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare('twitter')}
          title="Share on X"
        >
          <XIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleShare('linkedin')}
          title="Share on LinkedIn"
        >
          <Linkedin className="h-4 w-4 text-[#0A66C2]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyLink}
          title={copied ? 'Copied!' : 'Copy Link'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Link className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Default full version
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm text-muted-foreground mr-2">Share:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('facebook')}
        className="gap-2"
      >
        <Facebook className="h-4 w-4 text-[#1877F2]" />
        Facebook
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('twitter')}
        className="gap-2"
      >
        <XIcon className="h-4 w-4" />
        X
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('linkedin')}
        className="gap-2"
      >
        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
        LinkedIn
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleShare('email')}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Email
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyLink}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Link className="h-4 w-4" />
            Copy Link
          </>
        )}
      </Button>
    </div>
  );
}
