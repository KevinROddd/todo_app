<?php
header('Content-Type: application/json');
session_start();
require_once '../../db.php';

$data = json_decode(file_get_contents('php://input'), true);

$email = trim($data['email'] ?? '');
$password = $data['password'] ?? '';

if (!$email || !$password) {
    http_response_code(400);
    echo json_encode(['errore' => 'Email e password obbligatori']);
    exit;
}

$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['errore' => 'Credenziali non valide']);
    exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['nome'] = $user['nome'];

echo json_encode([
    'messaggio' => 'Login effettuato',
    'utente' => [
        'id' => $user['id'],
        'nome' => $user['nome'],
        'email' => $user['email']
    ]
]);
?>