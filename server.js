// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// --- Configuración para servir archivos estáticos ---
// Sirve los archivos HTML desde la carpeta 'html'
app.use(express.static(path.join(__dirname, 'html')));
// Sirve los archivos CSS desde la carpeta 'CSS'
app.use('/css', express.static(path.join(__dirname, 'css')));
// Sirve los archivos JS desde la carpeta 'js'
app.use('/js', express.static(path.join(__dirname, 'js')));
// Sirve las imágenes desde la carpeta 'Img'
app.use('/Img', express.static(path.join(__dirname, 'Img')));

// --- Variables de estado de los marcadores (para Socket.IO) ---
// Este objeto guardará el estado actual de cada marcador en el servidor.
// Cada clave es un ID de marcador único.
let scoreboards = {
    'marcador1': {
        team1Name: 'Equipo 1 Local',
        score1: 0,
        team2Name: 'Equipo 1 Visita',
        score2: 0,
        totalSeconds: 0, // Fuente de verdad para el tiempo del temporizador
        gameTime: '00:00', // Representación en string del tiempo
        gameStatus: 'Primer Tiempo'
    },
    'marcador2': {
        team1Name: 'Equipo 2 Casa',
        score1: 0,
        team2Name: 'Equipo 2 Fuera',
        score2: 0,
        totalSeconds: 0,
        gameTime: '00:00',
        gameStatus: 'Segundo Tiempo'
    },
    'marcador3': {
        team1Name: 'Los Rojos',
        score1: 0,
        team2Name: 'Los Azules',
        score2: 0,
        totalSeconds: 0,
        gameTime: '00:00',
        gameStatus: 'Tiempo Extra'
    },
    'marcador4': {
        team1Name: 'Equipo Alpha',
        score1: 0,
        team2Name: 'Equipo Beta',
        score2: 0,
        totalSeconds: 0,
        gameTime: '00:00',
        gameStatus: 'Finalizado'
    }
};

// --- Manejo de Conexiones y Eventos de Socket.IO ---
io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // 1. Escucha el evento 'joinScoreboard' para que el cliente especifique qué marcador le interesa.
    socket.on('joinScoreboard', (scoreboardId) => {
        if (scoreboards[scoreboardId]) {
            socket.join(scoreboardId); // Une el socket a una "sala" específica de Socket.IO
            console.log(`Cliente ${socket.id} se unió a la sala: ${scoreboardId}`);
            // Envía el estado actual de ESE marcador al cliente que se unió
            socket.emit('currentScoreboardData', {
                id: scoreboardId,
                scoreboardData: scoreboards[scoreboardId]
            });
        } else {
            console.warn(`Intento de cliente ${socket.id} de unirse a marcador inexistente: ${scoreboardId}`);
            // Opcional: podrías emitir un evento de error al cliente
        }
    });

    // 2. Escucha el evento 'updateScoreboard' que viene del cliente (panel de control).
    // Ahora, este evento debe incluir el 'id' del marcador a actualizar.
    socket.on('updateScoreboard', (data) => {
        const { id, ...updates } = data; // Extrae el 'id' y el resto son las 'updates'
        console.log(`Datos recibidos para el marcador ${id} del panel de control:`, updates);

        if (id && scoreboards[id]) {
            // Actualiza el estado del marcador específico en el servidor con los datos recibidos.
            if (updates.team1Name !== undefined) scoreboards[id].team1Name = updates.team1Name;
            if (updates.score1 !== undefined) scoreboards[id].score1 = updates.score1;
            if (updates.team2Name !== undefined) scoreboards[id].team2Name = updates.team2Name;
            if (updates.score2 !== undefined) scoreboards[id].score2 = updates.score2;
            if (updates.gameStatus !== undefined) scoreboards[id].gameStatus = updates.gameStatus;

            // Lógica para el temporizador: la fuente de verdad es 'totalSeconds'.
            if (typeof updates.totalSeconds !== 'undefined') {
                scoreboards[id].totalSeconds = updates.totalSeconds;
                const minutes = Math.floor(updates.totalSeconds / 60);
                const remainingSeconds = updates.totalSeconds % 60;
                scoreboards[id].gameTime = `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
            } else if (updates.gameTime) {
                const parts = updates.gameTime.split(':');
                if (parts.length === 2) {
                    const minutes = parseInt(parts[0], 10);
                    const seconds = parseInt(parts[1], 10);
                    scoreboards[id].totalSeconds = (minutes * 60) + seconds;
                    scoreboards[id].gameTime = updates.gameTime;
                }
            }
            
            // 3. Emite la actualización a *TODOS* los clientes conectados a la sala de ESE marcador.
            io.to(id).emit('scoreboardUpdated', {
                id: id,
                scoreboardData: scoreboards[id]
            });
        } else {
            console.warn(`Actualización recibida para un marcador no válido o sin ID: ${id}`);
        }
    });

    // 4. Maneja la desconexión de clientes.
    socket.on('disconnect', () => {
        console.log('Cliente desconectado:', socket.id);
    });
});


// --- Definición de Rutas de Páginas HTML ---

// Ruta principal ('/') que podría llevar a una página de selección de marcadores
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'seleccion_marcador.html')); // Asume que tienes un HTML llamado seleccion_marcador.html
});

// Ruta para el manejo de la entrada, posiblemente desde un login de PHP
app.get('/entrada.html', (req, res) => {
    const user = req.query.user;
    console.log("Usuario recibido desde PHP:", user);
    res.sendFile(path.join(__dirname, 'html', 'entrada.html'));
});

// Ruta dinámica para visualizar los marcadores
// Por ejemplo, para ver el marcador 1, ir a http://localhost:3000/marcador/marcador1
app.get('/marcador/:id', (req, res) => {
    const scoreboardId = req.params.id;
    if (scoreboards[scoreboardId]) {
        // Asumimos que tienes un HTML genérico que se encargará de mostrar cualquier marcador
        res.sendFile(path.join(__dirname, 'html', 'marcador_generico.html')); 
    } else {
        res.status(404).send('Marcador no encontrado. Por favor, verifica el ID.');
    }
});

// Ruta dinámica para los paneles de control
// Por ejemplo, para controlar el marcador 1, ir a http://localhost:3000/panel/marcador1
app.get('/panel/:id', (req, res) => {
    const scoreboardId = req.params.id;
    if (scoreboards[scoreboardId]) {
        // Necesitas un archivo HTML para el panel de control, por ejemplo, panel_control_generico.html
        res.sendFile(path.join(__dirname, 'html', 'panel_control_generico.html')); 
    } else {
        res.status(404).send('Panel de control para este marcador no encontrado.');
    }
});


server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});