<?php

function conectar() {

    $host = "localhost";
    $user = "cflqcl_ucsh";
    $pass = "ucsh2025.";
    $db = "cflqcl_ucsh";

    $conn = new mysqli($host, $user, $pass, $db);

    if ($conn->connect_error) {
        die("ConexiÃ³n fallida: " . $conn->connect_error);
    }

    return $conn;

}
?>