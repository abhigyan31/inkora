<?php
/* =========================================================
   INKORA - file uploads

   POST /api/uploads with multipart form-data:
     file = the file
     kind = "image" | "pdf"

   Returns { path: "/uploads/2026/08/<uuid>.jpg" }, which is
   what gets stored on the blog row.

   The filename is always generated here. Trusting the name
   the browser sends is how you end up with someone
   uploading "shell.php" or "../../index.html".
========================================================= */

const UPLOAD_TYPES = [
    'image' => [
        'mimes'  => [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/gif'  => 'gif',
        ],
        'max_bytes' => 5 * 1024 * 1024,
    ],
    'pdf' => [
        'mimes' => [
            'application/pdf' => 'pdf',
        ],
        'max_bytes' => 20 * 1024 * 1024,
    ],
];


function route_upload(): void
{
    $user = require_login();

    $kind = $_POST['kind'] ?? 'image';

    if (!isset(UPLOAD_TYPES[$kind])) {
        json_error('Unknown upload type.', 422);
    }

    $rules = UPLOAD_TYPES[$kind];

    if (!isset($_FILES['file'])) {
        json_error('No file was uploaded.', 422);
    }

    $file = $_FILES['file'];

    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        json_error(upload_error_message((int) $file['error']), 422);
    }

    if ($file['size'] <= 0) {
        json_error('That file is empty.', 422);
    }

    if ($file['size'] > $rules['max_bytes']) {
        json_error(
            'That file is too large. The limit is '
            . round($rules['max_bytes'] / 1024 / 1024) . ' MB.',
            413
        );
    }

    /* is_uploaded_file confirms PHP actually received this
       through an upload, not that someone pointed tmp_name
       at a file already on the server. */
    if (!is_uploaded_file($file['tmp_name'])) {
        json_error('That upload is not valid.', 422);
    }

    /* Read the real type from the file's contents. The
       Content-Type the browser sends is just a claim. */
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);

    if (!isset($rules['mimes'][$mime])) {
        json_error(
            'That file type is not allowed here. Allowed: '
            . implode(', ', array_keys($rules['mimes'])),
            422
        );
    }

    $extension = $rules['mimes'][$mime];

    /* Split into year/month folders so one directory doesn't
       end up with fifty thousand files in it. */
    $relative_dir = '/' . gmdate('Y') . '/' . gmdate('m');

    $base_dir = config()['uploads_dir'] ?? __DIR__ . '/../uploads';
    $base_url = config()['uploads_url'] ?? '/uploads';

    $target_dir = $base_dir . $relative_dir;

    if (!is_dir($target_dir) && !mkdir($target_dir, 0755, true) && !is_dir($target_dir)) {
        json_error('Could not create the uploads folder. Check permissions on /uploads.', 500);
    }

    $filename = uuid() . '.' . $extension;
    $target   = $target_dir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $target)) {
        json_error('Could not save that file.', 500);
    }

    /* Never executable, whatever the extension says. */
    @chmod($target, 0644);

    json_response([
        'path' => $base_url . $relative_dir . '/' . $filename,
        'name' => mb_substr((string) ($file['name'] ?? ''), 0, 255),
        'size' => (int) $file['size'],
        'type' => $mime,
    ], 201);
}


function upload_error_message(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE =>
            'That file is larger than the server allows. Check upload_max_filesize in hPanel.',
        UPLOAD_ERR_PARTIAL   => 'The upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_FILE   => 'No file was uploaded.',
        UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE =>
            'The server could not write the file.',
        UPLOAD_ERR_EXTENSION => 'A PHP extension blocked the upload.',
        default              => 'The upload failed.',
    };
}
