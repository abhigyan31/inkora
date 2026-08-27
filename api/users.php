<?php
/* =========================================================
   INKORA - public writer profiles
========================================================= */

/* GET /users/{username} */
function route_get_user(string $username): void
{
    $viewer = current_user();

    $user = db_one(
        'SELECT * FROM users WHERE username = ? LIMIT 1',
        [normalize_username($username)]
    );

    if (!$user) {
        json_error('Writer not found.', 404);
    }

    $settings = db_one(
        'SELECT * FROM user_settings WHERE user_id = ?',
        [$user['id']]
    );

    $is_self = $viewer && $viewer['id'] === $user['id'];

    /* Someone with a private profile is still reachable by
       people who know the handle, but nothing beyond the
       basics is returned. */
    if ($settings && !$settings['profile_visibility'] && !$is_self) {
        json_response([
            'user' => [
                'id'       => $user['id'],
                'name'     => $user['name'],
                'username' => $user['username'],
                'private'  => true,
            ],
            'stats' => null,
        ]);
    }

    $profile = public_user($user);

    /* Email and contact only appear if the owner opted in. */
    if ($is_self || ($settings && $settings['email_visibility'])) {
        $profile['email'] = $user['email'];
    }

    if ($is_self || ($settings && $settings['contact_visibility'])) {
        $profile['contact'] = $user['contact'];
    }

    $profile['isYou'] = (bool) $is_self;

    $profile['followedByMe'] = $viewer
        ? (bool) db_value(
            'SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?',
            [$viewer['id'], $user['id']]
        )
        : false;

    json_response([
        'user'  => $profile,
        'stats' => user_stats($user['id']),
    ]);
}


/* GET /users/{username}/blogs */
function route_user_blogs(string $username): void
{
    $user = db_one(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [normalize_username($username)]
    );

    if (!$user) {
        json_error('Writer not found.', 404);
    }

    $viewer = current_user();
    $viewer_id = $viewer['id'] ?? null;

    $params = ['author' => $user['id']];

    if ($viewer_id) {
        $params['viewer1'] = $viewer_id;
        $params['viewer2'] = $viewer_id;
    }

    $rows = db_all(
        'SELECT ' . blog_select($viewer_id) . '
           FROM blogs b
           JOIN users u ON u.id = b.author_id
          WHERE b.author_id = :author AND b.deleted_at IS NULL
          ORDER BY b.published_at DESC',
        $params
    );

    json_response(['blogs' => shape_blogs($rows)]);
}


/* Counts shown on a profile. All derived, so they can never
   disagree with the actual rows. */
function user_stats(string $user_id): array
{
    $row = db_one(
        'SELECT
            (SELECT COUNT(*) FROM follows WHERE followee_id = :id) AS followers,
            (SELECT COUNT(*) FROM follows WHERE follower_id = :id) AS following,
            (SELECT COUNT(*) FROM blogs WHERE author_id = :id AND deleted_at IS NULL) AS blogs,
            (SELECT COUNT(*) FROM likes l
               JOIN blogs b ON b.id = l.blog_id
              WHERE b.author_id = :id AND b.deleted_at IS NULL) AS likes_received,
            (SELECT COUNT(*) FROM blog_views v
               JOIN blogs b ON b.id = v.blog_id
              WHERE b.author_id = :id AND b.deleted_at IS NULL) AS views,
            (SELECT COUNT(*) FROM bookmarks WHERE user_id = :id) AS saved',
        ['id' => $user_id]
    );

    return [
        'followers'     => (int) $row['followers'],
        'following'     => (int) $row['following'],
        'blogs'         => (int) $row['blogs'],
        'likesReceived' => (int) $row['likes_received'],
        'views'         => (int) $row['views'],
        'saved'         => (int) $row['saved'],
    ];
}
