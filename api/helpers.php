<?php
/* =========================================================
   INKORA - shared helpers

   JSON responses, input reading, validation, uuids, and the
   auth guard. Everything else includes this.
========================================================= */

/* ---------------------------------------------------------
   CONFIG
--------------------------------------------------------- */

function config(): array
{
    static $config = null;

    if ($config === null) {
        $path = __DIR__ . '/config.php';

        if (!file_exists($path)) {
            json_error(
                'The API is not configured. Copy config.example.php to config.php and fill in the database details.',
                500
            );
        }

        $config = require $path;
    }

    return $config;
}

/* ---------------------------------------------------------
   RESPONSES
--------------------------------------------------------- */

function json_response($data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');

    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400, array $extra = []): void
{
    json_response(array_merge(['error' => $message], $extra), $status);
}

/* ---------------------------------------------------------
   INPUT

   The client always sends JSON except for uploads, which are
   multipart.
--------------------------------------------------------- */

function body(): array
{
    static $body = null;

    if ($body === null) {
        $raw = file_get_contents('php://input');

        if ($raw === '' || $raw === false) {
            $body = [];
        } else {
            $decoded = json_decode($raw, true);
            $body = is_array($decoded) ? $decoded : [];
        }
    }

    return $body;
}

function field(string $key, $default = null)
{
    $body = body();

    return array_key_exists($key, $body) ? $body[$key] : $default;
}

function query_param(string $key, $default = null)
{
    return isset($_GET[$key]) && $_GET[$key] !== '' ? $_GET[$key] : $default;
}

function str_field(string $key, string $default = ''): string
{
    $value = field($key, $default);

    return is_string($value) ? trim($value) : $default;
}

/* ---------------------------------------------------------
   VALIDATION
--------------------------------------------------------- */

function require_fields(array $keys): void
{
    $missing = [];

    foreach ($keys as $key) {
        if (str_field($key) === '') {
            $missing[] = $key;
        }
    }

    if ($missing) {
        json_error('Missing required fields: ' . implode(', ', $missing), 422);
    }
}

function valid_email(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/* Usernames are stored with the @ so they render as-is. */
function normalize_username(string $username): string
{
    $value = trim($username);

    if ($value === '') {
        return '';
    }

    $value = ltrim($value, '@');
    $value = preg_replace('/[^A-Za-z0-9_]/', '', $value);

    return $value === '' ? '' : '@' . strtolower($value);
}

/* ---------------------------------------------------------
   IDS
--------------------------------------------------------- */

function uuid(): string
{
    $bytes = random_bytes(16);

    /* Set the version (4) and variant bits so it's a real
       v4 uuid rather than 16 random bytes with dashes. */
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function token(int $bytes = 32): string
{
    return bin2hex(random_bytes($bytes));
}

/* ---------------------------------------------------------
   TIME
--------------------------------------------------------- */

function now(): string
{
    return gmdate('Y-m-d H:i:s');
}

/* MySQL DATETIME is stored in UTC, the frontend wants ISO. */
function iso(?string $datetime): ?string
{
    if (!$datetime) {
        return null;
    }

    return gmdate('c', strtotime($datetime . ' UTC'));
}

/* ---------------------------------------------------------
   SESSIONS

   The cookie holds a random token. Only its sha256 is
   stored, so a leaked database dump can't be used to log in
   as anyone.
--------------------------------------------------------- */

const SESSION_COOKIE = 'inkora_session';

function session_cookie_options(int $expires): array
{
    $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    return [
        'expires'  => $expires,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function start_session(string $user_id): void
{
    $raw  = token();
    $hash = hash('sha256', $raw);

    $days    = (int) (config()['session_days'] ?? 30);
    $expires = time() + ($days * 86400);

    db()->prepare(
        'INSERT INTO sessions (id, user_id, user_agent, expires_at)
         VALUES (?, ?, ?, ?)'
    )->execute([
        $hash,
        $user_id,
        substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255),
        gmdate('Y-m-d H:i:s', $expires),
    ]);

    setcookie(SESSION_COOKIE, $raw, session_cookie_options($expires));
}

function end_session(): void
{
    $raw = $_COOKIE[SESSION_COOKIE] ?? '';

    if ($raw !== '') {
        db()->prepare('DELETE FROM sessions WHERE id = ?')
            ->execute([hash('sha256', $raw)]);
    }

    setcookie(SESSION_COOKIE, '', session_cookie_options(time() - 3600));
}

/* Returns the signed-in user row, or null. */
function current_user(): ?array
{
    static $user = false;

    if ($user !== false) {
        return $user;
    }

    $raw = $_COOKIE[SESSION_COOKIE] ?? '';

    if ($raw === '') {
        return $user = null;
    }

    $statement = db()->prepare(
        'SELECT u.*
           FROM sessions s
           JOIN users u ON u.id = s.user_id
          WHERE s.id = ? AND s.expires_at > UTC_TIMESTAMP()
          LIMIT 1'
    );

    $statement->execute([hash('sha256', $raw)]);

    $row = $statement->fetch();

    return $user = ($row ?: null);
}

function require_login(): array
{
    $user = current_user();

    if (!$user) {
        json_error('You need to be signed in to do that.', 401);
    }

    return $user;
}

/* ---------------------------------------------------------
   CSRF

   SameSite=Lax already blocks cross-site POSTs from forms.
   Requiring a custom header closes the gap, because a plain
   HTML form cannot set one and a cross-origin fetch that
   tries would be stopped by the preflight.
--------------------------------------------------------- */

function require_csrf_header(): void
{
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        return;
    }

    if (($_SERVER['HTTP_X_INKORA_REQUEST'] ?? '') !== '1') {
        json_error('Bad request.', 403);
    }
}

/* ---------------------------------------------------------
   RATE LIMITING
--------------------------------------------------------- */

function rate_limit(string $identifier, int $max, int $seconds): void
{
    $db = db();

    $db->prepare(
        'DELETE FROM login_attempts
          WHERE attempted_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? SECOND)'
    )->execute([$seconds * 4]);

    $statement = $db->prepare(
        'SELECT COUNT(*) FROM login_attempts
          WHERE identifier = ?
            AND attempted_at > DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? SECOND)'
    );

    $statement->execute([$identifier, $seconds]);

    if ((int) $statement->fetchColumn() >= $max) {
        json_error('Too many attempts. Please wait a few minutes and try again.', 429);
    }

    $db->prepare('INSERT INTO login_attempts (identifier) VALUES (?)')
       ->execute([$identifier]);
}

function clear_rate_limit(string $identifier): void
{
    db()->prepare('DELETE FROM login_attempts WHERE identifier = ?')
        ->execute([$identifier]);
}

/* ---------------------------------------------------------
   CLIENT FINGERPRINT

   Used to count one view per person per day without
   requiring a login.
--------------------------------------------------------- */

function view_key(): string
{
    $user = current_user();

    if ($user) {
        return hash('sha256', 'user:' . $user['id']);
    }

    return hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . ($_SERVER['HTTP_USER_AGENT'] ?? ''));
}

/* ---------------------------------------------------------
   SHAPING ROWS FOR THE FRONTEND

   The React app expects camelCase and an author object, so
   the mapping happens here rather than in every query.
--------------------------------------------------------- */

function public_user(array $row, bool $include_private = false): array
{
    $user = [
        'id'          => $row['id'],
        'name'        => $row['name'],
        'username'    => $row['username'],
        'bio'         => $row['bio'] ?? '',
        'avatar'      => $row['avatar_url'] ?: null,
        'coverImage'  => $row['cover_url'] ?: null,
        'createdAt'   => iso($row['created_at'] ?? null),
    ];

    if ($include_private) {
        $user['email']   = $row['email'] ?? '';
        $user['contact'] = $row['contact'] ?? '';
        $user['dob']     = $row['dob'] ?? '';
    }

    return $user;
}

function public_blog(array $row, array $tags = []): array
{
    return [
        'id'          => $row['id'],
        'title'       => $row['title'],
        'description' => $row['description'],
        'category'    => $row['category'],
        'tags'        => $tags,
        'thumbnail'   => $row['thumbnail_path'] ?: null,
        'pdf'         => $row['pdf_path'] ?: null,
        'pdfName'     => $row['pdf_name'] ?? null,
        'pdfSize'     => isset($row['pdf_size']) ? (int) $row['pdf_size'] : null,
        'readTime'    => $row['read_time'] ?: null,
        'createdAt'   => iso($row['published_at']),
        'updatedAt'   => iso($row['updated_at'] ?? null),

        'author' => [
            'id'       => $row['author_id'],
            'name'     => $row['author_name'] ?? 'Unknown writer',
            'username' => $row['author_username'] ?? '',
            'avatar'   => $row['author_avatar'] ?? null,
        ],

        'likes'      => (int) ($row['like_count'] ?? 0),
        'comments'   => (int) ($row['comment_count'] ?? 0),
        'views'      => (int) ($row['view_count'] ?? 0),
        'likedByMe'  => (bool) ($row['liked_by_me'] ?? false),
        'savedByMe'  => (bool) ($row['saved_by_me'] ?? false),
    ];
}
