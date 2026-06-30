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
$ids = $data['ids'] ?? null;

// Supporta sia { "ids": [...] } che { "id": ... } per comodità
if ($ids === null && isset($data['id'])) {
    $ids = [$data['id']];
}

if (empty($ids) || !is_array($ids)) {
    http_response_code(400);
    echo json_encode(['errore' => 'Nessun ID fornito']);
    exit;
}

$ids = array_values(array_filter($ids, 'is_numeric'));

if (empty($ids)) {
    http_response_code(400);
    echo json_encode(['errore' => 'Nessun ID valido fornito']);
    exit;
}

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$params = array_merge($ids, [$_SESSION['user_id']]);

// Rimuove la riga di condivisione solo se la task è effettivamente condivisa con l'utente loggato.
// Non tocca la tabella "tasks": la task originale resta intatta per il proprietario.
$stmt = $pdo->prepare("DELETE FROM shared_tasks WHERE task_id IN ($placeholders) AND shared_with=?");
$stmt->execute($params);

echo json_encode(['messaggio' => 'Task condivisa rimossa', 'rimosse' => $stmt->rowCount()]);
?>