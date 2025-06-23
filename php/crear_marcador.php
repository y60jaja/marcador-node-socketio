<?php
// require 'get_connect.php'; // Asegúrate de tener tu función de conexión
include 'get_connect.php'; // Cambiado a include para que no detenga el script si falla la conexión

function generarUUID() {
    // Genera un UUID v4 simple (no criptográficamente seguro, pero suficiente para este caso)
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

$conn = conectar();

if ($conn === null) {
    // Manejo de error de conexión a la base de datos
    header("Location: ../html/error.html?msg=db_connection_failed");
    exit();
}

// Genera un nuevo UUID para el marcador
$nuevo_marcador_id = generarUUID();

// Valores iniciales para el nuevo marcador
$nombre_equipo1 = 'Equipo Local';
$puntuacion_equipo1 = 0;
$nombre_equipo2 = 'Equipo Visitante';
$puntuacion_equipo2 = 0;
$tiempo_total_segundos = 0;
$estado_juego = 'Primer Tiempo';

// Inserta el nuevo marcador en la base de datos
$stmt = $conn->prepare("INSERT INTO marcadores (id, nombre_equipo1, puntuacion_equipo1, nombre_equipo2, puntuacion_equipo2, tiempo_total_segundos, estado_juego) VALUES (?, ?, ?, ?, ?, ?, ?)");

if ($stmt === false) {
    error_log("Error al preparar la consulta de inserción: " . $conn->error);
    header("Location: ../html/error.html?msg=db_insert_prep_error");
    exit();
}

$stmt->bind_param("ssiissi", $nuevo_marcador_id, $nombre_equipo1, $puntuacion_equipo1, $nombre_equipo2, $puntuacion_equipo2, $tiempo_total_segundos, $estado_juego);

if ($stmt->execute()) {
    // Redirige al usuario a la página del marcador con el ID único
    // Asumiendo que tu entrada.html es ahora el panel de control del marcador
    // **IMPORTANTE**: Ajusta la URL base (http://localhost:3000 o tu dominio de Render/Node.js)
    header("Location: http://localhost:1000/entrada.html?id=" . $nuevo_marcador_id);
    exit();
} else {
    error_log("Error al ejecutar la inserción del marcador: " . $stmt->error);
    header("Location: ../html/error.html?msg=db_insert_exec_error");
    exit();
}

$stmt->close();
$conn->close();
?>