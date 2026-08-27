<?php
/* =========================================================
   INKORA - blogs
========================================================= */

/* The select list every blog query shares. Counts are read
   live rather than kept in a column, so they can't drift
   when something gets deleted. */
function blog_select(?string $viewer_id): string
{
    $liked = $viewer_id
        ? '(SELECT 1 FROM likes lk WHERE lk.blog_id = b.id AND lk.user_id = :viewer1)'
        : 'NULL';

    $saved = $viewer_id
        ? '(SELECT 1 FROM bookmarks bm WHERE bm.blog_id = b.id AND bm.user_id = :viewer2)'
        : 'NULL';

    return "
        b.*,
        u.name       AS author_name,
        u.username   AS author_username,
        u.avatar_url AS author_avatar,
        (SELECT COUNT(*) FROM likes l      WHERE l.blog_id = b.id) AS like_count,
        (SELECT COUNT(*) FROM comments c   WHERE c.blog_id = b.id AND c.deleted_at IS NULL) AS comment_count,
        (SELECT COUNT(*) FROM blog_views v WHERE v.blog_id = b.id) AS view_count,
        $liked AS liked_by_me,
        $saved AS saved_by_me
    ";
}

/* Pull the tags for a set of blogs in one query rather than
   one query per blog. */
function tags_for(array $blog_ids): array
{
    if (!$blog_ids) {
        return [];
    }

    $placeholders = implode(',', array_fill(0, count($blog_ids), '?'));

    $rows = db_all(
        "SELECT blog_id, tag FROM blog_tags WHERE blog_id IN ($placeholders) ORDER BY tag",
        $blog_ids
    );

    $map = [];

    foreach ($rows as $row) {
        $map[$row['blog_id']][] = $row['tag'];
    }

    return $map;
}

function shape_blogs(array $rows): array
{
    $tags = tags_for(array_column($rows, 'id'));

    return array_map(
        fn(array $row) => public_blog($row, $tags[$row['id']] ?? []),
        $rows
    );
}


/* ---------------------------------------------------------
   GET /blogs
   ?q= &category= &author= &sort=recent|trending &limit= &offset=
--------------------------------------------------------- */

function route_list_blogs(): void
{
    $viewer = current_user();
    $viewer_id = $viewer['id'] ?? null;

    $where  = ['b.deleted_at IS NULL'];
    $params = [];

    if ($viewer_id) {
        $params['viewer1'] = $viewer_id;
        $params['viewer2'] = $viewer_id;
    }

    $search = trim((string) query_param('q', ''));

    if ($search !== '') {
        /* LIKE rather than MATCH here because fulltext skips
           words under 4 characters by default, and people do
           search for things like "ai". */
        $where[] = '(b.title LIKE :search
                  OR b.description LIKE :search
                  OR b.category LIKE :search
                  OR u.name LIKE :search
                  OR u.username LIKE :search
                  OR EXISTS (SELECT 1 FROM blog_tags t WHERE t.blog_id = b.id AND t.tag LIKE :search))';

        $params['search'] = '%' . $search . '%';
    }

    $category = trim((string) query_param('category', ''));

    if ($category !== '' && strtolower($category) !== 'all') {
        $where[] = 'b.category = :category';
        $params['category'] = $category;
    }

    $author = trim((string) query_param('author', ''));

    if ($author !== '') {
        if ($author === 'me') {
            require_login();
            $where[] = 'b.author_id = :author';
            $params['author'] = $viewer_id;
        } else {
            $where[] = 'u.username = :author';
            $params['author'] = normalize_username($author);
        }
    }

    if (query_param('following') === '1' && $viewer_id) {
        $where[] = 'b.author_id IN (SELECT followee_id FROM follows WHERE follower_id = :follower)';
        $params['follower'] = $viewer_id;
    }

    /* The Saved tab needs whole blogs, not just their ids. */
    if (query_param('saved') === '1') {
        require_login();

        $where[] = 'EXISTS (SELECT 1 FROM bookmarks bk
                             WHERE bk.blog_id = b.id AND bk.user_id = :saver)';
        $params['saver'] = $viewer_id;
    }

    $order = query_param('sort') === 'trending'
        ? 'like_count DESC, b.published_at DESC'
        : 'b.published_at DESC';

    $limit  = min(max((int) query_param('limit', 50), 1), 100);
    $offset = max((int) query_param('offset', 0), 0);

    $sql = 'SELECT ' . blog_select($viewer_id) . '
              FROM blogs b
              JOIN users u ON u.id = b.author_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY ' . $order . '
             LIMIT ' . $limit . ' OFFSET ' . $offset;

    /* $limit and $offset are cast to int above, so they are
       safe to interpolate. Everything else is bound. */

    $rows = db_all($sql, $params);

    $total = (int) db_value(
        'SELECT COUNT(*) FROM blogs b JOIN users u ON u.id = b.author_id
          WHERE ' . implode(' AND ', $where),
        array_diff_key($params, ['viewer1' => 1, 'viewer2' => 1])
    );

    json_response([
        'blogs' => shape_blogs($rows),
        'total' => $total,
    ]);
}


/* ---------------------------------------------------------
   GET /blogs/{id}
--------------------------------------------------------- */

function route_get_blog(string $id): void
{
    $viewer = current_user();
    $viewer_id = $viewer['id'] ?? null;

    $params = ['id' => $id];

    if ($viewer_id) {
        $params['viewer1'] = $viewer_id;
        $params['viewer2'] = $viewer_id;
    }

    $row = db_one(
        'SELECT ' . blog_select($viewer_id) . '
           FROM blogs b
           JOIN users u ON u.id = b.author_id
          WHERE b.id = :id AND b.deleted_at IS NULL
          LIMIT 1',
        $params
    );

    if (!$row) {
        json_error('Blog not found.', 404);
    }

    json_response(['blog' => shape_blogs([$row])[0]]);
}


/* ---------------------------------------------------------
   POST /blogs
--------------------------------------------------------- */

function route_create_blog(): void
{
    $user = require_login();

    require_fields(['title', 'description', 'category']);

    $title       = str_field('title');
    $description = str_field('description');
    $category    = str_field('category');

    if (mb_strlen($title) > 150) {
        json_error('Titles have to be 150 characters or fewer.', 422);
    }

    if (mb_strlen($description) > 400) {
        json_error('Descriptions have to be 400 characters or fewer.', 422);
    }

    $id = uuid();

    db()->beginTransaction();

    try {
        db_run(
            'INSERT INTO blogs
               (id, author_id, title, description, category,
                thumbnail_path, pdf_path, pdf_name, pdf_size, read_time)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $user['id'],
                $title,
                $description,
                $category,
                safe_upload_path(field('thumbnail')),
                safe_upload_path(field('pdf')),
                mb_substr((string) field('pdfName', ''), 0, 255) ?: null,
                (int) field('pdfSize', 0) ?: null,
                mb_substr(str_field('readTime'), 0, 20) ?: null,
            ]
        );

        save_tags($id, field('tags', []));

        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }

    route_get_blog($id);
}


/* ---------------------------------------------------------
   PATCH /blogs/{id}
--------------------------------------------------------- */

function route_update_blog(string $id): void
{
    $user = require_login();

    $blog = db_one('SELECT * FROM blogs WHERE id = ? AND deleted_at IS NULL', [$id]);

    if (!$blog) {
        json_error('Blog not found.', 404);
    }

    /* Checked on the server, not just by hiding the button. */
    if ($blog['author_id'] !== $user['id']) {
        json_error('You can only edit your own blogs.', 403);
    }

    $fields = ['updated_at = UTC_TIMESTAMP()'];
    $params = [];

    if (field('title') !== null) {
        $fields[] = 'title = ?';
        $params[] = mb_substr(str_field('title'), 0, 150);
    }

    if (field('description') !== null) {
        $fields[] = 'description = ?';
        $params[] = mb_substr(str_field('description'), 0, 400);
    }

    if (field('category') !== null) {
        $fields[] = 'category = ?';
        $params[] = str_field('category');
    }

    if (field('readTime') !== null) {
        $fields[] = 'read_time = ?';
        $params[] = mb_substr(str_field('readTime'), 0, 20);
    }

    if (field('thumbnail') !== null) {
        $new = safe_upload_path(field('thumbnail'));

        if ($new !== $blog['thumbnail_path']) {
            delete_upload($blog['thumbnail_path']);
        }

        $fields[] = 'thumbnail_path = ?';
        $params[] = $new;
    }

    if (field('pdf') !== null) {
        $new = safe_upload_path(field('pdf'));

        if ($new !== $blog['pdf_path']) {
            delete_upload($blog['pdf_path']);
        }

        $fields[] = 'pdf_path = ?';
        $params[] = $new;

        $fields[] = 'pdf_name = ?';
        $params[] = mb_substr((string) field('pdfName', ''), 0, 255) ?: null;

        $fields[] = 'pdf_size = ?';
        $params[] = (int) field('pdfSize', 0) ?: null;
    }

    $params[] = $id;

    db()->beginTransaction();

    try {
        db_run('UPDATE blogs SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);

        if (field('tags') !== null) {
            db_run('DELETE FROM blog_tags WHERE blog_id = ?', [$id]);
            save_tags($id, field('tags', []));
        }

        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }

    route_get_blog($id);
}


/* ---------------------------------------------------------
   DELETE /blogs/{id}
--------------------------------------------------------- */

function route_delete_blog(string $id): void
{
    $user = require_login();

    $blog = db_one('SELECT * FROM blogs WHERE id = ? AND deleted_at IS NULL', [$id]);

    if (!$blog) {
        json_error('Blog not found.', 404);
    }

    if ($blog['author_id'] !== $user['id']) {
        json_error('You can only delete your own blogs.', 403);
    }

    delete_upload($blog['thumbnail_path']);
    delete_upload($blog['pdf_path']);

    db_run(
        'UPDATE blogs
            SET deleted_at = UTC_TIMESTAMP(),
                thumbnail_path = NULL,
                pdf_path = NULL
          WHERE id = ?',
        [$id]
    );

    json_response(['ok' => true]);
}


/* ---------------------------------------------------------
   POST /blogs/{id}/view

   INSERT IGNORE plus the composite primary key means
   refreshing your own post all day still counts once.
--------------------------------------------------------- */

function route_record_view(string $id): void
{
    $exists = db_value('SELECT 1 FROM blogs WHERE id = ? AND deleted_at IS NULL', [$id]);

    if (!$exists) {
        json_error('Blog not found.', 404);
    }

    db_run(
        'INSERT IGNORE INTO blog_views (blog_id, view_key, viewed_on)
         VALUES (?, ?, UTC_DATE())',
        [$id, view_key()]
    );

    $count = (int) db_value('SELECT COUNT(*) FROM blog_views WHERE blog_id = ?', [$id]);

    json_response(['views' => $count]);
}


/* ---------------------------------------------------------
   HELPERS
--------------------------------------------------------- */

function save_tags(string $blog_id, $tags): void
{
    if (!is_array($tags)) {
        return;
    }

    $seen = [];

    $statement = db()->prepare(
        'INSERT IGNORE INTO blog_tags (blog_id, tag) VALUES (?, ?)'
    );

    foreach ($tags as $tag) {
        if (!is_string($tag)) {
            continue;
        }

        $clean = mb_strtolower(trim($tag));
        $clean = mb_substr($clean, 0, 40);

        if ($clean === '' || isset($seen[$clean])) {
            continue;
        }

        $seen[$clean] = true;

        $statement->execute([$blog_id, $clean]);

        /* Ten is plenty and stops someone posting a thousand. */
        if (count($seen) >= 10) {
            break;
        }
    }
}

/* Only ever accept a path this API handed out. Without this
   check someone could POST thumbnail: "../../config.php" and
   have the app link straight at it. */
function safe_upload_path($value): ?string
{
    if (!is_string($value) || $value === '') {
        return null;
    }

    $base = config()['uploads_url'] ?? '/uploads';

    if (!str_starts_with($value, $base . '/')) {
        json_error('That file reference is not valid.', 422);
    }

    if (str_contains($value, '..') || str_contains($value, "\0")) {
        json_error('That file reference is not valid.', 422);
    }

    return $value;
}

function delete_upload(?string $path): void
{
    if (!$path) {
        return;
    }

    $base_url = config()['uploads_url'] ?? '/uploads';
    $base_dir = realpath(config()['uploads_dir'] ?? __DIR__ . '/../uploads');

    if (!$base_dir || !str_starts_with($path, $base_url . '/')) {
        return;
    }

    $relative = substr($path, strlen($base_url));
    $full     = realpath($base_dir . $relative);

    /* realpath resolves any ".." before we compare, so a
       crafted path can't escape the uploads folder. */
    if ($full && str_starts_with($full, $base_dir) && is_file($full)) {
        @unlink($full);
    }
}
