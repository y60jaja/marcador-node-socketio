// script_mar.js

// 1. Detección de marcadorId (¡Esto debe ser lo primero y fuera de DOMContentLoaded!)
const path = window.location.pathname;
// Ejemplo de path: "/html/marcadores1/marcador.html"
// Queremos extraer "marcadores1" o "bskt" si es "/bskt.html"
const pathSegments = path.split('/').filter(segment => segment !== ''); // Divide y filtra segmentos vacíos

let marcadorId = 'default'; // Un ID por defecto si no se encuentra
if (pathSegments.length >= 2 && pathSegments[pathSegments.length - 2].startsWith('marcadores')) {
    // Si la URL es como /html/marcadores1/marcador.html
    marcadorId = pathSegments[pathSegments.length - 2];
} else if (pathSegments.length >= 1 && pathSegments[pathSegments.length - 1].endsWith('.html')) {
    // Si la URL es directa a un HTML como /bskt.html
    marcadorId = pathSegments[pathSegments.length - 1].replace('.html', '');
}
console.log('ID de marcador detectado:', marcadorId);


// 2. Conexión con el servidor Socket.IO (¡Después de tener el marcadorId!)
const socket = io();

// --- Variables para la gestión del temporizador ---
let timerInterval;
let isTimerRunning = false;
let totalSeconds = 0; // Esta variable ahora se inicializará con el tiempo manual

// --- Función para actualizar la interfaz del marcador y los campos de control ---
function updateDisplay(data) {
    // Asegúrate de que los datos corresponden a ESTE marcador
    if (!data || data.id !== marcadorId) {
        console.warn('Datos recibidos para un marcador diferente o inválido:', data);
        return; // Ignora los datos que no son para este marcador
    }

    // Actualiza los elementos HTML que muestran el marcador (la parte visible para OBS)
    document.getElementById('display-team1Name').textContent = data.team1Name; // Cambiado para que coincida con el HTML
    document.getElementById('display-score1').textContent = data.score1;     // Cambiado para que coincida con el HTML
    document.getElementById('display-team2Name').textContent = data.team2Name; // Cambiado para que coincida con el HTML
    document.getElementById('display-score2').textContent = data.score2;     // Cambiado para que coincida con el HTML
    document.getElementById('display-gameTime').textContent = data.gameTime;
    document.getElementById('display-gameStatus').textContent = data.gameStatus;

    // Actualiza los campos de entrada en tu panel de control para que estén sincronizados
    document.getElementById('control-team1Name').value = data.team1Name;
    document.getElementById('control-score1').value = data.score1;
    document.getElementById('control-team2Name').value = data.team2Name;
    document.getElementById('control-score2').value = data.score2;
    document.getElementById('control-gameStatus').value = data.gameStatus;

    // Actualiza los inputs manuales con el tiempo actual del servidor (siempre que no estemos editando)
    if (!isTimerRunning) { // Solo actualiza si el temporizador no está corriendo para no sobrescribir la entrada del usuario
        const minutes = Math.floor(data.totalSeconds / 60);
        const seconds = data.totalSeconds % 60;
        document.getElementById('initialMinutes').value = minutes;
        document.getElementById('initialSeconds').value = seconds;
    }

    if (typeof data.totalSeconds !== 'undefined') {
        const newTotalSeconds = data.totalSeconds;
        // Solo actualiza totalSeconds si no está corriendo el temporizador del cliente
        // O si hay una diferencia significativa (para sincronización al pausar/reiniciar desde otro lado)
        if (newTotalSeconds !== totalSeconds && !isTimerRunning) {
             totalSeconds = newTotalSeconds;
             document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
             document.getElementById('control-gameTime').textContent = formatTime(totalSeconds); // Actualiza también el tiempo en el panel
        } else if (isTimerRunning && Math.abs(newTotalSeconds - totalSeconds) > 2) { // Permitir una pequeña desincronización
             // Si el temporizador está corriendo y hay una desincronización grande, forzar la sincronización
             totalSeconds = newTotalSeconds;
             document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
             document.getElementById('control-gameTime').textContent = formatTime(totalSeconds);
        }
    }
}

// --- Escuchar eventos del servidor Socket.IO ---
// Cuando el servidor envía el estado inicial O una actualización, se llama a updateDisplay.
// La función updateDisplay se encarga de filtrar por ID.
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

// Nueva función para establecer el tiempo manualmente
function setManualTime() {
    const initialMinutes = parseInt(document.getElementById('initialMinutes').value, 10);
    const initialSeconds = parseInt(document.getElementById('initialSeconds').value, 10);

    // Validar que los valores sean números y no sean negativos
    if (isNaN(initialMinutes) || isNaN(initialSeconds) || initialMinutes < 0 || initialSeconds < 0) {
        alert('Por favor, ingresa valores válidos para minutos y segundos (números positivos).');
        return;
    }

    totalSeconds = (initialMinutes * 60) + initialSeconds;
    document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
    document.getElementById('control-gameTime').textContent = formatTime(totalSeconds); // Actualiza el panel
    sendUpdates(); // Envía el tiempo manual al servidor
}


function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            totalSeconds++; // ¡Ahora cuenta hacia arriba!
            sendUpdates();  // Envía el tiempo actualizado al servidor cada segundo
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
    document.getElementById('initialMinutes').value = 0; // Resetea también los inputs manuales
    document.getElementById('initialSeconds').value = 0; // Resetea también los inputs manuales
    sendUpdates();     // Envía el tiempo reseteado al servidor
}

function copiarURL(){
    const baseUrl = window.location.origin; // Obtiene la base de la URL actual (ej. http://localhost:3000)
    let textoCopiar;
    if (marcadorId && marcadorId.startsWith('marcadores')) {
        // Para URLs tipo /html/marcadores1/marcador.html
        textoCopiar = `${baseUrl}/${marcadorId}/marcador.html?obs=true`;
    } else if (marcadorId && marcadorId !== 'default') {
        // Para URLs tipo /bskt.html si están directamente en la raíz de 'html'
        textoCopiar = `${baseUrl}/${marcadorId}.html?obs=true`;
    } else {
        // Caso por defecto o si no se pudo determinar un ID específico
        textoCopiar = `${baseUrl}/marcador.html?obs=true`;
    }
    navigator.clipboard.writeText(textoCopiar);
    alert("URL copiada al portapapeles: " + textoCopiar);
}

// --- Event Listeners para los inputs del panel de control ---
// Estos deben ejecutarse después de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
    // Primero, solicitar los datos iniciales para ESTE marcador
    console.log('DOM Cargado. Solicitando datos iniciales para el marcador:', marcadorId);
    socket.emit('requestInitialScoreboardData', marcadorId);

    // Adjuntar Event Listeners para los inputs de control
    const controlTeam1Name = document.getElementById('control-team1Name');
    const controlScore1 = document.getElementById('control-score1');
    const controlTeam2Name = document.getElementById('control-team2Name');
    const controlScore2 = document.getElementById('control-score2');
    const controlGameStatus = document.getElementById('control-gameStatus');

    // Se añaden los event listeners de 'change' para los inputs de puntaje
    if (controlTeam1Name) controlTeam1Name.addEventListener('change', sendUpdates);
    if (controlScore1) controlScore1.addEventListener('change', sendUpdates);
    if (controlTeam2Name) controlTeam2Name.addEventListener('change', sendUpdates);
    if (controlScore2) controlScore2.addEventListener('change', sendUpdates);
    if (controlGameStatus) controlGameStatus.addEventListener('change', sendUpdates);

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