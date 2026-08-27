# INKORA

A blogging site where writers publish their work as a PDF and readers can follow them, save posts, like, and comment.

I built this as my internship project. It's a React + Vite frontend, and right now everything is stored in the browser — there's no server yet. I've kept all the data handling inside `src/utils` so that when I do add a backend, I only have to rewrite that folder and none of the pages.

**Live site:** _(adding the link once it's deployed)_

**Demo account:** `alex@inkora.app` / `inkora123`

---

## Screenshots

_TODO: add screenshots of the feed, a blog page and the profile._

---

## What it does

**Reading**
- Feed with For You / Following / Trending tabs
- Search by title, description, author, category or tag
- Category filters, and the search stays in the URL so you can share a result page
- A separate clean reading view at `/read/:id` with a progress bar at the top
- PDFs open in the page with page navigation and zoom

**Social stuff**
- Like, save, follow, comment, and reply to comments
- Saving a blog on the feed updates your profile straight away — no refresh needed, and it works across tabs too
- Public profile for every writer at `/u/:username`
- Share button uses the phone's native share sheet, falls back to copying the link

**Writing**
- Create page with a live preview and a checklist so you can see what's still missing
- Upload a thumbnail and a PDF, both validated for type and size
- Edit or delete your own posts (deleting also removes the files and comments)

**Account**
- Signup / login / logout, passwords are hashed before being stored
- `/create`, `/profile`, `/settings` and `/notifications` need you to be logged in — if you're not, it sends you to login and brings you back after
- Editable profile with a photo and a cover image

**Other**
- Notifications for likes, comments, replies and follows
- Settings for privacy, notifications, password and appearance
- Dark mode across the whole app, remembered after a reload
- Loading skeletons, empty states, error states, and a fallback for images that fail to load
- Works down to 375px, keyboard focus rings, ARIA labels, skip links

---

## Built with

- React 19
- Vite
- Tailwind CSS v4
- React Router v8
- pdf.js for the PDF viewer
- localStorage + IndexedDB for storage

---

## Running it

You'll need Node 18+.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run build` | builds into `dist/` |
| `npm run preview` | serves the built version locally |

The first time you open it, a demo account gets created so there's something to look at:

```
alex@inkora.app
inkora123
```

You can also just sign up normally.

---

## Folder structure

```
src/
├── App.jsx              routes
├── main.jsx
├── index.css            tailwind + dark mode + a11y styles
│
├── components/
│   ├── BlogPdf.jsx      loads the stored file, then the reader
│   ├── PdfReader.jsx    the actual pdf.js viewer
│   ├── RequireAuth.jsx  login check for protected routes
│   ├── SafeImage.jsx    image with loading + fallback handling
│   └── States.jsx       skeletons, empty state, error state, toast
│
├── pages/
│   ├── Landing/
│   ├── Auth/            login + signup
│   ├── Feed/
│   ├── Discover/
│   ├── Blog/            full blog page with comments
│   ├── BlogReader/      clean reading view
│   ├── Create/          create + edit
│   ├── Profile/
│   ├── PublicProfile/
│   ├── Settings/
│   ├── Notifications/
│   └── NotFound/
│
└── utils/
    ├── store.js         the storage layer everything else sits on
    ├── blogStorage.js   blogs
    ├── session.js       accounts + login
    ├── social.js        likes, saves, follows, comments, views
    ├── notifications.js
    ├── settings.js
    ├── fileStore.js     IndexedDB for thumbnails and PDFs
    ├── demoData.js      sample blogs
    ├── format.js
    └── useToast.js
```

### Routes

| Path | Page | Login needed |
|---|---|---|
| `/` | Landing | no |
| `/home` | Feed | no |
| `/discover` | Discover | no |
| `/blog/:id` | Blog | no |
| `/read/:id` | Reader | no |
| `/u/:username` | Writer profile | no |
| `/login`, `/signup` | Auth | no |
| `/create` | Create | yes |
| `/blog/:id/edit` | Edit | yes |
| `/profile` | Profile | yes |
| `/settings` | Settings | yes |
| `/notifications` | Notifications | yes |
| anything else | 404 | no |

---

## How the storage works

None of the pages touch `localStorage` directly — they all go through `src/utils`. That was on purpose, so the switch to a real API later is contained to one folder.

Small records go in localStorage:

| Key | What's in it |
|---|---|
| `inkora_blogs` | the blogs |
| `inkora_users`, `inkora_session` | accounts, who's logged in |
| `inkora-saved-blogs` | bookmarks |
| `inkora_likes`, `inkora_following` | likes and follows |
| `inkora_comments`, `inkora_comment_likes` | comments |
| `inkora_notifications` | notifications |
| `inkora_settings`, `inkora_views` | settings and view counts |

Thumbnails and PDFs go in **IndexedDB** instead, under `inkora_files`. The blog itself only stores a short reference like `inkora-file:2f9c…`.

I moved to IndexedDB after uploads kept failing. localStorage only gives you about 5MB, and a 5MB PDF turns into roughly 6.7MB once it's base64 encoded — so it blew the quota on the very first upload. IndexedDB stores the actual Blob, so there's no encoding overhead and a lot more room.

---

## Things I know aren't finished

Since this is frontend-only, it's worth being upfront about what that means:

- **Data doesn't leave your browser.** Two people opening the site won't see each other's posts. Clearing site data wipes everything.
- **The login isn't actually secure.** Passwords are salted and hashed with SHA-256 so they're not sitting there in plain text, but anything running in the browser can read the hashes. Proper auth has to happen server-side. Don't use a real password on it.
- **Notifications get written to your own device.** With a backend, the notification would go to the blog author instead. I did it this way so the feature actually works and can be tested.
- **Follower count shows 0** on your own profile, since there's no one else on your device to follow you.
- **Uploaded files stay local** — they're in IndexedDB, not on a CDN.

---

## Next steps

`BACKEND.md` has the database schema and API design I've planned out. Roughly in the order I'd do it:

1. Build the API and Postgres database, and swap out the internals of `src/utils`
2. Move authentication server-side
3. Put the thumbnails and PDFs in object storage
4. Generate notifications on the server, in the same transaction as the like/comment/follow
5. Proper full-text search
6. Image optimisation + CDN

---

## Deploying

It builds to a static site, so any host works. The one thing it needs is a rewrite rule sending unknown paths back to `index.html` — otherwise refreshing on `/blog/some-id` gives a 404 because the server goes looking for a file that isn't there.

There's an `.htaccess` in `public/` that handles this (plus gzip and caching), and Vite copies it into `dist/` automatically on every build.

`DEPLOY.md` has the full steps for Hostinger.
