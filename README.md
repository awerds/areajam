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

## Google & Apple Sign-In (Firebase Auth)

AreaJam is wired to Firebase project **`areajam-c3947`** by default (`src/lib/firebaseConfig.ts`), with `areajam.com`, `www.areajam.com`, and `localhost` listed in Authorized domains:
- **Google Sign-In:** Live now (`Authentication → Sign-in method → Google` enabled).
- **Apple Sign-In on Web:** Enabled in Firebase; to activate on the web, add your Apple Developer **Services ID**, **Apple Team ID**, **Key ID**, and **Private Key** under **Firebase Console → Authentication → Sign-in method → Apple**, and register return URL `https://areajam-c3947.firebaseapp.com/__/auth/handler` in Apple Developer Console.

You can override the default Firebase project anytime using the optional `VITE_FIREBASE_*` keys in `.env.example`.

## Free Hosting via GitHub Pages + Namecheap (`areajam.com`)

1. The static production bundle (`dist/`, including `public/CNAME`) is published on the `gh-pages` branch for zero-cost GitHub Pages hosting.
2. Optional auto-deploy: move `docs/deploy-workflow.yml` to `.github/workflows/deploy.yml` via the GitHub web UI (or after running `gh auth refresh -s workflow`) to rebuild and deploy automatically on every push to `main`.
3. In **GitHub → Repo Settings → Pages**, verify **Source** is set to **Deploy from a branch** (`gh-pages` / `/ (root)`) and **Enforce HTTPS** is enabled.
