<?php
$host = 'mysql-todolist-todolist2.h.aivencloud.com';
$port = '22554';
$dbname = 'defaultdb';
$username = 'avnadmin';
$password = 'AVNS_fJg6W3fltaJI18MDcIR';

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8";
    $options = array(
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    );
    $pdo = new PDO($dsn, $username, $password, $options);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array('errore' => 'Connessione fallita: ' . $e->getMessage()));
    exit;
}
?>