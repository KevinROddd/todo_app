<?php
$host = 'mysql-todolist-todolist2.h.aivencloud.com';
$port = '22554';
$dbname = 'defaultdb';
$username = 'avnadmin';
$password = 'AVNS_fJg6W3fltaJI18MDcIR';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8",
        $username,
        $password,
        [
            PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
        ]
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDO::Exception $e) {
    http_response_code(500);
    echo json_encode(['errore' => 'Connessione fallita: ' . $e->getMessage()]);
    exit;
}
?>