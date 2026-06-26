<?php
header('Content-Type: application/json');
session_start();
require_once '../../db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['errore' => 'Non autenticato']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$titolo = trim($data['titolo'] ?? '');
$descrizione = $data['descrizione'] ?? '';
$priorita = $data['priorita'] ?? 'media';
$scadenza = $data['scadenza'] ?? null;
$category_id = $data['category_id'] ?? null;

if (!$titolo) {
    http_response_code(400);
    echo json_encode(['errore' => 'Il titolo è obbligatorio']);
    exit;
}

if (!in_array($priorita, ['bassa', 'media', 'alta'])) {
    http_response_code(400);
    echo json_encode(['errore' => 'Priorità non valida']);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO tasks (user_id, category_id, titolo, descrizione, priorita, scadenza) VALUES (?, ?, ?, ?, ?, ?)');
$stmt->execute([$_SESSION['user_id'], $category_id, $titolo, $descrizione, $priorita, $scadenza]);

http_response_code(201);
echo json_encode(['messaggio' => 'Task creata', 'id' => $pdo->lastInsertId()]);
?>