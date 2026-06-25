<?php
header('Content-Type: application/json');
session_start();
require_once '../../db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['errore' => 'Non autenticato, procedere con l'autenticazione']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = $data['id'] ?? null;

if (!$id) {
    http_response_code(400);
    echo json_encode(['errore' => 'ID obbligatorio']);
    exit;
}

$stmt = $pdo->prepare('UPDATE tasks SET completato = NOT completato WHERE id=? AND user_id=?');
$stmt->execute([$id, $_SESSION['user_id']]);

echo json_encode(['messaggio' => 'Stato aggiornato']);
?>