<?php
// api/submit_rsvp.php — terima RSVP via POST, simpan ke SQLite (PDO).
// Dipanggil dari JS via fetch('/api/submit_rsvp.php', {method:'POST'}).
// Body: application/x-www-form-urlencoded (inpName, h, inpMsg, ts) — juga
// menerima JSON. Field `h` = 'ya'/'tidak'; bila tidak ada, server memindai
// nilai 'ya'/'tidak' di POST agar tak bergantung ejaan atribut `name` radio.
declare(strict_types=1);
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'msg' => 'Method tidak didukung. Gunakan POST.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// dukung x-www-form-urlencoded & JSON body
$payload = $_POST;
if (!$payload) {
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/json') !== false) {
        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);
        $payload = is_array($decoded) ? $decoded : [];
    }
}

$name = trim($payload['inpName'] ?? $payload['n'] ?? '');

// hadir: key 'h' eksplisit, atau scan nilai 'ya'/'tidak' (tahan token)
$hValue = $payload['h'] ?? null;
if ($hValue === null) {
    foreach ($payload as $v) {
        if ($v === 'ya' || $v === 'tidak') { $hValue = $v; break; }
    }
}

$msg = trim($payload['inpMsg'] ?? $payload['t'] ?? '') ?: 'Selamat menempuh hidup baru!';
$ts = (int)($payload['ts'] ?? 0);
if ($ts <= 0) { $ts = (int)round(microtime(true) * 1000); }

// validasi
if (mb_strlen($name) < 2) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'msg' => 'Mohon isi nama Anda terlebih dahulu.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$h = ($hValue === 'ya' || $hValue === true || $hValue === 1) ? 1 : 0;

$stmt = $pdo->prepare('INSERT INTO wishes (n, h, t, ts) VALUES (:n, :h, :t, :ts)');
$stmt->execute([
    ':n'  => $name,
    ':h'  => $h,
    ':t'  => $msg,
    ':ts' => $ts,
]);

http_response_code(201);
echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId(), 'ts' => $ts], JSON_UNESCAPED_UNICODE);
