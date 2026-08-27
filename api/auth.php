<?php
/* =========================================================
   INKORA - signup, login, logout, account
========================================================= */

function route_signup(): void
{
    require_fields(['name', 'email', 'password']);

    $name     = str_field('name');
    $email    = strtolower(str_field('email'));
    $password = (string) field('password', '');

    if (mb_strlen($name) > 80) {
        json_error('That name is too long.', 422);
    }

    if (!valid_email($email)) {
        json_error('Please enter a valid email address.', 422);
    }

    if (strlen($password) < 8) {
        json_error('Your password must be at least 8 characters long.', 422);
    }

    /* Stops someone scripting thousands of accounts. */
    rate_limit('signup:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 5, 3600);

    if (db_value('SELECT 1 FROM users WHERE email = ? LIMIT 1', [$email])) {
        json_error('An account with this email already exists.', 409);
    }

    /* Turn the name into a handle, adding a number if taken. */
    $base = preg_replace('/[^a-z0-9]/', '', strtolower($name));
    $base = $base !== '' ? substr($base, 0, 14) : 'writer';

    $username = '@' . $base;
    $suffix   = 1;

    while (db_value('SELECT 1 FROM users WHERE username = ? LIMIT 1', [$username])) {
        $suffix++;
        $username = '@' . $base . $suffix;
    }

    $id = uuid();

    db_run(
        'INSERT INTO users (id, name, username, email, password_hash, bio)
         VALUES (?, ?, ?, ?, ?, ?)',
        [
            $id,
            $name,
            $username,
            $email,
            password_hash($password, PASSWORD_DEFAULT),
            'New on INKORA.',
        ]
    );

    db_run('INSERT INTO user_settings (user_id) VALUES (?)', [$id]);

    start_session($id);

    $user = db_one('SELECT * FROM users WHERE id = ?', [$id]);

    json_response(['user' => public_user($user, true)], 201);
}


function route_login(): void
{
    require_fields(['email', 'password']);

    $email    = strtolower(str_field('email'));
    $password = (string) field('password', '');

    /* Limit by email and by IP. Limiting only by email lets
       one attacker lock out a victim; only by IP lets a
       botnet spread the guessing. */
    rate_limit('login:' . $email, 8, 900);
    rate_limit('login-ip:' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 30, 900);

    $user = db_one('SELECT * FROM users WHERE email = ? LIMIT 1', [$email]);

    /* Same message and roughly the same work either way, so
       this can't be used to find out which emails exist. */
    if (!$user || !password_verify($password, $user['password_hash'])) {
        if (!$user) {
            password_verify($password, '$2y$10$usesomesillystringforsalt0000000000000000000000000000000');
        }

        json_error('Incorrect email or password.', 401);
    }

    /* Rehash if PHP's default cost has moved on since signup. */
    if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
        db_run(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [password_hash($password, PASSWORD_DEFAULT), $user['id']]
        );
    }

    clear_rate_limit('login:' . $email);

    start_session($user['id']);

    json_response(['user' => public_user($user, true)]);
}


function route_logout(): void
{
    end_session();

    json_response(['ok' => true]);
}


function route_me(): void
{
    $user = current_user();

    if (!$user) {
        json_response(['user' => null]);
    }

    json_response(['user' => public_user($user, true)]);
}


function route_update_profile(): void
{
    $user = require_login();

    $fields = [];
    $params = [];

    if (field('name') !== null) {
        $name = str_field('name');

        if ($name === '' || mb_strlen($name) > 80) {
            json_error('Please enter a name between 1 and 80 characters.', 422);
        }

        $fields[] = 'name = ?';
        $params[] = $name;
    }

    if (field('username') !== null) {
        $username = normalize_username(str_field('username'));

        if ($username === '' || mb_strlen($username) > 60) {
            json_error('Usernames can only contain letters, numbers and underscores.', 422);
        }

        $taken = db_value(
            'SELECT 1 FROM users WHERE username = ? AND id <> ? LIMIT 1',
            [$username, $user['id']]
        );

        if ($taken) {
            json_error('That username is already taken.', 409);
        }

        $fields[] = 'username = ?';
        $params[] = $username;
    }

    if (field('bio') !== null) {
        $fields[] = 'bio = ?';
        $params[] = mb_substr(str_field('bio'), 0, 300);
    }

    if (field('email') !== null) {
        $email = strtolower(str_field('email'));

        if ($email !== '' && !valid_email($email)) {
            json_error('Please enter a valid email address.', 422);
        }

        $taken = db_value(
            'SELECT 1 FROM users WHERE email = ? AND id <> ? LIMIT 1',
            [$email, $user['id']]
        );

        if ($taken) {
            json_error('That email is already in use.', 409);
        }

        $fields[] = 'email = ?';
        $params[] = $email;
    }

    if (field('contact') !== null) {
        $fields[] = 'contact = ?';
        $params[] = mb_substr(str_field('contact'), 0, 40);
    }

    if (field('dob') !== null) {
        $dob = str_field('dob');

        $fields[] = 'dob = ?';
        $params[] = $dob === '' ? null : $dob;
    }

    if (field('avatar') !== null) {
        $fields[] = 'avatar_url = ?';
        $params[] = str_field('avatar') ?: null;
    }

    if (field('coverImage') !== null) {
        $fields[] = 'cover_url = ?';
        $params[] = str_field('coverImage') ?: null;
    }

    if (!$fields) {
        json_error('Nothing to update.', 422);
    }

    $params[] = $user['id'];

    db_run('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);

    $fresh = db_one('SELECT * FROM users WHERE id = ?', [$user['id']]);

    json_response(['user' => public_user($fresh, true)]);
}


function route_change_password(): void
{
    $user = require_login();

    $current = (string) field('currentPassword', '');
    $new     = (string) field('newPassword', '');

    if (strlen($new) < 8) {
        json_error('Your new password must be at least 8 characters long.', 422);
    }

    if (!password_verify($current, $user['password_hash'])) {
        json_error('Your current password is incorrect.', 403);
    }

    db_run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [password_hash($new, PASSWORD_DEFAULT), $user['id']]
    );

    /* Changing a password should sign out every other device. */
    $raw = $_COOKIE[SESSION_COOKIE] ?? '';

    db_run(
        'DELETE FROM sessions WHERE user_id = ? AND id <> ?',
        [$user['id'], hash('sha256', $raw)]
    );

    json_response(['ok' => true]);
}


function route_delete_account(): void
{
    $user = require_login();

    $password = (string) field('password', '');

    if (!password_verify($password, $user['password_hash'])) {
        json_error('Please enter your password to delete your account.', 403);
    }

    /* Clean up this user's uploaded files before the row
       disappears and takes the paths with it. */
    $paths = db_all(
        'SELECT thumbnail_path, pdf_path FROM blogs WHERE author_id = ?',
        [$user['id']]
    );

    foreach ($paths as $row) {
        delete_upload($row['thumbnail_path'] ?? null);
        delete_upload($row['pdf_path'] ?? null);
    }

    delete_upload($user['avatar_url'] ?? null);
    delete_upload($user['cover_url'] ?? null);

    /* Every other table cascades from users. */
    db_run('DELETE FROM users WHERE id = ?', [$user['id']]);

    end_session();

    json_response(['ok' => true]);
}
