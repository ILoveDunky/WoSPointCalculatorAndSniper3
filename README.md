# Coldsnap

Event points & last-minute sniping calculator for Whiteout Survival. Rebuilt from an earlier prototype with:

- A corrected **Smart Sniping** solver \u2014 finds the cheapest way to close a point gap using only resources you actually have on hand (a bounded knapsack, not a guess).
- Optional cloud accounts (Firebase Auth + Firestore) so a Pro unlock and custom events follow you across devices.
- A one-time-purchase Pro unlock via redemption code, plus a visible donation banner.
- Same GitHub Pages deploy path as before (static export to `docs/`).

Everything works with **zero setup** as a local-only tool (localStorage, no accounts, sniping still fully functional). Firebase is only needed if you want accounts / cross-device sync / the Pro unlock to be real instead of a UI that always shows "not configured."

## 1. Run it locally

```bash
npm install
npm run dev
```

Visit `http://localhost:9002`.

## 2. (Optional) Set up Firebase \u2014 free Spark plan, no billing required

1. Go to [console.firebase.google.com](https://console.firebase.google.com) \u2192 **Add project** (free).
2. **Build \u2192 Authentication \u2192 Get started.** Enable the **Anonymous** provider and the **Google** provider.
3. **Build \u2192 Firestore Database \u2192 Create database.** Start in production mode (the rules file below handles security).
4. In Firestore, deploy the included `firestore.rules` file: either paste its contents into the Rules tab in the console, or if you have the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # point it at this repo, use the existing firestore.rules
   firebase deploy --only firestore:rules
   ```
5. **Project settings \u2192 General \u2192 Your apps \u2192 Add app \u2192 Web.** Copy the config values into `.env.local` (copy `.env.example` first). These are public client identifiers, not secrets \u2014 real protection comes from the rules file, not from hiding these.
6. If deploying via GitHub Actions/Pages, add the same values as repo secrets and pass them as env vars in your build step.

Without this step, the app still works exactly as before \u2014 sign-in buttons and the Pro unlock dialog will just say cloud sync isn't configured.

## 3. Selling Pro access (one-time unlock, no Stripe/Cloud Functions needed)

The Pro unlock is a **redemption code** system, not live payment processing \u2014 this keeps it entirely on Firebase's free plan.

1. Create a product on **Gumroad** or **Ko-fi Shop** (\u201cColdsnap Pro\u201d, one-time price). Both platforms can auto-generate a unique code per sale and email it to the buyer \u2014 use that as your code, or just generate your own (e.g. `FROST-7F2K-91XQ`).
2. In the Firebase console, go to **Firestore \u2192 Start collection \u2014 `codes`**. Add one document per code, with the document ID set to the code itself, and fields:
   ```json
   { "used": false }
   ```
3. When a buyer enters their code in the app, `redeemCode()` runs a transaction that flips `used` to `true`, records who redeemed it, and sets `premium: true` on their profile. A code can only ever be redeemed once.
4. Update `PURCHASE_URL` in `src/components/premium-unlock-dialog.tsx` to your real product link.

**Honest limitation:** because this avoids Cloud Functions entirely (which require enabling Firebase's paid Blaze plan, even though usage would cost $0 at small scale), the security rules can't *cryptographically* bind "check a code is valid" to "mark it used" the way a server-side function could. In practice this means: if someone obtained a real, still-unused code string without buying it (e.g. a leak) and wrote directly to the database bypassing the app, they could unlock Pro without your app's redemption step also firing. This isn't exploitable by guessing \u2014 codes aren't listable and unfound codes can't be brute-forced if you use long random strings \u2014 but it's not as airtight as a paid Cloud Function/Stripe webhook setup would be. If Coldsnap starts generating real revenue, that's the natural next upgrade (see `firestore.rules` comments for exactly where the gap is).

## 4. Donations

Update `SUPPORT_URL` in `src/components/support-banner.tsx` with your real Ko-fi/Buy Me a Coffee link. It's a plain link, no SDK, so it costs nothing to run.

## 5. Deploying to GitHub Pages

This already builds as a static export targeting `docs/`, matching the previous setup:

```bash
npm run build   # runs `next build`, then the postbuild script touches docs/.nojekyll
git add docs && git commit -m "Build" && git push
```

Then in the repo's **Settings \u2192 Pages**, set the source to the `docs/` folder on your default branch.

**The `.nojekyll` file matters.** GitHub Pages runs Jekyll by default, which silently ignores any folder starting with an underscore \u2014 including Next.js's `_next` folder where all your JS/CSS lives. Without `.nojekyll`, every asset 404s and the page hangs on the loading screen forever. The `postbuild` script in `package.json` recreates this file on every build so it can't get lost again.

## What changed from the original prototype

- **Sniping solver rewritten.** The original used a simple greedy pass, which can pick a needlessly expensive combination when a smarter mix of on-hand items would close the gap for less. This version solves it as an exact bounded knapsack (binary-split 0/1 DP) for realistic gap sizes, with a greedy fallback only for unusually large targets.
- **Removed the achievement/streak gamification** in favor of the actual monetization hooks that were requested (Pro tier + cloud sync).
- **Rebranded** (name, palette, typography) away from the placeholder "Frosty Strategist" starter theme.
