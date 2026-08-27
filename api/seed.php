<?php
/* =========================================================
   INKORA - seed script

   Puts a demo account and a few sample blogs into an empty
   database so the site isn't a blank page on the first
   visit.

   Run it once by opening:
     https://yourdomain.com/api/seed.php

   It refuses to run if there are already users, so it can't
   be used to overwrite a live site.

   DELETE THIS FILE once you've run it.
========================================================= */

declare(strict_types=1);

require __DIR__ . '/helpers.php';
require __DIR__ . '/db.php';

header('Content-Type: text/plain; charset=utf-8');

$existing = (int) db_value('SELECT COUNT(*) FROM users');

if ($existing > 0) {
    http_response_code(409);

    echo "There are already $existing accounts in this database.\n";
    echo "Seeding is only for an empty install, so nothing was changed.\n";
    echo "Delete api/seed.php now.\n";
    exit;
}

$writers = [
    [
        'name'   => 'Alex Kumar',
        'handle' => '@alexwrites',
        'email'  => 'alex@inkora.app',
        'pass'   => 'inkora123',
        'bio'    => 'Writing about technology, life, and everything in between.',
        'avatar' => 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85',
        'cover'  => 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=90',
    ],
    [
        'name'   => 'Sarah Johnson',
        'handle' => '@sarahj',
        'email'  => 'sarah@inkora.app',
        'pass'   => 'inkora123',
        'bio'    => 'Slow living, small moments, and the occasional strong opinion about coffee.',
        'avatar' => 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85',
        'cover'  => '',
    ],
    [
        'name'   => 'Rahul Sharma',
        'handle' => '@rahulthoughts',
        'email'  => 'rahul@inkora.app',
        'pass'   => 'inkora123',
        'bio'    => 'Learning to build things. Writing down what I get wrong.',
        'avatar' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=85',
        'cover'  => '',
    ],
    [
        'name'   => 'Maya Patel',
        'handle' => '@mayawrites',
        'email'  => 'maya@inkora.app',
        'pass'   => 'inkora123',
        'bio'    => 'Mountains, long drives, and stories from the road.',
        'avatar' => 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=85',
        'cover'  => '',
    ],
];

$blogs = [
    [
        'author'      => '@alexwrites',
        'title'       => 'The Things College Taught Me',
        'description' => 'A personal reflection on growth, failure, friendship, and finding your own direction.',
        'category'    => 'Technology',
        'tags'        => ['college', 'growth', 'student life'],
        'read_time'   => '6 min read',
        'image'       => 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=1200&q=85',
    ],
    [
        'author'      => '@sarahj',
        'title'       => 'Finding Peace in Small Moments',
        'description' => "Sometimes happiness is not a destination. It's a series of tiny, beautiful moments.",
        'category'    => 'Life',
        'tags'        => ['mindfulness', 'slow living'],
        'read_time'   => '4 min read',
        'image'       => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
    ],
    [
        'author'      => '@rahulthoughts',
        'title'       => 'My Journey Into Programming',
        'description' => 'How I went from knowing nothing about programming to building my first real application.',
        'category'    => 'Programming',
        'tags'        => ['programming', 'beginners', 'javascript'],
        'read_time'   => '8 min read',
        'image'       => 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=85',
    ],
    [
        'author'      => '@mayawrites',
        'title'       => 'A Weekend in the Mountains',
        'description' => 'Sometimes the best way to reset your mind is to step away from everything familiar.',
        'category'    => 'Travel',
        'tags'        => ['travel', 'mountains'],
        'read_time'   => '5 min read',
        'image'       => 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85',
    ],
    [
        'author'      => '@alexwrites',
        'title'       => 'Building My First Web App',
        'description' => 'What I learned while building my first full-stack application from scratch.',
        'category'    => 'Technology',
        'tags'        => ['web development', 'react', 'projects'],
        'read_time'   => '6 min read',
        'image'       => 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85',
    ],
];

db()->beginTransaction();

try {
    $ids = [];

    foreach ($writers as $writer) {
        $id = uuid();
        $ids[$writer['handle']] = $id;

        db_run(
            'INSERT INTO users (id, name, username, email, password_hash, bio, avatar_url, cover_url)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id,
                $writer['name'],
                $writer['handle'],
                $writer['email'],
                password_hash($writer['pass'], PASSWORD_DEFAULT),
                $writer['bio'],
                $writer['avatar'] ?: null,
                $writer['cover'] ?: null,
            ]
        );

        db_run('INSERT INTO user_settings (user_id) VALUES (?)', [$id]);
    }

    $days = count($blogs);

    foreach ($blogs as $index => $blog) {
        $blog_id = uuid();

        db_run(
            'INSERT INTO blogs
               (id, author_id, title, description, category,
                thumbnail_path, read_time, published_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(UTC_TIMESTAMP(), INTERVAL ? DAY))',
            [
                $blog_id,
                $ids[$blog['author']],
                $blog['title'],
                $blog['description'],
                $blog['category'],
                $blog['image'],
                $blog['read_time'],
                $days - $index,
            ]
        );

        foreach ($blog['tags'] as $tag) {
            db_run(
                'INSERT IGNORE INTO blog_tags (blog_id, tag) VALUES (?, ?)',
                [$blog_id, strtolower($tag)]
            );
        }
    }

    db()->commit();
} catch (Throwable $e) {
    db()->rollBack();

    http_response_code(500);
    echo "Seeding failed: " . $e->getMessage() . "\n";
    exit;
}

echo "INKORA seeded.\n\n";
echo "Accounts created: " . count($writers) . "\n";
echo "Blogs created:    " . count($blogs) . "\n\n";
echo "Log in with:\n";
echo "  alex@inkora.app\n";
echo "  inkora123\n\n";
echo "IMPORTANT: delete api/seed.php now, and change that password.\n";
