<?php
header('Content-Type: application/json');
session_start();

if (session_status() === PHP_SESSION_ACTIVE) {
    session_unset();    
    session_destroy();  
    echo json_encode([
        'successo' => true,
        'messaggio' => 'Disconnessione avvenuta con successo.'
    ]);
} else {
    echo json_encode([
        'successo' => false,
        'messaggio' => 'Nessuna sessione attiva.'
    ]);
}
?>