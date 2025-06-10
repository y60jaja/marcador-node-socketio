<?php
require 'get_connect.php'; 
$conn = conectar();

if ($conn === null) {
    header("Location: ../html/index.html?error=db_connection_failed&showLogin=false"); // Si hay error de DB al registrar, muestra registro
    exit();
}

// Asegúrate de que esta parte solo se ejecute si es un POST del formulario de registro
if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $usuario = $_POST['username'] ?? '';
    $contrasena = $_POST['password'] ?? '';
    $correo = $_POST['email'] ?? ''; 

    if (empty($usuario) || empty($contrasena) || empty($correo)) {
        header("Location: ../html/index.html?error=empty_fields&showLogin=false"); // Si falta un campo, muestra registro
        exit();
    }

    $contrasenaHash = password_hash($contrasena, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO usuarios (usuario, correo, contrasena) VALUES (?, ?, ?)");
    if ($stmt === false) {
        header("Location: ../html/index.html?error=db_query_error&showLogin=false"); // Error en la preparación de la query
        exit();
    }
    $stmt->bind_param("sss", $usuario, $correo, $contrasenaHash);

    if ($stmt->execute()) {
        // ÉXITO EN EL REGISTRO: Redirige a index.html con mensaje de éxito y muestra la pestaña de login
        header("Location: ../html/index.html?success=registration&showLogin=true");
        exit;
    } else {
        // ERROR EN EL REGISTRO (ej. usuario ya existe, error de DB al ejecutar)
        // Puedes ser más específico si capturas errores de duplicidad de usuario
        header("Location: ../html/index.html?error=registration_failed&showLogin=false"); // Muestra registro y error
        exit;
    }

    $stmt->close();
}

$conn->close();
?>