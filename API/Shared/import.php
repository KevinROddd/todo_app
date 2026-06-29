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

if (!$task_id) {
    http_response_code(400);
    echo json_encode(['errore' => 'task_id obbligatorio']);
    exit;
}

// Verifica che la task sia davvero condivisa con me
$stmt = $pdo->prepare('
    SELECT t.* FROM shared_tasks st
    JOIN tasks t ON st.task_id = t.id
    WHERE st.task_id = ? AND st.shared_with = ?
');
$stmt->execute([$task_id, $_SESSION['user_id']]);
$task = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$task) {
    http_response_code(403);
    echo json_encode(['errore' => 'Task non trovata o non condivisa con te']);
    exit;
}

// Crea una copia nelle mie task (category_id non copiato: appartiene all'altro utente)
$stmt = $pdo->prepare('INSERT INTO tasks (user_id, category_id, titolo, descrizione, priorita, scadenza) VALUES (?, NULL, ?, ?, ?, ?)');
$stmt->execute([
    $_SESSION['user_id'],
    $task['titolo'],
    $task['descrizione'],
    $task['priorita'],
    $task['scadenza']
]);

echo json_encode(['messaggio' => 'Task importata nella tua lista', 'id' => $pdo->lastInsertId()]);
?>