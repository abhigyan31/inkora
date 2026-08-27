<?php
/* =========================================================
   INKORA - comments and replies
========================================================= */

function shape_comment(array $row, ?string $viewer_id): array
{
    return [
        'id'             => $row['id'],
        'blogId'         => $row['blog_id'],
        'parentId'       => $row['parent_id'],
        'authorId'       => $row['author_id'],
        'authorName'     => $row['author_name'],
        'authorUsername' => $row['author_username'],
        'authorAvatar'   => $row['author_avatar'],
        'text'           => $row['body'],
        'createdAt'      => iso($row['created_at']),
        'likes'          => (int) $row['like_count'],
        'likedByMe'      => (bool) $row['liked_by_me'],
        'canDelete'      => $viewer_id !== null
            && ($row['author_id'] === $viewer_id || $row['blog_author_id'] === $viewer_id),
    ];
}


/* ---------------------------------------------------------
   GET /blogs/{id}/comments
--------------------------------------------------------- */

function route_list_comments(string $blog_id): void
{
    $viewer = current_user();
    $viewer_id = $viewer['id'] ?? null;

    $liked = $viewer_id
        ? '(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = :viewer)'
        : 'NULL';

    $params = ['blog_id' => $blog_id];

    if ($viewer_id) {
        $params['viewer'] = $viewer_id;
    }

    $rows = db_all(
        "SELECT c.*,
                u.name       AS author_name,
                u.username   AS author_username,
                u.avatar_url AS author_avatar,
                b.author_id  AS blog_author_id,
                (SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id = c.id) AS like_count,
                $liked AS liked_by_me
           FROM comments c
           JOIN users u ON u.id = c.author_id
           JOIN blogs b ON b.id = c.blog_id
          WHERE c.blog_id = :blog_id
            AND c.deleted_at IS NULL
          ORDER BY c.created_at ASC",
        $params
    );

    json_response([
        'comments' => array_map(
            fn(array $row) => shape_comment($row, $viewer_id),
            $rows
        ),
    ]);
}


/* ---------------------------------------------------------
   POST /blogs/{id}/comments
--------------------------------------------------------- */

function route_create_comment(string $blog_id): void
{
    $user = require_login();

    $text = str_field('text');

    if ($text === '') {
        json_error('Your comment is empty.', 422);
    }

    if (mb_strlen($text) > 2000) {
        json_error('Comments have to be 2000 characters or fewer.', 422);
    }

    /* Stops a script filling the table overnight. */
    rate_limit('comment:' . $user['id'], 15, 60);

    $blog = db_one(
        'SELECT id, title, author_id FROM blogs WHERE id = ? AND deleted_at IS NULL',
        [$blog_id]
    );

    if (!$blog) {
        json_error('Blog not found.', 404);
    }

    $parent_id = str_field('parentId') ?: null;
    $reply_to  = null;

    if ($parent_id !== null) {
        $parent = db_one(
            'SELECT id, author_id, parent_id FROM comments
              WHERE id = ? AND blog_id = ? AND deleted_at IS NULL',
            [$parent_id, $blog_id]
        );

        if (!$parent) {
            json_error('That comment no longer exists.', 404);
        }

        /* Only one level of nesting - a reply to a reply
           attaches to the original comment instead. */
        $parent_id = $parent['parent_id'] ?: $parent['id'];
        $reply_to  = $parent['author_id'];
    }

    $id = uuid();

    db_run(
        'INSERT INTO comments (id, blog_id, author_id, parent_id, body)
         VALUES (?, ?, ?, ?, ?)',
        [$id, $blog_id, $user['id'], $parent_id, $text]
    );

    /* A reply notifies the person being replied to; a
       top-level comment notifies the blog's author. Never
       notify yourself. */
    if ($reply_to !== null) {
        if ($reply_to !== $user['id']) {
            notify($reply_to, $user['id'], 'reply', $blog_id, $id);
        }
    } elseif ($blog['author_id'] !== $user['id']) {
        notify($blog['author_id'], $user['id'], 'comment', $blog_id, $id);
    }

    $row = db_one(
        'SELECT c.*,
                u.name       AS author_name,
                u.username   AS author_username,
                u.avatar_url AS author_avatar,
                b.author_id  AS blog_author_id,
                0 AS like_count,
                NULL AS liked_by_me
           FROM comments c
           JOIN users u ON u.id = c.author_id
           JOIN blogs b ON b.id = c.blog_id
          WHERE c.id = ?',
        [$id]
    );

    json_response(['comment' => shape_comment($row, $user['id'])], 201);
}


/* ---------------------------------------------------------
   DELETE /comments/{id}

   The comment's author can delete it, and so can the blog's
   author - it's their post, they should be able to remove
   something abusive from it.
--------------------------------------------------------- */

function route_delete_comment(string $id): void
{
    $user = require_login();

    $comment = db_one(
        'SELECT c.id, c.author_id, b.author_id AS blog_author_id
           FROM comments c
           JOIN blogs b ON b.id = c.blog_id
          WHERE c.id = ? AND c.deleted_at IS NULL',
        [$id]
    );

    if (!$comment) {
        json_error('Comment not found.', 404);
    }

    if ($comment['author_id'] !== $user['id'] && $comment['blog_author_id'] !== $user['id']) {
        json_error('You can only delete your own comments.', 403);
    }

    /* Soft delete the comment and its replies together. */
    db_run(
        'UPDATE comments
            SET deleted_at = UTC_TIMESTAMP()
          WHERE id = ? OR parent_id = ?',
        [$id, $id]
    );

    json_response(['ok' => true]);
}


/* ---------------------------------------------------------
   PUT / DELETE /comments/{id}/like
--------------------------------------------------------- */

function route_like_comment(string $id, bool $on): void
{
    $user = require_login();

    $exists = db_value(
        'SELECT 1 FROM comments WHERE id = ? AND deleted_at IS NULL',
        [$id]
    );

    if (!$exists) {
        json_error('Comment not found.', 404);
    }

    if ($on) {
        db_run(
            'INSERT IGNORE INTO comment_likes (user_id, comment_id) VALUES (?, ?)',
            [$user['id'], $id]
        );
    } else {
        db_run(
            'DELETE FROM comment_likes WHERE user_id = ? AND comment_id = ?',
            [$user['id'], $id]
        );
    }

    json_response([
        'liked' => $on,
        'likes' => (int) db_value(
            'SELECT COUNT(*) FROM comment_likes WHERE comment_id = ?',
            [$id]
        ),
    ]);
}
