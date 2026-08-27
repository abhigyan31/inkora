# Backend

INKORA now has a real backend: PHP 8 + MySQL, sitting at `/api` on the same
domain as the React app.

I picked PHP because that's what Hostinger shared hosting runs. Node would have
meant a VPS or a second host, and the whole point was to keep this on one plan.

Same domain also means no CORS setup and the session cookie just works.

```
public_html/
├── index.html        ← the React build
├── assets/
├── uploads/          ← thumbnails and PDFs
└── api/
    ├── index.php     ← router
    ├── db.php        ← PDO connection
    ├── helpers.php   ← responses, sessions, validation
    ├── auth.php  blogs.php  social.php  comments.php
    ├── notifications.php  users.php  settings.php  uploads.php
    ├── schema.sql    ← run once
    └── seed.php      ← run once, then delete
```

---

## Setting it up

**1. Make the database** — hPanel → Databases → MySQL Databases. Hostinger
prefixes the names, so you get something like `u123456789_inkora`.

**2. Import the schema** — phpMyAdmin → your database → Import → `api/schema.sql`.

**3. Configure** — copy `api/config.example.php` to `api/config.php` and fill in
the database name, user and password. `config.php` is gitignored so the password
never reaches GitHub.

**4. Seed it** — open `https://yourdomain.com/api/seed.php` once. It creates a
few accounts and sample blogs so the site isn't empty. It refuses to run if
there are already users. **Delete the file afterwards.**

**5. Check it** — `https://yourdomain.com/api/health` should return
`{"ok":true,"db":"connected"}`.

---

## Schema

13 tables. The full DDL is in `api/schema.sql`; the decisions worth explaining:

**Ids are `CHAR(36)` uuids, generated in PHP.** Auto-increment integers would
leak how many users I have and let anyone walk the whole table by guessing
`/blog/1`, `/blog/2`, and so on.

**No stored counts.** There is no `likes_count` column. Every count comes from
`COUNT(*)` at read time. Denormalised counters drift the moment a delete or a
rollback happens, and then you have numbers nobody can explain.

**Likes, bookmarks and follows use composite primary keys** — `(user_id,
blog_id)`. A double-tap on a bad connection can't create two likes because the
database refuses it. I don't have to trust the frontend to be careful.

**`follows` has a CHECK stopping self-follows.** Otherwise anyone can inflate
their own follower count.

**Comments cascade to their replies** through a self-referencing foreign key on
`parent_id`.

**Blogs are soft-deleted** (`deleted_at`). A hard delete would take the comments
with it, and I'd rather keep the option of undoing it.

**`blog_views` is keyed `(blog_id, view_key, viewed_on)`** so refreshing your
own post all afternoon still counts as one view. `view_key` is the user id when
signed in, or a hash of IP + user agent when not.

**Tags are a join table**, not a JSON column, so "everything tagged react" is an
index lookup instead of a table scan.

I tested the constraints rather than assuming: duplicate likes, self-follows,
empty comments and invalid notification types are all rejected by the database,
and deleting a user removes their blogs, tags and likes with them.

---

## API

All under `/api`. JSON in, JSON out.

### Auth
| | |
|---|---|
| `POST /auth/signup` | `{ name, email, password }` |
| `POST /auth/login` | `{ email, password }` |
| `POST /auth/logout` | |
| `GET /auth/me` | current user or `null` |
| `PATCH /auth/profile` | any subset of profile fields |
| `POST /auth/password` | `{ currentPassword, newPassword }` |
| `DELETE /auth/account` | `{ password }` |

### Blogs
| | |
|---|---|
| `GET /blogs` | `?q= &category= &author= &following=1 &saved=1 &sort=trending` |
| `GET /blogs/:id` | |
| `POST /blogs` | author comes from the session |
| `PATCH /blogs/:id` | author only |
| `DELETE /blogs/:id` | author only |
| `POST /blogs/:id/view` | |

### Social
`PUT`/`DELETE` on `/blogs/:id/like`, `/blogs/:id/bookmark`,
`/users/:username/follow`, `/comments/:id/like`.
`GET` on `/me/bookmarks`, `/me/likes`, `/me/following`,
`/users/:username`, `/users/:username/blogs`.

### Comments
`GET`/`POST /blogs/:id/comments`, `DELETE /comments/:id`.

### Notifications
`GET /notifications`, `POST /notifications/read`, `DELETE /notifications/:id`,
`DELETE /notifications`.

### Settings & uploads
`GET`/`PATCH /settings`, `POST /uploads` (multipart).

**Why `PUT`/`DELETE` instead of one toggle endpoint:** if someone double-taps
like on a flaky connection, a toggle un-likes the post. `PUT` twice does the
same thing as `PUT` once.

---

## Security

- **Passwords** go through `password_hash()` (bcrypt) and `password_verify()`.
  Never stored, never logged, never returned.
- **Sessions** are a random token in an `HttpOnly; Secure; SameSite=Lax` cookie.
  Only the SHA-256 of the token is stored, so a database dump can't be used to
  log in as anyone. I checked in the browser: `document.cookie` is empty.
- **I skipped JWT in localStorage** on purpose. Any XSS can read it and you
  can't revoke it.
- **CSRF:** every write requires an `X-Inkora-Request: 1` header. A cross-site
  HTML form can't set a custom header, and a cross-origin fetch that tries gets
  stopped by the preflight. That covers the gap `SameSite=Lax` leaves.
- **SQL injection:** PDO prepared statements everywhere, with
  `ATTR_EMULATE_PREPARES => false` so real prepares go to MySQL. No query
  anywhere is built by string concatenation with user input.
- **Login attempts** are rate limited by email *and* by IP. Limiting only by
  email lets an attacker lock someone out; only by IP lets a botnet spread the
  guessing out.
- **Ownership is checked on the server** for every edit and delete. Hiding the
  button is not access control — I tested this by trying to edit another user's
  post through the API and getting a 403.
- **Uploads:** the real MIME type is read from the file contents with `finfo`,
  not from the `Content-Type` the browser claims. Filenames are always
  regenerated as uuids. `uploads/.htaccess` turns off the PHP engine in that
  folder, so even if a `.php` file somehow lands there, Apache serves it as text
  instead of running it.
- **Timing:** a login for an email that doesn't exist still runs a
  `password_verify` against a dummy hash, so response time can't be used to work
  out which emails are registered.

---

## How the frontend connects

Nothing in `src/pages` calls `fetch`. Everything goes through `src/utils`, which
is why swapping localStorage for the API didn't require rewriting the pages —
the hooks kept the same names and shapes.

`src/utils/apiStore.js` is a small cache underneath those hooks. It hands back
cached data straight away, de-duplicates concurrent requests for the same thing,
and refetches after a mutation. Without it every page would need its own loading
state and the same blog list would be fetched five times on one screen.

Likes and bookmarks update the UI before the request finishes and roll back if
it fails. On a slow phone connection, waiting 400ms for a bookmark icon to fill
in feels broken even when nothing is wrong.

---

## Still to do

- **Email** — password reset and notification emails need an SMTP service.
- **Google sign-in** — needs OAuth credentials and a verified domain.
- **Pagination** — `/blogs` takes `limit` and `offset` but the feed doesn't use
  them yet. Fine at this size, not fine at ten thousand posts.
- **Fulltext search** — there's a `FULLTEXT` index on the blogs table, but the
  search currently uses `LIKE`, because fulltext ignores words under four
  characters by default and people search for things like "ai".
- **Image resizing** — thumbnails are served at whatever size they were
  uploaded. Should generate a few sizes on upload.
- **Session cleanup** — expired rows in `sessions` and old rows in
  `login_attempts` should be cleared by a cron job rather than growing forever.
