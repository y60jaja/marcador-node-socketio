<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (empty($_POST["user"])) {
        echo "Todos los campos son requeridos.";
        exit();
    }
    $nombres = $_POST["nombre"];
} else {
    echo "No se recibieron datos.";
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seleccionar Deporte</title>
    <!-- ¡IMPORTANTE! Asegúrate que '/CSS/' tenga la misma capitalización que tu carpeta en GitHub -->
    <link rel="stylesheet" href="../css/style_ent.css">
</head>
<body>
    <!-- NAV-BAR -->
    <nav class="navbar">
        <!-- Logo a la izquierda -->
        <div class="logo-container">
            <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
            <img src="/Img/logo.png" alt="Logo" class="logo-img">
        </div>
        
        <!-- Texto en el centro -->
        <div class="texto-centro">
            <h1>ScoreXtreme</h1>
            <p>⚽️ 🏀 Tu marcador deportivo 🏐 🏈</p>
        </div>
        
        <!-- Botón home a la derecha CON FONDO BLANCO -->
        <div class="home-btn-container">
            <a href="entrada.html" class="home-btn">
                <div class="home-btn-background">
                    <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                    <img src="/Img/home.png" alt="Inicio" class="home-img">
                </div>
            </a>
        </div>
    </nav>

    <main class="contenido-principal">

        <div class="Titulo">
            <h2 class="titulo-seleccion">Selecciona el deporte</h2>
            <p class="subtitulo">Elige el deporte para el que necesitas un marcador</p>
        </div>
    
        <div class="contenedor-deportes">
            <!-- Deporte 1 -->
            <div class="tarjeta-deporte">
                <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                <img src="/Img/football.png" alt="Fútbol" class="icono-deporte">
                <div class="info-deporte">
                    <h3>Fútbol / Futsal / Handball</h3>
                </div>
                <?php echo "<a href='marcador.html?user=$user' class='boton-ir'>Ir</a>";?>
            </div>

            <!-- Deporte 2 -->
            <div class="tarjeta-deporte">
                <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                <img src="/Img/basketball.png" alt="Baloncesto" class="icono-deporte">
                <div class="info-deporte">
                    <h3>Baloncesto</h3>
                </div>
                <a href="bskt.html" class="boton-ir">Ir</a>
            </div>

            <!-- Deporte 3 -->
            <div class="tarjeta-deporte">
                <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                <img src="/Img/tennis.png" alt="Tenis" class="icono-deporte">
                <div class="info-deporte">
                    <h3>Tenis / Ping Pong / Padel</h3>
                </div>
                <a href="tenis.html" class="boton-ir">Ir</a>
            </div>

            <!-- Deporte 4 -->
            <div class="tarjeta-deporte">
                <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                <img src="/Img/volleyball.png" alt="Voleibol" class="icono-deporte">
                <div class="info-deporte">
                    <h3>Voleibol / Beach Voleibol</h3>
                </div>
                <a href="voleibol.html" class="boton-ir">Ir</a>
            </div>

            <!-- Deporte 5 -->
            <div class="tarjeta-deporte">
                <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                <img src="/Img/puck.png" alt="Béisbol" class="icono-deporte">
                <div class="info-deporte">
                    <h3>Hockey / Polo</h3>
                </div>
                <a href="hockey.html" class="boton-ir">Ir</a>
            </div>
            
            <!-- Deporte 6 -->
            <div class="tarjeta-deporte">
                <!-- ¡IMPORTANTE! Asegúrate que '/Img/' tenga la misma capitalización que tu carpeta en GitHub -->
                <img src="/Img/rugby-ball.png" alt="Rugby" class="icono-deporte">
                <div class="info-deporte">
                    <h3>Rugby / Futbol Americano</h3>
                </div>
                <a href="rugby.html" class="boton-ir">Ir</a>
            </div>
        </div>
    </main>
</body>
</html>
