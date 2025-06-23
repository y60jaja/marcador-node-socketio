<?php
header("Access-Control-Allow-Origin: https://marcador-server.onrender.com"); // Permite CORS si el frontend está en un dominio diferente
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: GET, POST"); // Permite GET y POST
header("Access-Control-Allow-Headers: Content-Type"); // Permite el encabezado Content-Type

include 'get_connect.php';

$conn = conectar();

if ($conn === null) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error de conexión a la base de datos.']);
    exit();
}

// Obtener el ID del marcador de la URL
$marcador_id = $_GET['id'] ?? null;

if (!$marcador_id) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'ID de marcador no proporcionado.']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Leer los datos del marcador
    $stmt = $conn->prepare("SELECT nombre_equipo1, puntuacion_equipo1, nombre_equipo2, puntuacion_equipo2, tiempo_total_segundos, estado_juego FROM marcadores WHERE id = ?");
    if ($stmt === false) {
        error_log("Error al preparar la consulta GET: " . $conn->error);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor.']);
        exit();
    }
    $stmt->bind_param("s", $marcador_id);
    $stmt->execute();
    $resultado = $stmt->get_result();

    if ($fila = $resultado->fetch_assoc()) {
        // Formatear el tiempo para el frontend
        $minutos = floor($fila['tiempo_total_segundos'] / 60);
        $segundos = $fila['tiempo_total_segundos'] % 60;
        $fila['gameTime'] = sprintf('%02d:%02d', $minutos, $segundos);
        
        // Renombrar campos para que coincidan con tu frontend si es necesario
        $response_data = [
            'team1Name' => $fila['nombre_equipo1'],
            'score1' => $fila['puntuacion_equipo1'],
            'team2Name' => $fila['nombre_equipo2'],
            'score2' => $fila['puntuacion_equipo2'],
            'totalSeconds' => $fila['tiempo_total_segundos'],
            'gameTime' => $fila['gameTime'],
            'gameStatus' => $fila['estado_juego']
        ];
        echo json_encode($response_data);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(['status' => 'error', 'message' => 'Marcador no encontrado.']);
    }
    $stmt->close();

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Actualizar los datos del marcador
    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE || empty($input)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Datos JSON inválidos.']);
        exit();
    }

    // Validar y sanear los datos recibidos
    $nombre_equipo1 = $input['team1Name'] ?? null;
    $puntuacion_equipo1 = $input['score1'] ?? null;
    $nombre_equipo2 = $input['team2Name'] ?? null;
    $puntuacion_equipo2 = $input['score2'] ?? null;
    $tiempo_total_segundos = $input['totalSeconds'] ?? null;
    $estado_juego = $input['gameStatus'] ?? null;

    // Puedes añadir más validaciones aquí
    if (!isset($nombre_equipo1, $puntuacion_equipo1, $nombre_equipo2, $puntuacion_equipo2, $tiempo_total_segundos, $estado_juego)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Faltan datos requeridos para la actualización.']);
        exit();
    }

    $stmt = $conn->prepare("UPDATE marcadores SET nombre_equipo1 = ?, puntuacion_equipo1 = ?, nombre_equipo2 = ?, puntuacion_equipo2 = ?, tiempo_total_segundos = ?, estado_juego = ? WHERE id = ?");
    if ($stmt === false) {
        error_log("Error al preparar la consulta UPDATE: " . $conn->error);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error interno del servidor.']);
        exit();
    }
    $stmt->bind_param("siisiis", $nombre_equipo1, $puntuacion_equipo1, $nombre_equipo2, $puntuacion_equipo2, $tiempo_total_segundos, $estado_juego, $marcador_id);

    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['status' => 'success', 'message' => 'Marcador actualizado.']);
        } else {
            http_response_code(404); // Not Found si no se afectaron filas (ID no existe)
            echo json_encode(['status' => 'error', 'message' => 'Marcador no encontrado o no se realizaron cambios.']);
        }
    } else {
        error_log("Error al ejecutar la actualización del marcador: " . $stmt->error);
        http_response_code(500);
        echo json_encode(['status' => 'error', 'message' => 'Error al actualizar el marcador.']);
    }
    $stmt->close();

} else {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido.']);
}

$conn->close();
?>