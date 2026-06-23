<?php
header('Content-Type: application/json');
session_start();
require_once '../../db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['errore' => 'Non autenticato']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM categories WHERE user_id = ?');
$stmt->execute([$_SESSION['user_id']]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>