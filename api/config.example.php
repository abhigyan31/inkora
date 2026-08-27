<?php
/* =========================================================
   INKORA - database config

   Copy this file to config.php and fill in your details.
   config.php is gitignored so the password never ends up
   on GitHub.

   Get these from hPanel > Databases > MySQL Databases.
   Hostinger prefixes everything, so the names look like
   u123456789_inkora and u123456789_admin.
========================================================= */

return [
    'db' => [
        /* Tried in order, first that connects wins. */
        'host'     => ['localhost', '127.0.0.1'],
        'name'     => 'u000000000_inkora',
        'user'     => 'u000000000_inkora',
        'password' => 'CHANGE_ME',
        'charset'  => 'utf8mb4',
    ],

    /* Where uploaded thumbnails and PDFs go, relative to the
       api/ folder. Must be inside public_html so the browser
       can load them. */
    'uploads_dir' => __DIR__ . '/../uploads',
    'uploads_url' => '/uploads',

    /* How long a login lasts. */
    'session_days' => 30,

    /* Set to false once the site is live - it stops PHP
       errors being shown to visitors. */
    'debug' => false,
];
