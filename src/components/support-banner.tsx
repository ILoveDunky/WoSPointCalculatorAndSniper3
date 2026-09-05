'use client';

import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';

export function SupportBanner({ onOpenPricing }: { onOpenPricing: () => void }) {
  const { profile } = useAuth();
  if (profile.tier !== 'free') return null;

  return (
    <button
      onClick={onOpenPricing}
      className="flex w-full items-center justify-center gap-2 border-b border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <Icons.snowflake className="h-4 w-4" />
      <span>The calculator is free. If it&apos;s useful, Supporter and Officer tiers add sync and history.</span>
      <span className="text-accent underline underline-offset-2">See what&apos;s in them</span>
    </button>
  );
}
