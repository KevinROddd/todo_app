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
$email_destinatario = trim($data['email'] ?? '');

if (empty($ids) || !is_array($ids)) {
    http_response_code(400);
    echo json_encode(['errore' => 'Nessun ID fornito']);
    exit;
}

if (!$email_destinatario) {
    http_response_code(400);
    echo json_encode(['errore' => 'Email obbligatoria']);
    exit;
}

// Trova il destinatario
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email_destinatario]);
$destinatario = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$destinatario) {
    http_response_code(404);
    echo json_encode(['errore' => 'Utente non trovato']);
    exit;
}

if ($destinatario['id'] == $_SESSION['user_id']) {
    http_response_code(400);
    echo json_encode(['errore' => 'Non puoi condividere con te stesso']);
    exit;
}

// Filtra solo ID numerici e verifica che appartengano all'utente
$ids = array_filter($ids, 'is_numeric');
$placeholders = implode(',', array_fill(0, count($ids), '?'));
$params = array_merge(array_values($ids), [$_SESSION['user_id']]);

$stmt = $pdo->prepare("SELECT id FROM tasks WHERE id IN ($placeholders) AND user_id=?");
$stmt->execute($params);
$tasksValide = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($tasksValide)) {
    http_response_code(400);
    echo json_encode(['errore' => 'Nessuna task valida da condividere']);
    exit;
}

$condivise = 0;
$stmt = $pdo->prepare('INSERT IGNORE INTO shared_tasks (task_id, shared_by, shared_with) VALUES (?, ?, ?)');
foreach ($tasksValide as $task) {
    $stmt->execute([$task['id'], $_SESSION['user_id'], $destinatario['id']]);
    $condivise++;
}

echo json_encode(['messaggio' => "$condivise task condivise con successo"]);
?>