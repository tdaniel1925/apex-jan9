// SPEC: OPTIVE REDESIGN > Marketing Layout Wrapper
// PURPOSE: Shared layout for corporate and replicated pages

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  );
}
