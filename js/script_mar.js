// script_mar.js

// --- Variables para la gestión del temporizador ---
let timerInterval;
let isTimerRunning = false;
let totalSeconds = 0;

// --- ID del marcador actual ---
let currentScoreboardId = null; 

// --- URL de tu API PHP para el marcador ---
// **IMPORTANTE**: Ajusta esta URL a la ruta de tu script api_marcador.php en Render
const API_BASE_URL = 'http://localhost/api_marcador.php'; 
// Si tu PHP está en un subdirectorio en Render, ej: https://tu-sitio.onrender.com/api/api_marcador.php

// --- Función para actualizar la interfaz del marcador y los campos de control ---
function updateDisplay(data) {
    if (!data) return; // Asegurarse de que hay datos

    document.getElementById('display-team2Name').textContent = data.team1Name;
    document.getElementById('display-score2').textContent = data.score1;
    document.getElementById('display-team1Name').textContent = data.team2Name;
    document.getElementById('display-score1').textContent = data.score2;
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
        if (!isTimerRunning && newTotalSeconds !== totalSeconds) {
            totalSeconds = newTotalSeconds;
            document.getElementById('display-gameTime').textContent = formatTime(totalSeconds);
        }
    }
}

// --- Función para obtener datos del servidor (desde la DB vía PHP) ---
async function fetchData() {
    if (!currentScoreboardId) {
        console.warn('No hay ID de marcador. No se pueden obtener datos.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}?id=${currentScoreboardId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Datos recibidos del marcador (DB):', data);
        updateDisplay(data);
    } catch (error) {
        console.error('Error al obtener datos del marcador:', error);
    }
}

// --- Función para enviar datos al servidor (guardar en la DB vía PHP) ---
async function sendUpdates() {
    if (!currentScoreboardId) {
        console.warn('No hay ID de marcador. No se pueden enviar actualizaciones.');
        return;
    }
    const dataToSend = {
        team1Name: document.getElementById('control-team1Name').value,
        score1: parseInt(document.getElementById('control-score1').value, 10),
        team2Name: document.getElementById('control-team2Name').value,
        score2: parseInt(document.getElementById('control-score2').value, 10),
        gameStatus: document.getElementById('control-gameStatus').value,
        totalSeconds: totalSeconds,
        // gameTime no es necesario enviarlo, el backend lo puede formatear si es necesario
    };

    try {
        const response = await fetch(`${API_BASE_URL}?id=${currentScoreboardId}`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend) 
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        console.log('Respuesta del servidor (actualización):', result);
    } catch (error) {
        console.error('Error al enviar datos al marcador:', error);
    }
}

// --- Funciones de control de goles ---
function updateScore(scoreId, change) {
    const scoreInput = document.getElementById(scoreId);
    let currentScore = parseInt(scoreInput.value, 10);
    currentScore += change;
    if (currentScore < 0) currentScore = 0;
    scoreInput.value = currentScore;
    sendUpdates();
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
            sendUpdates();
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
document.getElementById('control-team1Name').addEventListener('change', sendUpdates);
document.getElementById('control-score1').addEventListener('change', sendUpdates); // Añadido para cambios directos
document.getElementById('control-team2Name').addEventListener('change', sendUpdates);
document.getElementById('control-score2').addEventListener('change', sendUpdates); // Añadido para cambios directos
document.getElementById('control-gameStatus').addEventListener('change', sendUpdates);

// --- Lógica para el Modo OBS (ocultar panel de control) ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentScoreboardId = urlParams.get('id'); // Obtiene el ID del marcador de la URL

    if (!currentScoreboardId) {
        console.error('ERROR: No se encontró un ID de marcador en la URL. Redirigiendo o mostrando error.');
        // Opcional: Podrías redirigir a una página de error o al login si no hay ID
        // window.location.href = 'error.html?msg=no_scoreboard_id';
        // return; 
    } else {
        console.log('ID de Marcador cargado:', currentScoreboardId);
        fetchData(); // Carga los datos iniciales para este marcador
        // Configura el sondeo para que el display de OBS o otros clientes se actualicen
        setInterval(fetchData, 1000); // Sondea cada segundo
    }

    const isOBS = urlParams.get('obs');
    if (isOBS === 'true') {
        document.body.classList.add('obs-mode');
        console.log('Modo OBS activado: Clase obs-mode añadida al body.');
    } else {
        console.log('Modo OBS NO activado.');
    }
});