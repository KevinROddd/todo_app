<?php
header('Content-Type: application/json');
require_once '../../db.php';

$data = json_decode(file_get_contents('php://input'), true);

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';

//verifico la validità dei campi
if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['errore' => 'Compilare tutti i campi obbligatori']);
    exit;
}

//controllo che l'username sia abbastanza lungo
if (strlen($username) < 3) {
    http_response_code(400);
    echo json_encode(['errore' => 'Il nome utente deve essere lungo almeno 3 caratteri']);
    exit;
}

//controllo che la password sia abbastanza lunga
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['errore' => 'La password deve essere lunga almeno 6 caratteri']);
    exit;
}

//controllo se l'username esista già
$stmt = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(['errore' => 'Nome utente già esistente']);
    exit;
}

//hash della password e inserimento
$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
$stmt->execute([$username, $hash]);

http_response_code(201);
echo json_encode(['messaggio' => 'Utente registrato con successo']);
?>