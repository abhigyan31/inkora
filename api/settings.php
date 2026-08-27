<?php
/* =========================================================
   INKORA - user settings
========================================================= */

const SETTING_COLUMNS = [
    'profileVisibility'    => 'profile_visibility',
    'emailVisibility'      => 'email_visibility',
    'contactVisibility'    => 'contact_visibility',
    'pushNotifications'    => 'push_notifications',
    'emailNotifications'   => 'email_notifications',
    'commentNotifications' => 'comment_notifications',
    'followNotifications'  => 'follow_notifications',
    'darkMode'             => 'dark_mode',
    'reduceMotion'         => 'reduce_motion',
];


function route_get_settings(): void
{
    $user = require_login();

    $row = db_one('SELECT * FROM user_settings WHERE user_id = ?', [$user['id']]);

    if (!$row) {
        db_run('INSERT INTO user_settings (user_id) VALUES (?)', [$user['id']]);
        $row = db_one('SELECT * FROM user_settings WHERE user_id = ?', [$user['id']]);
    }

    $settings = [];

    foreach (SETTING_COLUMNS as $key => $column) {
        $settings[$key] = (bool) $row[$column];
    }

    json_response(['settings' => $settings]);
}


function route_update_settings(): void
{
    $user = require_login();

    $fields = [];
    $params = [];

    /* Only keys in the whitelist reach the SQL, so a request
       can't set an arbitrary column. */
    foreach (SETTING_COLUMNS as $key => $column) {
        $value = field($key);

        if ($value === null) {
            continue;
        }

        $fields[] = "$column = ?";
        $params[] = $value ? 1 : 0;
    }

    if (!$fields) {
        json_error('Nothing to update.', 422);
    }

    db_run('INSERT IGNORE INTO user_settings (user_id) VALUES (?)', [$user['id']]);

    $params[] = $user['id'];

    db_run(
        'UPDATE user_settings SET ' . implode(', ', $fields) . ' WHERE user_id = ?',
        $params
    );

    route_get_settings();
}
