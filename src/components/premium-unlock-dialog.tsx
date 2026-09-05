'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { useAuth } from '@/context/auth-context';

/**
 * Set up two Ko-fi Shop items (or one with variants) and paste each link
 * here. Both are one-time purchases, not subscriptions.
 */
const SUPPORTER_URL = 'https://ko-fi.com/s/afddc9ef35';
const OFFICER_URL = 'https://ko-fi.com/s/d0a3a0ce5a';
const KOFI_PROFILE_URL = 'https://ko-fi.com/dunkywunky';

export function PremiumUnlockDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { cloudEnabled, isAnonymous, signInWithGoogle, redeemCode } = useAuth();
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRedeem = async () => {
    setSubmitting(true);
    setStatus(null);
    const result = await redeemCode(code);
    setStatus(result);
    setSubmitting(false);
    if (result.ok) setCode('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">The calculator stays free. These add extras.</DialogTitle>
          <DialogDescription>
            Every event, every day, full sniping results — none of that is behind a paywall. These two are for people who want their data to follow them, or want more out of tracking their own progress.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-4 py-2">
          <div className="rounded border border-border p-4 space-y-3">
            <p className="font-display text-lg">Supporter</p>
            <p className="text-2xl font-display tabular">$4.99</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>Your data syncs across your phone and computer</li>
              <li>No limit on custom events</li>
              <li>Save as many snapshots as you want, not just one</li>
              <li>No banner asking for support</li>
            </ul>
            <Button asChild className="w-full" variant="secondary">
              <a href={SUPPORTER_URL} target="_blank" rel="noopener noreferrer">Get Supporter</a>
            </Button>
          </div>

          <div className="rounded border border-accent/40 p-4 space-y-3">
            <p className="font-display text-lg">Officer</p>
            <p className="text-2xl font-display tabular">$7.99</p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li>Everything in Supporter</li>
              <li>A chart of your point totals over time</li>
              <li>Export a result card to post in your alliance Discord</li>
            </ul>
            <Button asChild className="w-full">
              <a href={OFFICER_URL} target="_blank" rel="noopener noreferrer">Get Officer</a>
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <Label htmlFor="redeem-code">Already bought one? Enter your code</Label>
          <div className="flex gap-2">
            <Input
              id="redeem-code"
              placeholder="e.g. FROST-1234-ABCD"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button onClick={handleRedeem} disabled={submitting || !code || !cloudEnabled}>
              Redeem
            </Button>
          </div>
          {status && <p className={`text-sm ${status.ok ? 'text-primary' : 'text-destructive'}`}>{status.message}</p>}
          {!cloudEnabled && (
            <p className="text-xs text-muted-foreground">Cloud sync isn&apos;t set up on this deployment, so codes can&apos;t be checked here yet.</p>
          )}
        </div>

        {isAnonymous && cloudEnabled && (
          <div className="rounded bg-secondary p-3 text-sm">
            <p className="mb-2">Sign in so whichever tier you redeem follows you to other devices.</p>
            <Button variant="outline" size="sm" onClick={signInWithGoogle} className="gap-1.5">
              <Icons.logIn className="h-4 w-4" /> Sign in with Google
            </Button>
          </div>
        )}

        <DialogFooter className="flex-col items-start gap-2 text-xs text-muted-foreground sm:items-start">
          <p>One-time payment. Not a subscription, nothing recurring.</p>
          <a href={KOFI_PROFILE_URL} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">
            Just want to leave a tip instead?
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
