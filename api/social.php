<?php
/* =========================================================
   INKORA - likes, bookmarks, follows

   PUT adds, DELETE removes. Deliberately not a single
   toggle endpoint: if someone double-taps like on a bad
   connection, a toggle un-likes the post. PUT twice is
   the same as PUT once.
========================================================= */

function route_like(string $blog_id, bool $on): void
{
    $user = require_login();

    $blog = db_one(
        'SELECT b.id, b.title, b.author_id
           FROM blogs b
          WHERE b.id = ? AND b.deleted_at IS NULL',
        [$blog_id]
    );

    if (!$blog) {
        json_error('Blog not found.', 404);
    }

    if ($on) {
        $added = db_run(
            'INSERT IGNORE INTO likes (user_id, blog_id) VALUES (?, ?)',
            [$user['id'], $blog_id]
        );

        /* Only notify on a genuinely new like, and never for
           liking your own post. */
        if ($added > 0 && $blog['author_id'] !== $user['id']) {
            notify($blog['author_id'], $user['id'], 'like', $blog_id, null);
        }
    } else {
        db_run(
            'DELETE FROM likes WHERE user_id = ? AND blog_id = ?',
            [$user['id'], $blog_id]
        );
    }

    json_response([
        'liked' => $on,
        'likes' => (int) db_value('SELECT COUNT(*) FROM likes WHERE blog_id = ?', [$blog_id]),
    ]);
}


function route_bookmark(string $blog_id, bool $on): void
{
    $user = require_login();

    $exists = db_value(
        'SELECT 1 FROM blogs WHERE id = ? AND deleted_at IS NULL',
        [$blog_id]
    );

    if (!$exists) {
        json_error('Blog not found.', 404);
    }

    if ($on) {
        db_run(
            'INSERT IGNORE INTO bookmarks (user_id, blog_id) VALUES (?, ?)',
            [$user['id'], $blog_id]
        );
    } else {
        db_run(
            'DELETE FROM bookmarks WHERE user_id = ? AND blog_id = ?',
            [$user['id'], $blog_id]
        );
    }

    json_response(['saved' => $on]);
}


function route_follow(string $username, bool $on): void
{
    $user = require_login();

    $target = db_one(
        'SELECT id, name, username FROM users WHERE username = ? LIMIT 1',
        [normalize_username($username)]
    );

    if (!$target) {
        json_error('Writer not found.', 404);
    }

    if ($target['id'] === $user['id']) {
        json_error('You cannot follow yourself.', 422);
    }

    if ($on) {
        $added = db_run(
            'INSERT IGNORE INTO follows (follower_id, followee_id) VALUES (?, ?)',
            [$user['id'], $target['id']]
        );

        if ($added > 0) {
            notify($target['id'], $user['id'], 'follow', null, null);
        }
    } else {
        db_run(
            'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
            [$user['id'], $target['id']]
        );
    }

    json_response([
        'following' => $on,
        'followers' => (int) db_value(
            'SELECT COUNT(*) FROM follows WHERE followee_id = ?',
            [$target['id']]
        ),
    ]);
}


/* ---------------------------------------------------------
   The signed-in user's own lists.

   The frontend keeps bookmarks and likes as a map of
   { blogId: true }, so these return plain id arrays and the
   client builds the map.
--------------------------------------------------------- */

function route_my_bookmarks(): void
{
    $user = require_login();

    $ids = db_all(
        'SELECT bm.blog_id
           FROM bookmarks bm
           JOIN blogs b ON b.id = bm.blog_id AND b.deleted_at IS NULL
          WHERE bm.user_id = ?
          ORDER BY bm.created_at DESC',
        [$user['id']]
    );

    json_response(['blogIds' => array_column($ids, 'blog_id')]);
}


function route_my_likes(): void
{
    $user = require_login();

    $ids = db_all(
        'SELECT l.blog_id
           FROM likes l
           JOIN blogs b ON b.id = l.blog_id AND b.deleted_at IS NULL
          WHERE l.user_id = ?',
        [$user['id']]
    );

    json_response(['blogIds' => array_column($ids, 'blog_id')]);
}


function route_my_following(): void
{
    $user = require_login();

    $rows = db_all(
        'SELECT u.username
           FROM follows f
           JOIN users u ON u.id = f.followee_id
          WHERE f.follower_id = ?
          ORDER BY f.created_at DESC',
        [$user['id']]
    );

    json_response(['usernames' => array_column($rows, 'username')]);
}
