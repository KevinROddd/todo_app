<?php
header('Content-Type: application/json');
session_start();
require_once '../../db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['errore' => 'Non autenticato']);
    exit;
}

$stmt = $pdo->prepare('
    SELECT t.*, u.nome AS condiviso_da
    FROM shared_tasks st
    JOIN tasks t ON st.task_id = t.id
    JOIN users u ON st.shared_by = u.id
    WHERE st.shared_with = ?
');
$stmt->execute([$_SESSION['user_id']]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
?>  