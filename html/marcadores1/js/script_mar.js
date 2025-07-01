// script_mar.js

// Obtiene la ruta actual de la URL
const path = window.location.pathname;
// Extrae el nombre del directorio padre (ej. 'marcadores1', 'marcadores2')
// Se asume que la URL será algo como /html/marcadores1/marcador.html
const pathParts = path.split('/');
// Busca el segmento que precede a 'marcador.html' o 'js'
let marcadorId = 'default'; // Un ID por defecto si no se encuentra
for (let i = pathParts.length - 1; i >= 0; i--) {
    if (pathParts[i] === 'marcador.html' || pathParts[i] === 'js') {
        if (i > 0) {
            marcadorId = pathParts[i - 1]; // Toma el nombre de la carpeta (e.g., 'marcadores1')
            break;
        }
    }
}
console.log('ID de marcador detectado:', marcadorId);

// Establece la conexión con el servidor Socket.IO.
const socket = io();

// --- Variables para la gestión del temporizador ---
let timerInterval;
let isTimerRunning = false;
let totalSeconds = 0;

// --- Función para actualizar la interfaz del marcador y los campos de control ---
function updateDisplay(data) {
    // Asegúrate de que los datos corresponden a ESTE marcador
    if (!data || data.id !== marcadorId) {
        console.warn('Datos recibidos para un marcador diferente o inválido:', data);
        return; // Ignora los datos que no son para este marcador
    }

    // Actualiza los elementos HTML que muestran el marcador (la parte visible para OBS)
    document.getElementById('display-team2Name').textContent = data.team1Name;
    document.getElementById('display-score2').textContent = data.score1;
    document.getElementById('display-team1Name').textContent = data.team2Name;
    document.getElementById('display-score1').textContent = data.score2;
    document.getElementById('display-gameTime').textContent = data.gameTime;
    document.getElementById('display-gameStatus').textContent = data.gameStatus;

    // Actualiza los campos de entrada en tu panel de control para que estén sincronizados
    document.getElementById('control-team1Name').value = data.team1Name;
    document.getElementById('control-score1').value = data.score1;
    document.getElementById('control-team2Name').value = data.team2Name;
    document.getElementById('control-score2').value = data.score2;
    document.getElementById('control-gameStatus').value = data.gameStatus;

    if (typeof data.totalSeconds !== 'undefined') {
        const newTotalSeconds = data.totalSeconds;
        if (newTotalSeconds !== totalSeconds && !isTimerRunning) {
            totalSeconds = newTotalSeconds;
            document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
        }
    }
}

// --- Escuchar eventos del servidor Socket.IO ---
// El servidor ahora enviará 'currentScoreboardData' y 'scoreboardUpdated' con un ID
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
    const dataToSend = {
        id: marcadorId, // *** AHORA SE ENVÍA EL ID DEL MARCADOR ***
        team1Name: document.getElementById('control-team1Name').value,
        score1: parseInt(document.getElementById('control-score1').value, 10),
        team2Name: document.getElementById('control-team2Name').value,
        score2: parseInt(document.getElementById('control-score2').value, 10),
        gameStatus: document.getElementById('control-gameStatus').value,
        totalSeconds: totalSeconds,
        gameTime: formatTime(totalSeconds)
    };
    socket.emit('updateScoreboard', dataToSend);
}

// ... (el resto del código de script_mar.js es el mismo) ...

function copiarURL(){
    // La URL debe ser específica para cada marcador.
    // Esto es solo un ejemplo, necesitarás la base de tu dominio.
    const baseUrl = "https://marcador-server.onrender.com"; // O tu dominio local
    var textoCopiar = `${baseUrl}/html/${marcadorId}/marcador.html?obs=true`;
    navigator.clipboard.writeText(textoCopiar);
    alert("URL copiada al portapapeles: " + textoCopiar);
}

// --- Event Listeners para los inputs del panel de control ---
document.getElementById('control-team1Name').addEventListener('change', sendUpdates);
document.getElementById('control-team2Name').addEventListener('change', sendUpdates);
document.getElementById('control-gameStatus').addEventListener('change', sendUpdates);

// Lógica para el Modo OBS (ocultar panel de control)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isOBS = urlParams.get('obs');

    if (isOBS === 'true') {
        document.body.classList.add('obs-mode');
        console.log('Modo OBS activado: Clase obs-mode añadida al body.');
    } else {
        console.log('Modo OBS NO activado.');
    }
});