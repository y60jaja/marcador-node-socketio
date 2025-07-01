// script_mar.js

// Establece la conexión con el servidor Socket.IO.
// 'io()' es una función global proporcionada por el script /socket.io/socket.io.js
const socket = io();

// --- Variables para la gestión del temporizador ---
let timerInterval;
let isTimerRunning = false;
let totalSeconds = 0; // Ahora siempre empieza en 0 para contar hacia arriba

// --- Función para actualizar la interfaz del marcador y los campos de control ---
function updateDisplay(data) {
    // Actualiza los elementos HTML que muestran el marcador (la parte visible para OBS)
    document.getElementById('display-team2Name').textContent = data.team1Name;
    document.getElementById('display-score2').textContent = data.score1;
    document.getElementById('display-team1Name').textContent = data.team2Name;
    document.getElementById('display-score1').textContent = data.score2;
    // Siempre actualiza el tiempo con el dato formateado que viene del servidor (data.gameTime)
    document.getElementById('display-gameTime').textContent = data.gameTime;
    document.getElementById('display-gameStatus').textContent = data.gameStatus;

    // Actualiza los campos de entrada en tu panel de control para que estén sincronizados
    document.getElementById('control-team1Name').value = data.team1Name;
    document.getElementById('control-score1').value = data.score1;
    document.getElementById('control-team2Name').value = data.team2Name;
    document.getElementById('control-score2').value = data.score2;
    document.getElementById('control-gameStatus').value = data.gameStatus;

    // Sincroniza la variable interna 'totalSeconds' del cliente con la del servidor.
    // Esto es crucial para que el temporizador del cliente se mantenga sincronizado.
    // Solo actualiza si el temporizador del cliente no está corriendo, para evitar saltos.
    if (typeof data.totalSeconds !== 'undefined') {
        const newTotalSeconds = data.totalSeconds;
        if (newTotalSeconds !== totalSeconds && !isTimerRunning) {
            totalSeconds = newTotalSeconds;
            // Opcional: Si el temporizador no está corriendo, actualiza la visualización de inmediato.
            // Si está corriendo, setInterval ya se encargará de actualizarlo cada segundo.
            document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
        }
    }
}

// --- Escuchar eventos del servidor Socket.IO ---
// Cuando el cliente se conecta, el servidor le envía el estado inicial del marcador.
socket.on('currentScoreboardData', (data) => {
    console.log('Datos iniciales recibidos del servidor:', data);
    updateDisplay(data);
});

// Cuando el servidor envía una actualización (porque otro cliente cambió algo), actualiza la vista.
socket.on('scoreboardUpdated', (data) => {
    console.log('Actualización recibida del servidor:', data);
    updateDisplay(data);
});

// --- Funciones para enviar datos al servidor (desde los controles de tu panel) ---
function sendUpdates() {
    const dataToSend = {
        team1Name: document.getElementById('control-team1Name').value,
        score1: parseInt(document.getElementById('control-score1').value, 10),
        team2Name: document.getElementById('control-team2Name').value,
        score2: parseInt(document.getElementById('control-score2').value, 10),
        gameStatus: document.getElementById('control-gameStatus').value,
        totalSeconds: totalSeconds, // ¡AHORA ENVÍA totalSeconds como número!
        gameTime: formatTime(totalSeconds) // Mantiene gameTime para consistencia si el servidor lo usa
    };
    socket.emit('updateScoreboard', dataToSend); // Emite el evento al servidor
}

// --- Funciones de control de goles ---
function updateScore(scoreId, change) {
    const scoreInput = document.getElementById(scoreId);
    let currentScore = parseInt(scoreInput.value, 10);
    currentScore += change;
    if (currentScore < 0) currentScore = 0; // Evita puntuaciones negativas
    scoreInput.value = currentScore;
    sendUpdates(); // Envía la actualización al servidor inmediatamente
}

// --- Funciones del temporizador (contando hacia arriba) ---
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    // Esta es la línea que formatea el tiempo a MM:SS.
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            totalSeconds++; // ¡Ahora cuenta hacia arriba!
            sendUpdates();  // Envía el tiempo actualizado al servidor cada segundo
        }, 1000); // Se ejecuta cada 1 segundo
    }
}

function pauseTimer() {
    clearInterval(timerInterval); // Detiene el intervalo del temporizador
    isTimerRunning = false;
    sendUpdates(); // Envía el estado actual del tiempo al servidor
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    totalSeconds = 0; // Reinicia el contador a 0
    sendUpdates();    // Envía el tiempo reseteado al servidor
}

function copiarURL(){
    var textoCopiar = "https://marcador-server.onrender.com/marcador.html?obs=true";
    navigator.clipboard.writeText(textoCopiar);
}

// --- Event Listeners para los inputs del panel de control ---
// Cuando el usuario cambia el valor de un input de texto o select, se envía la actualización.
document.getElementById('control-team1Name').addEventListener('change', sendUpdates);
document.getElementById('control-team2Name').addEventListener('change', sendUpdates);
document.getElementById('control-gameStatus').addEventListener('change', sendUpdates);

// Asegúrate de que los botones en tu HTML (para goles, iniciar/pausar/resetear tiempo)
// llamen a estas funciones usando 'onclick'. Ejemplo:
// <button onclick="updateScore('control-score1', 1)">+1</button>
// <button onclick="startTimer()">INICIAR</button>

// --- Lógica para el Modo OBS (ocultar panel de control) ---
document.addEventListener('DOMContentLoaded', () => {
    // Obtiene los parámetros de la URL (ej. ?obs=true)
    const urlParams = new URLSearchParams(window.location.search);
    const isOBS = urlParams.get('obs'); // Obtiene el valor del parámetro 'obs'

    // Si el parámetro 'obs' existe y su valor es 'true'
    if (isOBS === 'true') {
        // Añade una clase 'obs-mode' al body del documento
        document.body.classList.add('obs-mode');
        // Opcional: Puedes quitar estos console.log en producción
        console.log('Modo OBS activado: Clase obs-mode añadida al body.');
    } else {
        console.log('Modo OBS NO activado.');
    }
});
