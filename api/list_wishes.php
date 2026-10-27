<?php
// api/list_wishes.php — kirimkan daftar ucapan terbaru sebagai JSON.
// Urutan: terbaru dulu (ORDER BY ts DESC, id DESC), max 200.
// Model output mencerminkan localStorage ar-wishes: { n, h(boolean), t, ts }.
declare(strict_types=1);
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

try {
    $stmt = $pdo->query('SELECT n, h, t, ts FROM wishes ORDER BY ts DESC, id DESC LIMIT 200');
    $rows = $stmt->fetchAll();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'msg' => 'Database tidak tersedia.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$out = array_map(function ($r) {
    return [
        'n'  => $r['n'],
        'h'  => (bool)$r['h'],
        't'  => $r['t'],
        'ts' => (int)$r['ts'],
    ];
}, $rows);

echo json_encode($out, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);