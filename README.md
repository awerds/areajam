# AreaJam (`areajam.com`)

Regional, two-sided music matching PWA combining Craigslist-style metro boards, TikTok auto-playing video/audio reels, and Tinder swipe discovery:
- **Jam Side:** Find local drummers, guitarists, bassists, vocalists, keys, and songwriters to jam or form a band.
- **Gigs Side:** Discover open local venue bills or browse gig-ready bands with live clips and rates.
- **Browse Free, Sign In to Join:** Anyone can filter by players, watch clips, and browse without an account. Creating a profile, recording 30-second webcam intros or uploading clips (stored locally in IndexedDB), and messaging matches uses Google or Apple Auth.

## Local Development

```bash
npm install
npm run dev
```

Type-check and build production static output (`dist/`):

```bash
npm run typecheck && npm run build
```

## Enabling Live Google & Apple Sign-In (Firebase Auth)

1. Copy `.env.example` to `.env.local` (or inject `VITE_FIREBASE_*` secrets in GitHub Actions) and set:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
2. In **Firebase Console → Authentication → Sign-in method**, enable **Google** and **Apple**.
3. In **Firebase Console → Authentication → Settings → Authorized domains**, add `areajam.com`, `www.areajam.com`, and `localhost` (domain names only, no protocol or port).

*(Without `VITE_FIREBASE_*` keys configured, AreaJam cleanly runs an instant local Apple/Google preview sign-in so profile creation and webcam clip uploads can be tested immediately.)*

## Free Hosting via GitHub Pages + Namecheap (`areajam.com`)

1. The static production bundle (`dist/`, including `public/CNAME`) is published on the `gh-pages` branch for zero-cost GitHub Pages hosting.
2. Optional auto-deploy: move `docs/deploy-workflow.yml` to `.github/workflows/deploy.yml` via the GitHub web UI (or after running `gh auth refresh -s workflow`) to rebuild and deploy automatically on every push to `main`.
3. In **GitHub → Repo Settings → Pages**, verify **Source** is set to **Deploy from a branch** (`gh-pages` / `/ (root)`) and **Enforce HTTPS** is enabled.
