<?php
header('Content-Type: application/json');
require_once '../../db.php';

$data = json_decode(file_get_contents('php://input'), true);

$nome = trim($data['nome'] ?? '');
$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$nome || !$email || !$password) {
    http_response_code(400);
    echo json_encode(['errore' => 'Tutti i campi sono obbligatori']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['errore' => 'Email non valida']);
    exit;
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['errore' => 'La password deve essere di almeno 6 caratteri']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['errore' => 'Email già registrata']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (nome, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$nome, $email, $hash]);

http_response_code(201);
echo json_encode(['messaggio' => 'Utente registrato con successo']);
?>