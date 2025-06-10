<?php
function conectar() {
    $host = "localhost";
    $usuario = "root";
    $clave = "1324"; // o tu contraseña
    $bd = "pagweb";

    $conn = new mysqli($host, $usuario, $clave, $bd);

    if ($conn->connect_error) {
        // Puedes imprimir el error o devolver null
        die("Error de conexión: " . $conn->connect_error);
    }

    return $conn;
}
?>
