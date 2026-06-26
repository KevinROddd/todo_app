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

$id = $data['id'] ?? null;
$titolo = trim($data['titolo'] ?? '');
$descrizione = $data['descrizione'] ?? '';
$priorita = $data['priorita'] ?? 'media';
$scadenza = $data['scadenza'] ?? null;
$category_id = $data['category_id'] ?? null;

if (!$id || !$titolo) {
    http_response_code(400);
    echo json_encode(['errore' => 'ID e titolo obbligatori']);
    exit;
}

$stmt = $pdo->prepare('UPDATE tasks SET titolo=?, descrizione=?, priorita=?, scadenza=?, category_id=? WHERE id=? AND user_id=?');
$stmt->execute([$titolo, $descrizione, $priorita, $scadenza, $category_id, $id, $_SESSION['user_id']]);

echo json_encode(['messaggio' => 'Task aggiornata']);
?>  