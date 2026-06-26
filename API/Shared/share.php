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
$task_id = $data['task_id'] ?? null;
$email_destinatario = trim($data['email'] ?? '');

if (!$task_id || !$email_destinatario) {
    http_response_code(400);
    echo json_encode(['errore' => 'task_id e email obbligatori']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM tasks WHERE id=? AND user_id=?');
$stmt->execute([$task_id, $_SESSION['user_id']]);
if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode(['errore' => 'Task non trovata']);
    exit;
}   

$stmt = $pdo->prepare('SELECT id FROM users WHERE email=?');
$stmt->execute([$email_destinatario]);
$destinatario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$destinatario) {
    http_response_code(404);
    echo json_encode(['errore' => 'Utente non trovato']);
    exit;
}

if ($destinatario['id'] === $_SESSION['user_id']) {
    http_response_code(400);
    echo json_encode(['errore' => 'Non puoi condividere con te stesso']);
    exit;
}

$stmt = $pdo->prepare('INSERT IGNORE INTO shared_tasks (task_id, shared_by, shared_with) VALUES (?, ?, ?)');
$stmt->execute([$task_id, $_SESSION['user_id'], $destinatario['id']]);

echo json_encode(['messaggio' => 'Task condivisa con successo']);
?>