import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

const sizes = {
  sm: { width: 180, height: 60 },
  md: { width: 200, height: 67 },
  lg: { width: 280, height: 93 },
};

export function Logo({ href, className, size = 'md', variant = 'default' }: LogoProps) {
  const { width, height } = sizes[size];
  const logoSrc = variant === 'white' ? '/images/logo-w.png' : '/images/logo.png';

  const logoImage = (
    <Image
      src={logoSrc}
      alt="Apex Affinity Group"
      width={width}
      height={height}
      className={cn('object-contain w-full', className)}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="flex items-center w-full">
        {logoImage}
      </Link>
    );
  }

  return logoImage;
}
