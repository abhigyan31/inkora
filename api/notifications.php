<?php
/* =========================================================
   INKORA - notifications

   These are written on the server, addressed to whoever
   should receive them. That was the whole problem with
   doing it in the browser: a client can only ever write to
   its own device.
========================================================= */

/* Called from social.php and comments.php. */
function notify(
    string $recipient_id,
    string $actor_id,
    string $type,
    ?string $blog_id = null,
    ?string $comment_id = null
): void {
    if ($recipient_id === $actor_id) {
        return;
    }

    /* Respect the recipient's settings. Missing row means
       they have never touched settings, so default to on. */
    $settings = db_one(
        'SELECT push_notifications, comment_notifications, follow_notifications
           FROM user_settings WHERE user_id = ?',
        [$recipient_id]
    );

    if ($settings) {
        if (!$settings['push_notifications']) {
            return;
        }

        if (in_array($type, ['comment', 'reply'], true) && !$settings['comment_notifications']) {
            return;
        }

        if ($type === 'follow' && !$settings['follow_notifications']) {
            return;
        }
    }

    db_run(
        'INSERT INTO notifications (id, user_id, actor_id, type, blog_id, comment_id)
         VALUES (?, ?, ?, ?, ?, ?)',
        [uuid(), $recipient_id, $actor_id, $type, $blog_id, $comment_id]
    );
}


/* ---------------------------------------------------------
   GET /notifications
--------------------------------------------------------- */

function route_list_notifications(): void
{
    $user = require_login();

    $limit  = min(max((int) query_param('limit', 50), 1), 100);
    $offset = max((int) query_param('offset', 0), 0);

    $rows = db_all(
        'SELECT n.*,
                a.name       AS actor_name,
                a.username   AS actor_username,
                a.avatar_url AS actor_avatar,
                b.title      AS blog_title
           FROM notifications n
           LEFT JOIN users a ON a.id = n.actor_id
           LEFT JOIN blogs b ON b.id = n.blog_id AND b.deleted_at IS NULL
          WHERE n.user_id = ?
          ORDER BY n.created_at DESC
          LIMIT ' . $limit . ' OFFSET ' . $offset,
        [$user['id']]
    );

    $text = [
        'like'    => 'liked your blog',
        'comment' => 'commented on your blog',
        'reply'   => 'replied to your comment',
        'follow'  => 'started following you',
    ];

    $notifications = array_map(function (array $row) use ($text) {
        return [
            'id'        => $row['id'],
            'type'      => $row['type'],
            'name'      => $row['actor_name'] ?? 'Someone',
            'username'  => $row['actor_username'] ?? '',
            'avatar'    => $row['actor_avatar'],
            'text'      => $text[$row['type']] ?? 'interacted with your blog',
            'blog'      => $row['blog_title'] ?? '',
            'blogId'    => $row['blog_id'] ?? '',
            'createdAt' => iso($row['created_at']),
            'unread'    => $row['read_at'] === null,
        ];
    }, $rows);

    $unread = (int) db_value(
        'SELECT COUNT(*) FROM notifications WHERE user_id = ? AND read_at IS NULL',
        [$user['id']]
    );

    json_response([
        'notifications' => $notifications,
        'unread'        => $unread,
    ]);
}


/* ---------------------------------------------------------
   POST /notifications/read
   { all: true } or { ids: [...] }
--------------------------------------------------------- */

function route_mark_notifications_read(): void
{
    $user = require_login();

    if (field('all') === true) {
        db_run(
            'UPDATE notifications
                SET read_at = UTC_TIMESTAMP()
              WHERE user_id = ? AND read_at IS NULL',
            [$user['id']]
        );

        json_response(['ok' => true]);
    }

    $ids = field('ids', []);

    if (!is_array($ids) || !$ids) {
        json_error('Nothing to mark as read.', 422);
    }

    $ids = array_slice(array_filter($ids, 'is_string'), 0, 100);

    if (!$ids) {
        json_error('Nothing to mark as read.', 422);
    }

    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    db_run(
        "UPDATE notifications
            SET read_at = UTC_TIMESTAMP()
          WHERE user_id = ? AND id IN ($placeholders)",
        array_merge([$user['id']], $ids)
    );

    json_response(['ok' => true]);
}


/* ---------------------------------------------------------
   DELETE /notifications/{id}  and  DELETE /notifications
--------------------------------------------------------- */

function route_delete_notification(string $id): void
{
    $user = require_login();

    /* The user_id in the WHERE is what stops anyone deleting
       somebody else's notifications by guessing an id. */
    db_run(
        'DELETE FROM notifications WHERE id = ? AND user_id = ?',
        [$id, $user['id']]
    );

    json_response(['ok' => true]);
}


function route_clear_notifications(): void
{
    $user = require_login();

    db_run('DELETE FROM notifications WHERE user_id = ?', [$user['id']]);

    json_response(['ok' => true]);
}
