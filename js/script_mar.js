// script_mar.js

// --- Variables para la gestión del temporizador ---
let timerInterval;
let isTimerRunning = false;
let totalSeconds = 0;

// --- ID del marcador actual ---
let currentScoreboardId = null; 

// **NUEVO: Inicializa la conexión con el servidor Socket.IO**
const socket = io(); // Asume que /socket.io/socket.io.js ya está cargado en el HTML

// --- Función para actualizar la interfaz del marcador y los campos de control ---
function updateDisplay(data) {
    if (!data) return; // Asegurarse de que hay datos

    // Actualiza los elementos de visualización del marcador
    document.getElementById('display-team1Name').textContent = data.team1Name; // Era display-team2Name, corregido según tu HTML
    document.getElementById('display-score1').textContent = data.score1;     // Era display-score2, corregido según tu HTML
    document.getElementById('display-team2Name').textContent = data.team2Name; // Era display-team1Name, corregido según tu HTML
    document.getElementById('display-score2').textContent = data.score2;     // Era display-score1, corregido según tu HTML
    document.getElementById('display-gameTime').textContent = data.gameTime;
    document.getElementById('display-gameStatus').textContent = data.gameStatus;

    // Solo actualiza los controles si no estamos en modo OBS
    const isOBSMode = document.body.classList.contains('obs-mode');
    if (!isOBSMode) {
        document.getElementById('control-team1Name').value = data.team1Name;
        document.getElementById('control-score1').value = data.score1;
        document.getElementById('control-team2Name').value = data.team2Name;
        document.getElementById('control-score2').value = data.score2;
        document.getElementById('control-gameStatus').value = data.gameStatus;
    }

    if (typeof data.totalSeconds !== 'undefined') {
        const newTotalSeconds = data.totalSeconds;
        // Solo actualiza totalSeconds si el temporizador no está corriendo,
        // para que el temporizador local no se "reinicie" visualmente si está activo.
        if (!isTimerRunning && newTotalSeconds !== totalSeconds) {
            totalSeconds = newTotalSeconds;
            document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
        }
    }
}

// **NUEVO: Elimina fetchData() y sendUpdates() basadas en Fetch/PHP**
// Toda la comunicación será ahora vía Socket.IO.

// --- Socket.IO: Recibir datos iniciales y actualizaciones ---
// Este evento se emite al cliente justo después de que se une a una sala (por el servidor)
socket.on('currentScoreboardData', (data) => {
    console.log('Datos iniciales del marcador recibidos (Socket.IO):', data);
    updateDisplay(data);
});

// Este evento se emite por el servidor cada vez que hay una actualización en el marcador
socket.on('scoreboardUpdated', (data) => {
    console.log('Marcador actualizado recibido (Socket.IO):', data);
    updateDisplay(data);
});

// **NUEVO: Implementa sendUpdates() para enviar datos vía Socket.IO**
function sendUpdates() {
    if (!currentScoreboardId) {
        console.warn('No hay ID de marcador. No se pueden enviar actualizaciones.');
        return;
    }
    const dataToSend = {
        id: currentScoreboardId, // ¡Fundamental: Incluir el ID del marcador!
        team1Name: document.getElementById('control-team1Name').value,
        score1: parseInt(document.getElementById('control-score1').value, 10),
        team2Name: document.getElementById('control-team2Name').value,
        score2: parseInt(document.getElementById('control-score2').value, 10),
        gameStatus: document.getElementById('control-gameStatus').value,
        totalSeconds: totalSeconds, // Envía totalSeconds como la fuente de verdad del tiempo
    };
    console.log('Enviando actualización via Socket.IO:', dataToSend);
    socket.emit('updateScoreboard', dataToSend); // Emite el evento 'updateScoreboard' al servidor
}

// --- Funciones de control de goles ---
function updateScore(scoreId, change) {
    const scoreInput = document.getElementById(scoreId);
    let currentScore = parseInt(scoreInput.value, 10);
    currentScore += change;
    if (currentScore < 0) currentScore = 0;
    scoreInput.value = currentScore;
    sendUpdates(); // Llama a la nueva sendUpdates() basada en Socket.IO
}

// --- Funciones del temporizador ---
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            totalSeconds++;
            sendUpdates(); // Envía el tiempo actualizado al servidor cada segundo
        }, 1000);
    }
}

function pauseTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    sendUpdates();
}

function resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
    totalSeconds = 0;
    sendUpdates();
}

// --- Event Listeners para los inputs del panel de control ---
// Estos ya llaman a sendUpdates(), lo cual es correcto con la nueva lógica de Socket.IO
document.getElementById('control-team1Name').addEventListener('change', sendUpdates);
document.getElementById('control-score1').addEventListener('change', sendUpdates);
document.getElementById('control-team2Name').addEventListener('change', sendUpdates);
document.getElementById('control-score2').addEventListener('change', sendUpdates);
document.getElementById('control-gameStatus').addEventListener('change', sendUpdates);

// --- Lógica de inicialización (DOMContentLoaded) ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentScoreboardId = urlParams.get('id'); // Obtiene el ID del marcador de la URL

    if (!currentScoreboardId) {
        console.error('ERROR: No se encontró un ID de marcador en la URL. Asegúrate de pasar ?id=UUID');
        // Opcional: Podrías redirigir a una página de error o al menú de creación/selección
        // window.location.href = 'error.html?msg=no_scoreboard_id';
        return; 
    } else {
        console.log('ID de Marcador cargado:', currentScoreboardId);
        // **IMPORTANTE: Unirse a la sala de Socket.IO con el ID del marcador**
        socket.emit('joinScoreboardRoom', currentScoreboardId); // Emite el evento para unirse a la sala
        // Se elimina setInterval(fetchData, 1000) ya que Socket.IO maneja las actualizaciones en tiempo real.
    }

    const isOBS = urlParams.get('obs');
    if (isOBS === 'true') {
        document.body.classList.add('obs-mode');
        console.log('Modo OBS activado: Clase obs-mode añadida al body.');
    } else {
        console.log('Modo OBS NO activado.');
    }
});