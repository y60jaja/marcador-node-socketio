<?php
require 'get_connect.php'; 

$conn = conectar();

if ($conn === null) {
    header("Location: ../html/index.html?error=db_connection_failed&showLogin=true");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $usuario = $_POST['username'] ?? '';
    $contrasena = $_POST['password'] ?? '';

    if (empty($usuario) || empty($contrasena)) {
        header("Location: ../html/index.html?error=empty_fields&showLogin=true");
        exit();
    }

    $stmt = $conn->prepare("SELECT contrasena FROM usuarios WHERE usuario = ?");
    if ($stmt === false) {
        header("Location: ../html/index.html?error=db_query_error&showLogin=true");
        exit();
    }

    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($resultado->num_rows === 1) {
        $fila = $resultado->fetch_assoc();

        if (password_verify($contrasena, $fila['contrasena'])) {
            // ÉXITO: Redirige a Node.js
            header("Location: http://localhost:3000/entrada.html");
            exit();
        } else {
            // ERROR DE CONTRASEÑA: Muestra login y error
            header("Location: ../html/index.html?error=invalid_credentials&showLogin=true");
            exit();
        }
    } else {
        // ERROR USUARIO NO ENCONTRADO: Muestra login y error
        header("Location: ../html/index.html?error=invalid_credentials&showLogin=true");
        exit();
    }

    $stmt->close();
} 

$conn->close();
?>
