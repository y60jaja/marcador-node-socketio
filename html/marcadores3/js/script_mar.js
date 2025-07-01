// script_mar.js (MODIFICADO para múltiples marcadores)

// Establece la conexión con el servidor Socket.IO.
const socket = io();

// --- Variables para la gestión del temporizador ---
let timerInterval;
let isTimerRunning = false;
let totalSeconds = 0; // Ahora siempre empieza en 0 para contar hacia arriba

// --- Variable para almacenar el ID del marcador actual ---
let currentScoreboardId = null; // Variable global para almacenar el ID del marcador


// --- Función para obtener el ID del marcador de la URL ---
function getScoreboardIdFromUrl() {
    const pathParts = window.location.pathname.split('/');
    // Busca el último segmento que no esté vacío.
    // Si la URL es /marcador/marcador1, obtendrá 'marcador1'.
    // Si la URL es /panel/marcador1, obtendrá 'marcador1'.
    let id = pathParts[pathParts.length - 1];
    if (id === '' && pathParts.length > 1) { // Caso de URL terminada en / (ej. /marcador/marcador1/)
        id = pathParts[pathParts.length - 2];
    }
    return id;
}


// --- Función para actualizar la interfaz del marcador y los campos de control ---
function updateDisplay(data) {
    // Asegurarse de que los datos recibidos corresponden al marcador que estamos gestionando
    if (data.id && data.id !== currentScoreboardId) {
        console.warn(`Recibida actualización para marcador ${data.id}, pero este cliente es ${currentScoreboardId}. Ignorando.`);
        return; // Ignorar si no es nuestro marcador
    }

    const scoreboardData = data.scoreboardData; // Los datos del marcador real están anidados

    // Actualiza los elementos HTML que muestran el marcador (la parte visible para OBS)
    // *** Revísalo si tus display names están invertidos intencionalmente ***
    document.getElementById('display-team1Name').textContent = scoreboardData.team1Name; // Corregido según nombres estándar
    document.getElementById('display-score1').textContent = scoreboardData.score1; // Corregido
    document.getElementById('display-team2Name').textContent = scoreboardData.team2Name; // Corregido
    document.getElementById('display-score2').textContent = scoreboardData.score2; // Corregido
    
    document.getElementById('display-gameTime').textContent = scoreboardData.gameTime;
    document.getElementById('display-gameStatus').textContent = scoreboardData.gameStatus;

    // Actualiza los campos de entrada en tu panel de control para que estén sincronizados
    document.getElementById('control-team1Name').value = scoreboardData.team1Name;
    document.getElementById('control-score1').value = scoreboardData.score1;
    document.getElementById('control-team2Name').value = scoreboardData.team2Name;
    document.getElementById('control-score2').value = scoreboardData.score2;
    document.getElementById('control-gameStatus').value = scoreboardData.gameStatus;

    // Sincroniza la variable interna 'totalSeconds' del cliente con la del servidor.
    if (typeof scoreboardData.totalSeconds !== 'undefined') {
        const newTotalSeconds = scoreboardData.totalSeconds;
        // Solo actualiza totalSeconds del cliente si el temporizador del cliente no está corriendo
        // O si hay una diferencia significativa (para resincronizar en caso de desajuste)
        if (!isTimerRunning || Math.abs(newTotalSeconds - totalSeconds) > 1) {
            totalSeconds = newTotalSeconds;
            // Si el temporizador no está corriendo, actualiza la visualización de inmediato.
            if (!isTimerRunning) {
                document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
            }
        }
    }
}

// --- Escuchar eventos del servidor Socket.IO ---
// Cuando el cliente recibe los datos iniciales o una actualización.
// Ambos eventos ahora esperan un objeto { id, scoreboardData }
socket.on('currentScoreboardData', (data) => {
    console.log('Datos iniciales recibidos del servidor:', data);
    updateDisplay(data);
});

socket.on('scoreboardUpdated', (data) => {
    console.log('Actualización recibida del servidor:', data);
    updateDisplay(data);
});

// --- Funciones para enviar datos al servidor (desde los controles de tu panel) ---
function sendUpdates() {
    if (!currentScoreboardId) {
        console.error('No se ha podido determinar el ID del marcador. No se enviará la actualización.');
        return;
    }

    const dataToSend = {
        id: currentScoreboardId, // ¡AHORA INCLUYE EL ID DEL MARCADOR!
        team1Name: document.getElementById('control-team1Name').value,
        score1: parseInt(document.getElementById('control-score1').value, 10),
        team2Name: document.getElementById('control-team2Name').value,
        score2: parseInt(document.getElementById('control-score2').value, 10),
        gameStatus: document.getElementById('control-gameStatus').value,
        totalSeconds: totalSeconds, // Envía totalSeconds como número
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
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            totalSeconds++; // Cuenta hacia arriba
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

function copiarURL() {
    if (!currentScoreboardId) {
        alert("Primero carga un marcador para copiar su URL específica.");
        return;
    }
    // La URL ahora es dinámica y usa el ID del marcador actual
    var textoCopiar = `${window.location.origin}/marcador/${currentScoreboardId}?obs=true`;
    navigator.clipboard.writeText(textoCopiar)
        .then(() => alert("URL copiada al portapapeles: " + textoCopiar))
        .catch(err => console.error('Error al copiar la URL: ', err));
}


// --- Event Listeners para los inputs del panel de control ---
document.getElementById('control-team1Name').addEventListener('change', sendUpdates);
document.getElementById('control-team2Name').addEventListener('change', sendUpdates);
document.getElementById('control-gameStatus').addEventListener('change', sendUpdates);


// --- Lógica de Inicialización al cargar la página ---
document.addEventListener('DOMContentLoaded', () => {
    currentScoreboardId = getScoreboardIdFromUrl();

    if (currentScoreboardId) {
        console.log(`Cliente cargado para el marcador: ${currentScoreboardId}`);
        // Notifica al servidor a qué marcador nos queremos unir
        socket.emit('joinScoreboard', currentScoreboardId);
    } else {
        console.error('Error: No se pudo obtener el ID del marcador de la URL. Asegúrate de acceder vía /marcador/:id o /panel/:id');
        // Aquí podrías redirigir al usuario a una página de selección de marcador
        alert('URL inválida. Por favor, accede a través de una URL con un ID de marcador (ej. /marcador/marcador1).');
        return; // Detiene la ejecución si no hay ID válido
    }

    // Lógica para el Modo OBS (ocultar panel de control)
    const urlParams = new URLSearchParams(window.location.search);
    const isOBS = urlParams.get('obs');

    if (isOBS === 'true') {
        document.body.classList.add('obs-mode');
        console.log('Modo OBS activado: Clase obs-mode añadida al body.');
    } else {
        console.log('Modo OBS NO activado.');
    }
});