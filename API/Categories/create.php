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
$nome = trim($data['nome'] ?? '');
$colore = $data['colore'] ?? '#000000';

if (!$nome) {
    http_response_code(400);
    echo json_encode(['errore' => 'Il nome è obbligatorio']);
    exit;
}

$stmt = $pdo->prepare('INSERT INTO categories (user_id, nome, colore) VALUES (?, ?, ?)');
$stmt->execute([$_SESSION['user_id'], $nome, $colore]);

http_response_code(201);
echo json_encode(['messaggio' => 'Categoria creata', 'id' => $pdo->lastInsertId()]);
?>