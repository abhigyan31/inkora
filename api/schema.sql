-- =========================================================
--  INKORA - MySQL schema
--
--  Run this once in phpMyAdmin (hPanel > Databases >
--  phpMyAdmin > pick your database > Import / SQL tab).
--
--  Don't run CREATE DATABASE - Hostinger makes the database
--  for you and gives it a prefixed name like u123456789_inkora.
-- =========================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;


-- ---------------------------------------------------------
--  users
--
--  Ids are CHAR(36) uuids generated in PHP. Auto-increment
--  ints would leak how many users there are and let anyone
--  walk the list by guessing.
--
--  utf8mb4_0900_ai_ci is case-insensitive, so "Alex@x.com"
--  and "alex@x.com" collide on the unique index, which is
--  what we want for emails and usernames.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id             CHAR(36)      NOT NULL,
  name           VARCHAR(80)   NOT NULL,
  username       VARCHAR(60)   NOT NULL,           -- stored with the @
  email          VARCHAR(190)  NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,           -- password_hash(), bcrypt
  bio            TEXT          NULL,
  contact        VARCHAR(40)   NULL,
  dob            DATE          NULL,
  avatar_url     VARCHAR(255)  NULL,
  cover_url      VARCHAR(255)  NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NULL ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  blogs
--
--  thumbnail_path / pdf_path are relative paths under
--  /uploads, not absolute URLs, so moving domains doesn't
--  break every post.
--
--  deleted_at is a soft delete - a hard delete would take
--  the comments with it via the cascade.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS blogs (
  id              CHAR(36)      NOT NULL,
  author_id       CHAR(36)      NOT NULL,
  title           VARCHAR(150)  NOT NULL,
  description     VARCHAR(400)  NOT NULL,
  category        VARCHAR(40)   NOT NULL,
  thumbnail_path  VARCHAR(255)  NULL,
  pdf_path        VARCHAR(255)  NULL,
  pdf_name        VARCHAR(255)  NULL,
  pdf_size        INT UNSIGNED  NULL,
  read_time       VARCHAR(20)   NULL,
  published_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NULL,
  deleted_at      DATETIME      NULL,

  PRIMARY KEY (id),
  KEY idx_blogs_author (author_id),
  KEY idx_blogs_category (category),
  KEY idx_blogs_published (published_at DESC),
  KEY idx_blogs_live (deleted_at, published_at DESC),

  CONSTRAINT fk_blogs_author
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,

  FULLTEXT KEY ft_blogs_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  blog_tags
--
--  A join table rather than a JSON column, so "find every
--  post tagged react" is an index lookup instead of a scan.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS blog_tags (
  blog_id  CHAR(36)     NOT NULL,
  tag      VARCHAR(40)  NOT NULL,

  PRIMARY KEY (blog_id, tag),
  KEY idx_blog_tags_tag (tag),

  CONSTRAINT fk_blog_tags_blog
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  likes / bookmarks
--
--  Composite primary key means one row per user per blog.
--  A double-tap can't create two likes - the database
--  refuses it, so I don't have to trust the frontend.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS likes (
  user_id     CHAR(36)  NOT NULL,
  blog_id     CHAR(36)  NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, blog_id),
  KEY idx_likes_blog (blog_id),

  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_blog FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS bookmarks (
  user_id     CHAR(36)  NOT NULL,
  blog_id     CHAR(36)  NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, blog_id),
  KEY idx_bookmarks_blog (blog_id),
  KEY idx_bookmarks_user_recent (user_id, created_at DESC),

  CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_bookmarks_blog FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  follows
--
--  The CHECK stops anyone following themselves, which
--  otherwise inflates their own follower count.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS follows (
  follower_id  CHAR(36)  NOT NULL,
  followee_id  CHAR(36)  NOT NULL,
  created_at   DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (follower_id, followee_id),
  KEY idx_follows_followee (followee_id),

  CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_follows_followee FOREIGN KEY (followee_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_follows_not_self CHECK (follower_id <> followee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  comments
--
--  parent_id points at another comment for replies.
--  ON DELETE CASCADE on that self-reference means deleting
--  a comment takes its replies with it.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS comments (
  id          CHAR(36)  NOT NULL,
  blog_id     CHAR(36)  NOT NULL,
  author_id   CHAR(36)  NOT NULL,
  parent_id   CHAR(36)  NULL,
  body        TEXT      NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at  DATETIME  NULL,

  PRIMARY KEY (id),
  KEY idx_comments_blog (blog_id, created_at),
  KEY idx_comments_author (author_id),
  KEY idx_comments_parent (parent_id),

  CONSTRAINT fk_comments_blog   FOREIGN KEY (blog_id)   REFERENCES blogs(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT chk_comments_body CHECK (CHAR_LENGTH(body) BETWEEN 1 AND 2000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE IF NOT EXISTS comment_likes (
  user_id     CHAR(36)  NOT NULL,
  comment_id  CHAR(36)  NOT NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id, comment_id),
  KEY idx_comment_likes_comment (comment_id),

  CONSTRAINT fk_comment_likes_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_comment_likes_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  notifications
--
--  user_id is who receives it, actor_id is who caused it.
--  actor is SET NULL rather than CASCADE so a deleted
--  account doesn't wipe everyone else's history.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id          CHAR(36)     NOT NULL,
  user_id     CHAR(36)     NOT NULL,
  actor_id    CHAR(36)     NULL,
  type        VARCHAR(20)  NOT NULL,
  blog_id     CHAR(36)     NULL,
  comment_id  CHAR(36)     NULL,
  read_at     DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_notifications_inbox (user_id, created_at DESC),
  KEY idx_notifications_unread (user_id, read_at),

  CONSTRAINT fk_notifications_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_actor   FOREIGN KEY (actor_id)   REFERENCES users(id)    ON DELETE SET NULL,
  CONSTRAINT fk_notifications_blog    FOREIGN KEY (blog_id)    REFERENCES blogs(id)    ON DELETE CASCADE,
  CONSTRAINT fk_notifications_comment FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT chk_notifications_type
    CHECK (type IN ('like','comment','reply','follow'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  blog_views
--
--  view_key is the user id when signed in, otherwise a
--  hash of ip + user agent. Combined with viewed_on in the
--  primary key that gives one view per person per day, so
--  refreshing your own post doesn't farm the counter.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS blog_views (
  blog_id    CHAR(36)  NOT NULL,
  view_key   CHAR(64)  NOT NULL,
  viewed_on  DATE      NOT NULL,

  PRIMARY KEY (blog_id, view_key, viewed_on),
  KEY idx_blog_views_blog (blog_id),

  CONSTRAINT fk_blog_views_blog
    FOREIGN KEY (blog_id) REFERENCES blogs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  user_settings
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_settings (
  user_id                CHAR(36)  NOT NULL,
  profile_visibility     TINYINT(1) NOT NULL DEFAULT 1,
  email_visibility       TINYINT(1) NOT NULL DEFAULT 0,
  contact_visibility     TINYINT(1) NOT NULL DEFAULT 0,
  push_notifications     TINYINT(1) NOT NULL DEFAULT 1,
  email_notifications    TINYINT(1) NOT NULL DEFAULT 1,
  comment_notifications  TINYINT(1) NOT NULL DEFAULT 1,
  follow_notifications   TINYINT(1) NOT NULL DEFAULT 1,
  dark_mode              TINYINT(1) NOT NULL DEFAULT 0,
  reduce_motion          TINYINT(1) NOT NULL DEFAULT 0,

  PRIMARY KEY (user_id),

  CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  sessions
--
--  PHP's own session files work fine, but keeping sessions
--  in the database means "log out everywhere" and expiry
--  cleanup are just SQL.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
  id          CHAR(64)  NOT NULL,          -- sha256 of the cookie token
  user_id     CHAR(36)  NOT NULL,
  user_agent  VARCHAR(255) NULL,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME  NOT NULL,

  PRIMARY KEY (id),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expiry (expires_at),

  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


-- ---------------------------------------------------------
--  login_attempts
--
--  Rate limiting. Without this someone can sit there
--  guessing passwords as fast as the server will answer.
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier  VARCHAR(190) NOT NULL,       -- email or ip
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_login_attempts (identifier, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


SET FOREIGN_KEY_CHECKS = 1;
