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
$ids = $data['ids'] ?? [];

if (empty($ids) || !is_array($ids)) {
    http_response_code(400);
    echo json_encode(['errore' => 'Nessun ID fornito']);
    exit;
}

// Filtra solo valori numerici per sicurezza
$ids = array_filter($ids, 'is_numeric');
$placeholders = implode(',', array_fill(0, count($ids), '?'));

$params = array_merge(array_values($ids), [$_SESSION['user_id']]);
$stmt = $pdo->prepare("DELETE FROM tasks WHERE id IN ($placeholders) AND user_id=?");
$stmt->execute($params);

echo json_encode(['messaggio' => 'Task eliminate']);
?>