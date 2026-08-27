# Deployment notes

Notes to myself so I don't have to work this out again next time.

Two separate things:

- **GitHub** gets the source code
- **Hostinger** gets whatever's inside `dist/`

`node_modules` and `src` never go to Hostinger. `dist` never goes to GitHub — `.gitignore` already handles that.

---

## GitHub

Make an empty repo on GitHub first. Don't tick "Add a README", it clashes with the one already here.

```bash
git remote add origin https://github.com/YOUR-USERNAME/inkora.git
```

```bash
git push -u origin main
```

If starting from scratch:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit"
```

```bash
git branch -M main
```

Check the repo page afterwards — should show `src/`, `public/`, the markdown files and `package.json`, and definitely **not** `node_modules/` or `dist/`. If either shows up:

```bash
git rm -r --cached node_modules dist
```

then commit again.

Normal workflow after that:

```bash
git add .
```

```bash
git commit -m "what changed"
```

```bash
git push
```

**To do:** add the live URL to the README and the repo's About box, add screenshots, add topics (`react`, `vite`, `tailwindcss`).

---

## Hostinger

### 1. Build

```bash
npm run build
```

Everything goes into `dist/` — `index.html`, `assets/`, and `.htaccess`.

### 2. Upload

hPanel → Files → File Manager → open `public_html`.

Delete whatever placeholder file Hostinger left in there (`index.html` or `default.php`).

Upload **the contents of `dist/`**, not the folder itself. `public_html/index.html` needs to exist. If it ends up as `public_html/dist/index.html` the site won't load.

Zipping `dist` and using the Extract option in File Manager is much quicker than uploading files one by one. Delete the zip after.

### 3. Check the `.htaccess` is actually there

This is the one that catches me out, because File Manager hides dotfiles by default.

Settings → Show hidden files, then confirm `.htaccess` is sitting in `public_html` next to `index.html`.

**Symptom if it's missing:** home page loads fine, but going to `yourdomain.com/discover` directly, or hitting refresh on a blog page, gives a 404.

### 4. SSL

hPanel → Security → SSL → install the free certificate and wait for it to activate.

The `.htaccess` redirects http → https. If that's on before the certificate is ready you get a redirect loop, so either do SSL first or comment out those three lines until it's live.

### 5. Test properly

Not just the home page:

- [ ] `/` loads
- [ ] `/home` shows the feed
- [ ] open a blog, then **press F5** — should still work
- [ ] type `/discover` straight into the address bar
- [ ] a blog with a PDF opens and renders
- [ ] `/random-nonsense` shows my 404 page, not Apache's
- [ ] login with `alex@inkora.app` / `inkora123`
- [ ] save a blog, open profile, check it's there
- [ ] open it on a phone

---

## Redeploying

```bash
npm run build
```

Re-upload `dist/` over what's there. Old hashed asset files can be deleted. `index.html` is set to never cache, so people get the new build on their next refresh.

---

## When it breaks

**Blank white page** — check the console. If assets are 404ing, I've probably uploaded the `dist` folder instead of its contents.

**404 on refresh** — `.htaccess` missing, or `mod_rewrite` is off. Turn on hidden files in File Manager and look.

**PDF viewer doesn't start** — check the console for a MIME type error on the `.mjs` worker file. Section 5 of the `.htaccess` covers it, so this only happens if the file didn't upload.

**No styles** — CSS didn't upload, or `assets/` is nested one level too deep.

**Changes not showing** — Ctrl+Shift+R. If it keeps happening, the caching rules in `.htaccess` aren't being applied.

---

## Note for anyone reviewing this

The deployed site keeps everything in the visitor's own browser. It's frontend-only at this stage, so two people opening the site won't share blogs, accounts or comments, and clearing site data resets it.

That's the current stage rather than a bug — `BACKEND.md` has the schema, API design and migration plan for the server phase.
