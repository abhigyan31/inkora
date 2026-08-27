<?php
/* =========================================================
   INKORA API - front controller

   .htaccess sends every request under /api/ here, and this
   works out which handler should deal with it.

   The React app and the API sit on the same domain, so
   there is no CORS setup and the session cookie just works.
========================================================= */

declare(strict_types=1);

require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

/* Never print a stack trace to a visitor. */
$debug = (bool) (config()['debug'] ?? false);

ini_set('display_errors', $debug ? '1' : '0');
error_reporting(E_ALL);

set_exception_handler(function (Throwable $e) use ($debug) {
    error_log('INKORA API error: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());

    json_error(
        'Something went wrong on the server.',
        500,
        $debug ? ['detail' => $e->getMessage(), 'where' => $e->getFile() . ':' . $e->getLine()] : []
    );
});

/* A fatal error is not an exception, so the handler above
   never sees it - PHP just stops and Apache returns a 500
   with an empty body. That is impossible to debug from the
   browser, so catch it on the way out and send real JSON. */

register_shutdown_function(function () use ($debug) {
    $fatal = error_get_last();

    if (!$fatal || !in_array($fatal['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        return;
    }

    error_log('INKORA API fatal: ' . $fatal['message'] . ' @ ' . $fatal['file'] . ':' . $fatal['line']);

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode([
        'error' => 'The server hit a fatal error.',
        'fatal' => $debug
            ? [
                'message' => $fatal['message'],
                'file'    => basename($fatal['file']),
                'line'    => $fatal['line'],
            ]
            : 'Set debug to true in api/config.php to see the details.',
    ]);
});

require __DIR__ . '/auth.php';
require __DIR__ . '/blogs.php';
require __DIR__ . '/social.php';
require __DIR__ . '/comments.php';
require __DIR__ . '/notifications.php';
require __DIR__ . '/users.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/uploads.php';

/* ---------------------------------------------------------
   WORK OUT THE PATH

   Strip the /api prefix so routes are written as /blogs
   rather than /api/blogs.
--------------------------------------------------------- */

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = preg_replace('#^.*?/api#', '', $path);
$path = trim((string) $path, '/');

$segments = $path === '' ? [] : explode('/', $path);

$s0 = $segments[0] ?? '';
$s1 = $segments[1] ?? '';
$s2 = $segments[2] ?? '';

require_csrf_header();

/* ---------------------------------------------------------
   ROUTES
--------------------------------------------------------- */

/* --- health check, handy after deploying --- */
if ($s0 === '' || ($s0 === 'health' && $method === 'GET')) {
    json_response([
        'ok'      => true,
        'name'    => 'INKORA API',
        'time'    => iso(now()),
        'db'      => db_value('SELECT 1') == 1 ? 'connected' : 'unreachable',
    ]);
}

/* --- auth --- */
if ($s0 === 'auth') {
    match (true) {
        $s1 === 'signup'   && $method === 'POST'   => route_signup(),
        $s1 === 'login'    && $method === 'POST'   => route_login(),
        $s1 === 'logout'   && $method === 'POST'   => route_logout(),
        $s1 === 'me'       && $method === 'GET'    => route_me(),
        $s1 === 'profile'  && $method === 'PATCH'  => route_update_profile(),
        $s1 === 'password' && $method === 'POST'   => route_change_password(),
        $s1 === 'account'  && $method === 'DELETE' => route_delete_account(),
        default => json_error('Unknown auth route.', 404),
    };
}

/* --- the signed-in user's own lists --- */
if ($s0 === 'me') {
    match (true) {
        $s1 === 'bookmarks' && $method === 'GET' => route_my_bookmarks(),
        $s1 === 'likes'     && $method === 'GET' => route_my_likes(),
        $s1 === 'following' && $method === 'GET' => route_my_following(),
        default => json_error('Unknown route.', 404),
    };
}

/* --- blogs --- */
if ($s0 === 'blogs') {
    /* /blogs */
    if ($s1 === '') {
        match ($method) {
            'GET'  => route_list_blogs(),
            'POST' => route_create_blog(),
            default => json_error('Method not allowed.', 405),
        };
    }

    /* /blogs/{id}/... */
    if ($s2 === 'like') {
        match ($method) {
            'PUT'    => route_like($s1, true),
            'DELETE' => route_like($s1, false),
            default  => json_error('Method not allowed.', 405),
        };
    }

    if ($s2 === 'bookmark') {
        match ($method) {
            'PUT'    => route_bookmark($s1, true),
            'DELETE' => route_bookmark($s1, false),
            default  => json_error('Method not allowed.', 405),
        };
    }

    if ($s2 === 'view' && $method === 'POST') {
        route_record_view($s1);
    }

    if ($s2 === 'comments') {
        match ($method) {
            'GET'  => route_list_comments($s1),
            'POST' => route_create_comment($s1),
            default => json_error('Method not allowed.', 405),
        };
    }

    /* /blogs/{id} */
    if ($s2 === '') {
        match ($method) {
            'GET'    => route_get_blog($s1),
            'PATCH'  => route_update_blog($s1),
            'DELETE' => route_delete_blog($s1),
            default  => json_error('Method not allowed.', 405),
        };
    }

    json_error('Unknown blog route.', 404);
}

/* --- comments --- */
if ($s0 === 'comments') {
    if ($s2 === 'like') {
        match ($method) {
            'PUT'    => route_like_comment($s1, true),
            'DELETE' => route_like_comment($s1, false),
            default  => json_error('Method not allowed.', 405),
        };
    }

    if ($method === 'DELETE') {
        route_delete_comment($s1);
    }

    json_error('Unknown comment route.', 404);
}

/* --- users --- */
if ($s0 === 'users') {
    if ($s2 === 'follow') {
        match ($method) {
            'PUT'    => route_follow($s1, true),
            'DELETE' => route_follow($s1, false),
            default  => json_error('Method not allowed.', 405),
        };
    }

    if ($s2 === 'blogs' && $method === 'GET') {
        route_user_blogs($s1);
    }

    if ($s2 === '' && $method === 'GET') {
        route_get_user($s1);
    }

    json_error('Unknown user route.', 404);
}

/* --- notifications --- */
if ($s0 === 'notifications') {
    if ($s1 === 'read' && $method === 'POST') {
        route_mark_notifications_read();
    }

    if ($s1 === '' && $method === 'GET') {
        route_list_notifications();
    }

    if ($s1 === '' && $method === 'DELETE') {
        route_clear_notifications();
    }

    if ($s1 !== '' && $method === 'DELETE') {
        route_delete_notification($s1);
    }

    json_error('Unknown notification route.', 404);
}

/* --- settings --- */
if ($s0 === 'settings') {
    match ($method) {
        'GET'   => route_get_settings(),
        'PATCH' => route_update_settings(),
        default => json_error('Method not allowed.', 405),
    };
}

/* --- uploads --- */
if ($s0 === 'uploads' && $method === 'POST') {
    route_upload();
}

json_error('Not found.', 404);
