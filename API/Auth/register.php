<?php

$conn = new mysqli("localhost", "root", "", "todo");

//controllo la connessione
if ($conn->connect_error)
{
    die("Errore di connessione: " . $conn->connect_error);
}

//controllo i dati inseriti
if (!isset($_POST["username"]) || !isset($_POST["password"]))
{
    die("Dati mancanti.");
}

$username = trim($_POST["username"]);
$password = $_POST["password"];

//controllo i campi per evitare che siano vuoti
if ($username == "" || $password == "")
{
    die("Compila tutti i campi.");
}

//verifico se l'username esiste già
$sqlCheck = "SELECT id FROM utenti WHERE username = ?";
$stmtCheck = $conn->prepare($sqlCheck);

if (!$stmtCheck)
{
    die("Errore nella query di controllo.");
}

$stmtCheck->bind_param("s", $username);
$stmtCheck->execute();

$result = $stmtCheck->get_result();

if ($result->num_rows > 0)
{
    die("Username già esistente.");
}

$stmtCheck->close();

//hash della password
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

//inserimento nuovo utente
$sqlInsert = "INSERT INTO utenti(username, password_hash)
              VALUES (?, ?)";

$stmtInsert = $conn->prepare($sqlInsert);

if (!$stmtInsert)
{
    die("Errore nella query di inserimento.");
}

$stmtInsert->bind_param("ss", $username, $passwordHash);

if ($stmtInsert->execute())
{
    echo "Registrazione completata con successo!";
}
else
{
    echo "Errore durante la registrazione.";
}

$stmtInsert->close();
$conn->close();

?>