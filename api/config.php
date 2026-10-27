<?php
// api/config.php — bootstrap koneksi SQLite via PDO.
// SATU-satunya sumber kebenaran database. Dipakai oleh endpoint /api/*.
//
// Catatan: path ke data/wishes.db dihitung relatif ke repo root (dirname dari
// api/), jadi aman baik run via `php -S -t .` maupun server produksi yang
// mengarahkan docroot ke repo root.
declare(strict_types=1);

define('DB_FILE', dirname(__DIR__) . '/data/wishes.db');

// pastikan direktori data/ ada (dibuat runtime bila belum)
$dataDir = dirname(DB_FILE);
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

try {
    $pdo = new PDO('sqlite:' . DB_FILE);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    // skema: mirror persis model localStorage ar-wishes { n, h, t, ts }.
    // id PK autoincrement ditambah hanya sebagai primary key wajib SQLite
    // (bukan perubahan semantik data — "jangan ubah skema database").
    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS wishes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            n  TEXT    NOT NULL,
            h  INTEGER NOT NULL,
            t  TEXT    NOT NULL,
            ts INTEGER NOT NULL
        )
SQL);
} catch (PDOException $e) {
    // jangan bocorkan path internal ke klien
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'msg' => 'Database tidak tersedia.']);
    exit;
}
