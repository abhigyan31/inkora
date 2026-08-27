<?php
/* =========================================================
   INKORA - database connection

   One PDO handle, created on first use.

   'host' in config.php can be a single string or a list. If
   it's a list, each is tried in order and the first that
   connects wins. Hostinger uses 'localhost' on most plans
   but a remote hostname on some, and this saves guessing.

   ERRMODE_EXCEPTION so a failed query throws instead of
   silently returning false. Emulated prepares are off so
   real prepared statements go to MySQL.
========================================================= */

/* Filled in when every host fails, so /api/health and
   dbcheck.php can explain what actually happened. */
$GLOBALS['inkora_db_errors'] = [];

function db_host_candidates(): array
{
    $host = config()['db']['host'] ?? 'localhost';

    return is_array($host) ? $host : [$host];
}

function db_try_connect(string $host, array $config): array
{
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=%s',
        $host,
        $config['name'],
        $config['charset'] ?? 'utf8mb4'
    );

    try {
        $pdo = new PDO($dsn, $config['user'], $config['password'], [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_STRINGIFY_FETCHES  => false,
            PDO::ATTR_TIMEOUT            => 5,
        ]);

        $pdo->exec("SET time_zone = '+00:00'");

        return ['pdo' => $pdo, 'error' => null];
    } catch (PDOException $e) {
        return ['pdo' => null, 'error' => $e->getMessage()];
    }
}

/* Turns MySQL's message into something a human can act on. */
function db_explain(string $message): string
{
    if (stripos($message, 'Access denied') !== false) {
        return 'The username or password is wrong, OR the user is not attached to this database. '
             . 'In hPanel > Databases > MySQL Databases, check the user listed next to the database.';
    }

    if (stripos($message, 'Unknown database') !== false) {
        return 'That database name does not exist. Copy it exactly from hPanel, including the u000000000_ prefix.';
    }

    if (stripos($message, 'getaddrinfo') !== false
        || stripos($message, 'No such host') !== false
        || stripos($message, "Can't connect") !== false
        || stripos($message, 'Connection refused') !== false) {
        return 'The database host is wrong. Find the hostname in hPanel > Databases > MySQL Databases '
             . 'and put it in api/config.php.';
    }

    return 'Unrecognised database error. The raw message above is the thing to search for.';
}

function db(): PDO
{
    static $pdo = null;

    if ($pdo !== null) {
        return $pdo;
    }

    $config = config()['db'];
    $errors = [];

    foreach (db_host_candidates() as $host) {
        $attempt = db_try_connect($host, $config);

        if ($attempt['pdo'] !== null) {
            return $pdo = $attempt['pdo'];
        }

        $errors[$host] = $attempt['error'];
        error_log("INKORA: database host '$host' failed: " . $attempt['error']);
    }

    $GLOBALS['inkora_db_errors'] = $errors;

    $first = reset($errors) ?: 'unknown error';

    json_error(
        'Could not reach the database. Open /api/dbcheck.php for a diagnosis.',
        500,
        (config()['debug'] ?? false)
            ? ['tried' => $errors, 'likely' => db_explain((string) $first)]
            : []
    );
}

/* Small helpers so the routes read less like SQL plumbing. */

function db_all(string $sql, array $params = []): array
{
    $statement = db()->prepare($sql);
    $statement->execute($params);

    return $statement->fetchAll();
}

function db_one(string $sql, array $params = []): ?array
{
    $statement = db()->prepare($sql);
    $statement->execute($params);

    $row = $statement->fetch();

    return $row ?: null;
}

function db_value(string $sql, array $params = [])
{
    $statement = db()->prepare($sql);
    $statement->execute($params);

    return $statement->fetchColumn();
}

function db_run(string $sql, array $params = []): int
{
    $statement = db()->prepare($sql);
    $statement->execute($params);

    return $statement->rowCount();
}
