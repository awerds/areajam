# AreaJam (`areajam.com`)

Regional, two-sided music matching PWA:
- **Jam Side:** Swipe locally to find musicians to jam with or form a band.
- **Gigs Side:** Swipe locally to pitch open venue slots or book gig-ready bands.

Built to host free on **GitHub Pages** and install cleanly to iPhone Home Screens as a PWA before wrapping in Capacitor or native Swift/React Native later.

## Local Development

```bash
npm install
npm run dev
```

Type-check and build production static output (`dist/`):

```bash
npm run typecheck && npm run build
```

## Free Hosting via GitHub Pages + Namecheap (`areajam.com`)

1. The static production bundle (`dist/`, including `public/CNAME`) is published on the `gh-pages` branch for zero-cost GitHub Pages hosting.
2. Optional auto-deploy: move `docs/deploy-workflow.yml` to `.github/workflows/deploy.yml` via the GitHub web UI (or after running `gh auth refresh -s workflow`) to rebuild and deploy automatically on every push to `main`.
3. In **GitHub → Repo Settings → Pages**, verify **Source** is set to **Deploy from a branch** (`gh-pages` / `/ (root)`) and check **Enforce HTTPS** once DNS finishes propagating.
4. In **Namecheap → Domain List → Manage → Advanced DNS**, set:
   - `A` record `@` → `185.199.108.153`
   - `A` record `@` → `185.199.109.153`
   - `A` record `@` → `185.199.110.153`
   - `A` record `@` → `185.199.111.153`
   - `CNAME` record `www` → `awerds.github.io.`

## Next Stage (Live Backend & Native iPhone App)

- **Backend:** Swap `src/lib/storage.ts` from `localStorage` to a free-tier **Supabase** or **Firebase** adapter for shared regional boards, auth, and realtime chat.
- **iOS App:** Wrap `dist/` with **Capacitor** (`@capacitor/ios`) once local traction is ready for the App Store.
