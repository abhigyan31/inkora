# Backend plan

INKORA doesn't have a server yet. These are my notes for building one — the schema, the endpoints, and how I'd handle auth and file uploads.

The reason the frontend is organised the way it is: no page component touches `localStorage`. Everything goes through `src/utils/*`, so swapping in a real API means rewriting those files and nothing else.

---

## Why Postgres

I went back and forth on this. Most of what INKORA does is relationships — who liked what, who follows whom, which comment is a reply to which. That's exactly what SQL is for. With Mongo I'd end up maintaining all those joins by hand.

## Schema

```sql
create table users (
  id            uuid primary key default gen_random_uuid(),
  name          text        not null,
  username      citext      not null unique,       -- "@alexwrites"
  email         citext      not null unique,
  password_hash text        not null,              -- argon2id
  bio           text        not null default '',
  contact       text,
  dob           date,
  avatar_url    text,
  cover_url     text,
  created_at    timestamptz not null default now()
);

create table blogs (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid        not null references users(id) on delete cascade,
  title         text        not null,
  description   text        not null,
  category      text        not null,
  tags          text[]      not null default '{}',
  thumbnail_key text,                              -- object storage key
  pdf_key       text,
  read_time     text,
  published_at  timestamptz not null default now(),
  updated_at    timestamptz,
  deleted_at    timestamptz                        -- soft delete
);

create index on blogs (author_id);
create index on blogs (category);
create index on blogs using gin (to_tsvector('english', title || ' ' || description));

create table likes (
  user_id    uuid not null references users(id)  on delete cascade,
  blog_id    uuid not null references blogs(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blog_id)
);

create table bookmarks (
  user_id    uuid not null references users(id)  on delete cascade,
  blog_id    uuid not null references blogs(id)  on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, blog_id)
);

create table follows (
  follower_id uuid not null references users(id) on delete cascade,
  followee_id uuid not null references users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  blog_id    uuid not null references blogs(id)     on delete cascade,
  author_id  uuid not null references users(id)     on delete cascade,
  parent_id  uuid          references comments(id)  on delete cascade,
  body       text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index on comments (blog_id, created_at);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,  -- who receives it
  actor_id    uuid          references users(id) on delete set null,
  type        text not null check (type in ('like','comment','reply','follow')),
  blog_id     uuid          references blogs(id) on delete cascade,
  comment_id  uuid          references comments(id) on delete cascade,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index on notifications (user_id, created_at desc);

create table blog_views (
  blog_id    uuid not null references blogs(id) on delete cascade,
  viewer_id  uuid references users(id) on delete set null,
  viewed_on  date not null default current_date,
  primary key (blog_id, viewer_id, viewed_on)   -- one view per person per day
);

create table user_settings (
  user_id               uuid primary key references users(id) on delete cascade,
  profile_visibility    boolean not null default true,
  email_visibility      boolean not null default false,
  contact_visibility    boolean not null default false,
  push_notifications    boolean not null default true,
  email_notifications   boolean not null default true,
  comment_notifications boolean not null default true,
  follow_notifications  boolean not null default true,
  dark_mode             boolean not null default false,
  reduce_motion         boolean not null default false
);
```

**No stored counts.** No `likes_count` or `followers_count` columns — those come from `count(*)`, and I can cache them in Redis if it ever gets slow. Storing them means they drift the moment something gets deleted.

---

## API

REST, JSON, everything under `/api/v1`.

### Auth

| Method | Path | |
|---|---|---|
| `POST` | `/auth/signup` | `{ name, email, password }`, sets a session cookie |
| `POST` | `/auth/login` | `{ email, password }` |
| `POST` | `/auth/logout` | |
| `GET`  | `/auth/me` | current user, or 401 |
| `POST` | `/auth/password` | `{ currentPassword, newPassword }` |
| `POST` | `/auth/forgot` | sends a single-use token, expires in 30 min |

### Blogs

| Method | Path | |
|---|---|---|
| `GET` | `/blogs` | `?q=&category=&author=&sort=recent\|trending&cursor=&limit=` |
| `GET` | `/blogs/:id` | includes author, counts, `likedByMe`, `savedByMe` |
| `POST` | `/blogs` | author comes from the session, never the request body |
| `PATCH` | `/blogs/:id` | author only |
| `DELETE` | `/blogs/:id` | author only, soft delete |
| `POST` | `/blogs/:id/view` | fire and forget, rate limited |

### Social

| Method | Path |
|---|---|
| `PUT` / `DELETE` | `/blogs/:id/like` |
| `PUT` / `DELETE` | `/blogs/:id/bookmark` |
| `GET` | `/me/bookmarks` |
| `PUT` / `DELETE` | `/users/:username/follow` |
| `GET` | `/users/:username` |
| `GET` | `/users/:username/blogs` |
| `GET` / `POST` | `/blogs/:id/comments` |
| `DELETE` | `/comments/:id` |

### Notifications

| Method | Path |
|---|---|
| `GET` | `/notifications?cursor=` |
| `POST` | `/notifications/read` — `{ ids }` or `{ all: true }` |

Two things I want to get right here:

**Notifications get created on the server**, inside the same transaction as the like or comment that caused them, and addressed to the blog's author. The client-side version in `utils/social.js` is a stand-in so the feature works today — it's the first thing to delete.

**`PUT`/`DELETE` instead of a toggle endpoint.** If someone double-taps like on a bad connection, a toggle un-likes it. `PUT` is idempotent so it doesn't matter.

---

## Auth

- **Hashing:** argon2id, or bcrypt with cost 12+. The SHA-256 currently in `utils/session.js` is a placeholder and says so in the file.
- **Sessions:** opaque session ID in an `HttpOnly; Secure; SameSite=Lax` cookie. I looked at JWTs in localStorage and decided against it — any XSS can read it and you can't revoke it.
- **CSRF:** double-submit token, or `SameSite=Strict` on anything that writes.
- **Rate limits:** login 5/min/IP, signup 3/hour/IP, comments 10/min/user.
- **Validation:** zod on every request body. Never trust `author_id`, `likes` or `created_at` from the client.
- **Ownership checks on the server for every write.** Hiding the Edit button isn't access control.

---

## File uploads

Thumbnails and PDFs shouldn't go through the API server as multipart uploads.

1. Client calls `POST /uploads/sign` with `{ contentType, size }`
2. Server checks the type and size, returns a presigned S3/R2 PUT URL and the object key
3. Client uploads straight to storage
4. Client sends the key along with `POST /blogs`
5. Server confirms the object exists and is the right size before saving

Serve reads through a CDN, and run a nightly job to clean up keys nothing references.

`PdfReader.jsx` already accepts a URL, so once `pdf_key` becomes a CDN link that's basically a one-line change at the call site.

---

## Migrating the existing data

Whatever's in someone's browser right now is real data, so I'd offer a one-time import rather than just dropping it:

1. On the first login after the backend goes live, check for `inkora_blogs` in localStorage
2. Show something like "We found 3 blogs saved in this browser — upload them to your account?"
3. For each one: pull the file out of IndexedDB, upload it via the presigned flow, then `POST /blogs`
4. Import bookmarks, likes and follows, mapping the demo IDs to real ones
5. Flag the browser as migrated so it can't run twice

Don't delete the local copy until the server confirms everything landed.

---

## What the swap actually looks like

Right now, in `utils/blogStorage.js`:

```js
export function getBlogs() {
  const stored = localStorage.getItem(BLOG_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
```

Afterwards:

```js
export function useUserBlogs() {
  const { data } = useQuery({
    queryKey: ["blogs", "mine"],
    queryFn: () => api.get("/blogs?author=me"),
  });

  return data ?? [];
}
```

The pages call `useUserBlogs()` either way and don't change at all. Same for `useSaved()`, `useLikes()`, `useFollowing()`, `useComments()` and `useCurrentUser()` — they're all hooks with a fixed signature, which is the whole reason I routed the pages through them instead of letting them read storage directly.

I'd add TanStack Query at that point for caching and optimistic updates, and an `AbortController` on every request.

---

## Hosting

| | |
|---|---|
| Frontend | Vercel / Netlify / Cloudflare Pages, or Hostinger for now |
| API | Railway / Render / Fly.io, Node + Fastify |
| Database | Neon or Supabase — managed Postgres with branching for staging |
| Files | Cloudflare R2 or S3 behind a CDN |
| Error tracking | Sentry on both ends |

Before going live: SPA rewrite rule, HTTPS, CORS locked to the frontend origin, secrets in the host's env store, and a staging environment.

One more thing on my list — `pdfjs` is code-split now so it only downloads when someone opens a PDF, but the worker file is still 1.2MB. Worth looking at whether a lighter build of it exists.
