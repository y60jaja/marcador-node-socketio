// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io'); // Asegúrate de que esto esté aquí
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Inicializa Socket.IO con el servidor HTTP

const PORT = process.env.PORT || 3000; // Define el puerto, usa 3000 por defecto

// --- Configuración para servir archivos estáticos ---
// Sirve los archivos HTML desde la carpeta 'html'
app.use(express.static(path.join(__dirname, 'html')));
// Sirve los archivos CSS desde la carpeta 'CSS'
app.use('/css', express.static(path.join(__dirname, 'css')));
// Sirve los archivos JS desde la carpeta 'js'
app.use('/js', express.static(path.join(__dirname, 'js')));
// Sirve las imágenes desde la carpeta 'Img'
app.use('/Img', express.static(path.join(__dirname, 'Img')));


// --- Variables de estado del marcador (para Socket.IO) ---
// Este objeto guardará el estado actual del marcador en el servidor.
// Estos son los valores iniciales que se envían a los clientes al conectar.
let scoreboardData = {
    team1Name: 'Equipo 1',
    score1: 0,
    team2Name: 'Equipo 2',
    score2: 0,
    totalSeconds: 0, // Fuente de verdad para el tiempo del temporizador
    gameTime: '00:00', // Representación en string del tiempo
    gameStatus: 'Primer Tiempo'
};

// --- Manejo de Conexiones y Eventos de Socket.IO ---
// Este es el ÚNICO bloque io.on('connection')
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // 1. Envía el estado actual del marcador al cliente recién conectado.
    socket.emit('currentScoreboardData', scoreboardData);

    // 2. Escucha el evento 'updateScoreboard' que viene del cliente (panel de control).
    socket.on('updateScoreboard', (data) => {
        console.log('Datos recibidos del panel de control:', data);

        // Actualiza el estado del marcador en el servidor con los datos recibidos.
        // Se actualizan campo por campo para tener más control.
        if (data.team1Name !== undefined) scoreboardData.team1Name = data.team1Name;
        if (data.score1 !== undefined) scoreboardData.score1 = data.score1;
        if (data.team2Name !== undefined) scoreboardData.team2Name = data.team2Name;
        if (data.score2 !== undefined) scoreboardData.score2 = data.score2;
        if (data.gameStatus !== undefined) scoreboardData.gameStatus = data.gameStatus;

        // Lógica para el temporizador: la fuente de verdad es 'totalSeconds'.
        // Si el cliente envía 'totalSeconds', lo usamos directamente.
        if (typeof data.totalSeconds !== 'undefined') {
            scoreboardData.totalSeconds = data.totalSeconds;
            // Reformatea 'gameTime' para mantener consistencia en el servidor.
            const minutes = Math.floor(data.totalSeconds / 60);
            const remainingSeconds = data.totalSeconds % 60;
            scoreboardData.gameTime = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        } else if (data.gameTime) {
            // Si por alguna razón el cliente solo envía 'gameTime' como string, intentamos parsearlo.
            const parts = data.gameTime.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0], 10);
                const seconds = parseInt(parts[1], 10);
                scoreboardData.totalSeconds = (minutes * 60) + seconds;
                scoreboardData.gameTime = data.gameTime; // Mantenemos el string original.
            }
        }
        
        // 3. Emite la actualización a *TODOS* los clientes conectados (incluyendo tu panel y OBS).
        io.emit('scoreboardUpdated', scoreboardData);
    });

    // 4. Maneja la desconexión de clientes.
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});


// --- Definición de Rutas de Páginas HTML ---

// Ruta principal ('/')
// Al acceder a http://localhost:3000, carga el 'marcador.html' por defecto para el desarrollo.
// Si quieres que el usuario vaya primero al login de PHP, puedes cambiar esto a un res.redirect.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'marcador.html')); 
});

app.get('/entrada.html', (req, res) => {
    const user = req.query.user;
    console.log("Usuario recibido desde PHP:", user);
    res.sendFile(path.join(__dirname, 'html', 'entrada.html'));
});

// Rutas para cada tipo de marcador (asegúrate de que estos archivos existan en /html)
app.get('/marcador.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'marcador.html'));
});

app.get('/bskt.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'bskt.html'));
});

app.get('/tenis.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'tenis.html'));
});

app.get('/voleibol.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'voleibol.html'));
});

app.get('/hockey.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'hockey.html'));
});

app.get('/rugby.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'rugby.html'));
});

server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

